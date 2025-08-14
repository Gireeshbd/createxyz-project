import { supabase, getUser } from '../../../lib/supabase-server.js'

// GET /api/jobs - List jobs with filtering and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 20;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching jobs:", error);
      return Response.json(
        { success: false, error: "Failed to fetch jobs" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      jobs: jobs || [],
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return Response.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job (requires authentication)
export async function POST(request) {
  try {
    console.log('=== SIMPLIFIED JOB CREATION ===')

    const user = await getUser(request)
    console.log('User from getUser:', user)

    if (!user) {
      console.log('No user found, returning 401')
      return Response.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body)

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
      console.log('Missing required fields')
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user profile for poster info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    console.log('Profile data:', profile)
    console.log('Profile error:', profileError)

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
    }

    console.log('Job data to insert:', jobData)

    const { data: job, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select('id, title, created_at')
      .single()

    console.log('Insert result:', { job, error })

    if (error) {
      console.error("Database error:", error);
      return Response.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      job,
      message: "Job posted successfully",
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json(
      { success: false, error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
}