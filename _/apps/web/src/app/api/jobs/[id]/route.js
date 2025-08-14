import { supabase, getUser } from '../../../../lib/supabase-server.js'

// GET /api/jobs/[id] - Get a specific job with user profile data
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        user_profiles!inner(
          full_name,
          bio,
          profile_image,
          worker_rating,
          worker_review_count,
          employer_rating,
          employer_review_count,
          total_jobs_completed,
          total_jobs_posted
        )
      `)
      .eq('id', id)
      .single()

    if (error || !job) {
      return Response.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    // Get reviews for the job poster if they exist
    const { data: reviews } = await supabase
      .from('user_reviews')
      .select(`
        rating,
        review_text,
        created_at,
        user_profiles!reviewer_id(
          full_name,
          profile_image
        )
      `)
      .eq('reviewee_id', job.user_id)
      .eq('review_type', 'employer')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get application count for this job
    const { count: applicationCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', id)

    return Response.json({
      success: true,
      job: {
        ...job,
        poster_full_name: job.user_profiles.full_name,
        poster_bio: job.user_profiles.bio,
        poster_profile_image: job.user_profiles.profile_image,
        worker_rating: job.user_profiles.worker_rating,
        worker_review_count: job.user_profiles.worker_review_count,
        employer_rating: job.user_profiles.employer_rating,
        employer_review_count: job.user_profiles.employer_review_count,
        total_jobs_completed: job.user_profiles.total_jobs_completed,
        total_jobs_posted: job.user_profiles.total_jobs_posted,
        pay: formatPay(job.pay_type, job.pay_amount),
        postedTime: getRelativeTime(job.created_at),
        application_count: applicationCount || 0,
        reviews: reviews?.map(review => ({
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.created_at,
          reviewer_name: review.user_profiles?.full_name,
          reviewer_image: review.user_profiles?.profile_image
        })) || [],
      },
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch job",
      },
      { status: 500 },
    );
  }
}

// PUT /api/jobs/[id] - Update a job (requires authentication and ownership)
export async function PUT(request, { params }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const { id } = params;
    const body = await request.json();

    // Check if user owns the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('user_id')
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return Response.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    if (job.user_id !== user.id) {
      return Response.json(
        {
          success: false,
          error: "You can only update your own jobs",
        },
        { status: 403 },
      );
    }

    // Build update object with allowed fields
    const allowedFields = [
      "title",
      "description",
      "category",
      "location",
      "duration",
      "pay_type",
      "pay_amount",
      "urgent",
      "requirements",
      "required_skills",
      "status",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        {
          success: false,
          error: "No valid fields to update",
        },
        { status: 400 },
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select('id, title, updated_at')
      .single()

    if (updateError) {
      console.error("Error updating job:", updateError);
      return Response.json(
        {
          success: false,
          error: "Failed to update job",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      job: updatedJob,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to update job",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job (requires authentication and ownership)
export async function DELETE(request, { params }) {
  try {
    const user = await getUser(request)
    if (!user) {
      return Response.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const { id } = params;

    // Check if user owns the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('user_id')
      .eq('id', id)
      .single()

    if (jobError || !job) {
      return Response.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    if (job.user_id !== user.id) {
      return Response.json(
        {
          success: false,
          error: "You can only delete your own jobs",
        },
        { status: 403 },
      );
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .neq('status', 'cancelled')
      .select('id, title')
      .single()

    if (updateError) {
      console.error("Error cancelling job:", updateError);
      return Response.json(
        {
          success: false,
          error: "Failed to cancel job",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling job:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to cancel job",
      },
      { status: 500 },
    );
  }
}

function formatPay(payType, payAmount) {
  switch (payType) {
    case 'hourly':
      return `$${payAmount}/hour`
    case 'fixed':
      return `$${payAmount}`
    default:
      return `$${payAmount}/${payType.replace('per_', '')}`
  }
}

function getRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

  return time.toLocaleDateString();
}