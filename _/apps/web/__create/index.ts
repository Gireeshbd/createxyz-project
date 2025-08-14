import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
// Temporarily disabled - migrating to Supabase Auth
// import { skipCSRFCheck } from '@auth/core';
// import Credentials from '@auth/core/providers/credentials';
// import { authHandler, initAuthConfig } from '@hono/auth-js';
// import pg from 'pg'; // Temporarily disabled
// Temporarily removed unused imports during Supabase migration
// import { hash, verify } from 'argon2';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { requestId } from 'hono/request-id';
import { createHonoServer } from 'react-router-hono-server/node';
import { serializeError } from 'serialize-error';
// import NeonAdapter from './adapter';
import { getHTMLForErrorPage } from './get-html-for-error-page';
// import { isAuthAction } from './is-auth-action';
import { API_BASENAME, api } from './route-builder';

const als = new AsyncLocalStorage<{ requestId: string }>();

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

// Temporarily disabled database adapter during Supabase migration
// const { Pool } = pg;
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });
// const adapter = NeonAdapter(pool);

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    return c.json(
      {
        error: 'An error occurred in your app',
        details: serializeError(err),
      },
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}

// Temporarily disabled - migrating to Supabase Auth
// The old auth system has been disabled during migration to Supabase
console.log('Auth system temporarily disabled during Supabase migration');
app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-ignore - this key is accepted even if types not aware and is
    // required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

// Temporarily disabled - auth routes disabled during Supabase migration
// app.use('/api/auth/*', async (c, next) => {
//   if (isAuthAction(c.req.path)) {
//     return authHandler()(c, next);
//   }
//   return next();
// });
// Add direct API routes to bypass the route builder issues
app.get('/api/debug', (c) => {
  return c.json({
    message: 'Direct API route working',
    timestamp: new Date().toISOString()
  });
});

// Direct jobs API routes
app.get('/api/jobs', async (c) => {
  try {
    const { supabase } = await import('../src/lib/supabase-server.js');

    if (!supabase) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    const limit = parseInt(c.req.query('limit') || '20');
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching jobs:", error);
      return c.json({ success: false, error: "Failed to fetch jobs" }, 500);
    }

    return c.json({ success: true, jobs: jobs || [] });
  } catch (error) {
    console.error("Error in jobs GET:", error);
    return c.json({ success: false, error: "Failed to fetch jobs" }, 500);
  }
});

app.post('/api/jobs', async (c) => {
  try {
    console.log('=== DIRECT JOBS POST ROUTE ===');

    const { supabase, supabaseAdmin, getUser } = await import('../src/lib/supabase-server.js');

    if (!supabase || !supabaseAdmin) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    const user = await getUser(c.req.raw);
    console.log('User from getUser:', user);

    if (!user) {
      console.log('No user found, returning 401');
      return c.json({ success: false, error: "Authentication required" }, 401);
    }

    const body = await c.req.json();
    console.log('Request body:', body);

    const {
      title,
      description,
      category,
      location,
      duration,
      pay_type,
      pay_amount,
      urgent,
      poster_phone,
      requirements,
    } = body;

    // Validate required fields
    if (!title || !description || !category || !location || !duration || !pay_type || !pay_amount) {
      console.log('Missing required fields');
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Get user profile for poster info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    console.log('Profile data:', profile);
    console.log('Profile error:', profileError);

    const jobData = {
      title,
      description,
      category,
      location,
      duration,
      pay_type,
      pay_amount: parseFloat(pay_amount),
      urgent: urgent || false,
      poster_name: profile?.full_name || user.email,
      poster_email: user.email,
      poster_phone: poster_phone || null,
      requirements: requirements || null,
      user_id: user.id,
      status: 'active'
    };

    console.log('Job data to insert:', jobData);

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert(jobData)
      .select('id, title, created_at')
      .single();

    console.log('Insert result:', { job, error });

    if (error) {
      console.error("Database error:", error);
      return c.json({ success: false, error: `Database error: ${error.message}` }, 500);
    }

    return c.json({
      success: true,
      job,
      message: "Job posted successfully",
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return c.json({ success: false, error: `Unexpected error: ${error.message}` }, 500);
  }
});

// GET /api/jobs/my - Get user's jobs
app.get('/api/jobs/my', async (c) => {
  try {
    const { supabaseAdmin, getUser } = await import('../src/lib/supabase-server.js');

    if (!supabaseAdmin) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    const user = await getUser(c.req.raw);
    if (!user) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }

    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return c.json({ success: false, error: `Database error: ${error.message}` }, 500);
    }

    return c.json({
      success: true,
      jobs: jobs || [],
    });

  } catch (error) {
    console.error("Error fetching user jobs:", error);
    return c.json({ success: false, error: `Unexpected error: ${error.message}` }, 500);
  }
});

// GET /api/jobs/:id/applications - Get applications for a job
app.get('/api/jobs/:id/applications', async (c) => {
  try {
    const jobId = c.req.param('id');
    const { supabaseAdmin, getUser } = await import('../src/lib/supabase-server.js');

    if (!supabaseAdmin) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    const user = await getUser(c.req.raw);
    if (!user) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }

    // Check if user owns the job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, user_id, title')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return c.json({ success: false, error: "Job not found" }, 404);
    }

    if (job.user_id !== user.id) {
      return c.json({ success: false, error: "You can only view applications for your own jobs" }, 403);
    }

    // Get applications with applicant profile data
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        user_id,
        applicant_name,
        applicant_email,
        message,
        hourly_rate,
        availability,
        experience,
        status,
        applied_at,
        updated_at,
        user_profiles!inner(
          full_name,
          bio,
          profile_image,
          worker_rating,
          worker_review_count,
          total_jobs_completed,
          skills,
          location
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      return c.json({ success: false, error: "Failed to fetch applications" }, 500);
    }

    // Format applications data
    const formattedApplications = applications.map(app => ({
      id: app.id,
      user_id: app.user_id,
      applicant_name: app.user_profiles.full_name || app.applicant_name,
      applicant_email: app.applicant_email,
      message: app.message,
      hourly_rate: app.hourly_rate,
      availability: app.availability,
      experience: app.experience,
      status: app.status,
      applied_at: app.applied_at,
      updated_at: app.updated_at,
      profile: {
        full_name: app.user_profiles.full_name,
        bio: app.user_profiles.bio,
        profile_image: app.user_profiles.profile_image,
        worker_rating: app.user_profiles.worker_rating,
        worker_review_count: app.user_profiles.worker_review_count,
        total_jobs_completed: app.user_profiles.total_jobs_completed,
        skills: app.user_profiles.skills,
        location: app.user_profiles.location
      }
    }));

    return c.json({
      success: true,
      job: {
        id: job.id,
        title: job.title
      },
      applications: formattedApplications,
      total: applications.length
    });

  } catch (error) {
    console.error("Error fetching applications:", error);
    return c.json({ success: false, error: `Unexpected error: ${error.message}` }, 500);
  }
});

