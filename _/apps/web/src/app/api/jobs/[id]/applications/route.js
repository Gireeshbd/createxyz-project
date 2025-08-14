import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// GET /api/jobs/[id]/applications - Get applications for a job (job owner only)
export async function GET(request, { params }) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                {
                    success: false,
                    error: "Authentication required",
                },
                { status: 401 },
            )
        }

        const { id: jobId } = params

        // Check if user owns the job
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, user_id, title')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return Response.json(
                {
                    success: false,
                    error: "Job not found",
                },
                { status: 404 },
            )
        }

        if (job.user_id !== user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You can only view applications for your own jobs",
                },
                { status: 403 },
            )
        }

        // Get applications with applicant profile data
        const { data: applications, error: applicationsError } = await supabase
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
            .order('applied_at', { ascending: false })

        if (applicationsError) {
            console.error('Error fetching applications:', applicationsError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch applications",
                },
                { status: 500 },
            )
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
        }))

        return Response.json({
            success: true,
            job: {
                id: job.id,
                title: job.title
            },
            applications: formattedApplications,
            total: applications.length
        })

    } catch (error) {
        console.error("Error fetching applications:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch applications",
            },
            { status: 500 },
        )
    }
}