// PUT /api/applications/:id/status - Update application status
app.put('/api/applications/:id/status', async (c) => {
  try {
    const applicationId = c.req.param('id');
    const { supabaseAdmin, getUser } = await import('../src/lib/supabase-server.js');

    if (!supabaseAdmin) {
      return c.json({ success: false, error: 'Supabase not configured' }, 500);
    }

    const user = await getUser(c.req.raw);
    if (!user) {
      return c.json({ success: false, error: "Authentication required" }, 401);
    }

    const body = await c.req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return c.json({ success: false, error: "Invalid status. Must be one of: " + validStatuses.join(', ') }, 400);
    }

    // Get application with job info
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('job_applications')
      .select(`
        id,
        user_id,
        status,
        jobs!inner(
          id,
          user_id,
          title,
          status as job_status
        )
      `)
      .eq('id', applicationId)
      .single();

    if (applicationError || !application) {
      return c.json({ success: false, error: "Application not found" }, 404);
    }

    // Check permissions
    const isJobOwner = application.jobs.user_id === user.id;
    const isApplicant = application.user_id === user.id;

    if (!isJobOwner && !isApplicant) {
      return c.json({ success: false, error: "You don't have permission to update this application" }, 403);
    }

    // Business logic checks
    if (status === 'withdrawn' && !isApplicant) {
      return c.json({ success: false, error: "Only applicants can withdraw their applications" }, 403);
    }

    if ((status === 'accepted' || status === 'rejected') && !isJobOwner) {
      return c.json({ success: false, error: "Only job owners can accept or reject applications" }, 403);
    }

    // Check if job is still active for acceptance
    if (status === 'accepted' && application.jobs.job_status !== 'active') {
      return c.json({ success: false, error: "Cannot accept applications for inactive jobs" }, 400);
    }

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabaseAdmin
      .from('job_applications')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select('id, status, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return c.json({ success: false, error: "Failed to update application status" }, 500);
    }

    // If application is accepted, update job status and assign worker
    if (status === 'accepted') {
      const { error: jobUpdateError } = await supabaseAdmin
        .from('jobs')
        .update({
          status: 'assigned',
          assigned_to: application.user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.jobs.id);

      if (jobUpdateError) {
        console.error('Error updating job status:', jobUpdateError);
        // Don't fail the request, but log the error
      }

      // Reject all other pending applications for this job
      const { error: rejectError } = await supabaseAdmin
        .from('job_applications')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('job_id', application.jobs.id)
        .eq('status', 'pending')
        .neq('id', applicationId);

      if (rejectError) {
        console.error('Error rejecting other applications:', rejectError);
        // Don't fail the request, but log the error
      }
    }

    return c.json({
      success: true,
      application: updatedApplication,
      message: `Application ${status} successfully`,
    });

  } catch (error) {
    console.error("Error updating application status:", error);
    return c.json({ success: false, error: `Unexpected error: ${error.message}` }, 500);
  }
});

app.route(API_BASENAME, api);

export default await createHonoServer({
  app,
  defaultLogger: false,
});
