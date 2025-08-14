import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// POST /api/jobs/[id]/apply - Apply to a job
export async function POST(request, { params }) {
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
        const body = await request.json()
        const { message, hourly_rate, availability, experience } = body

        // Check if job exists and is active
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, user_id, status')
            .eq('id', jobId)
            .eq('status', 'active')
            .single()

        if (jobError || !job) {
            return Response.json(
                {
                    success: false,
                    error: "Job not found or no longer active",
                },
                { status: 404 },
            )
        }

        // Check if user is trying to apply to their own job
        if (job.user_id === user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You cannot apply to your own job",
                },
                { status: 400 },
            )
        }

        // Check if user has already applied
        const { data: existingApplication, error: existingError } = await supabase
            .from('job_applications')
            .select('id')
            .eq('job_id', jobId)
            .eq('user_id', user.id)
            .single()

        if (existingApplication) {
            return Response.json(
                {
                    success: false,
                    error: "You have already applied to this job",
                },
                { status: 400 },
            )
        }

        // Get user profile for applicant info
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single()

        // Create application
        const { data: application, error: applicationError } = await supabase
            .from('job_applications')
            .insert({
                job_id: jobId,
                user_id: user.id,
                applicant_name: profile?.full_name || user.email,
                applicant_email: user.email,
                message: message || null,
                hourly_rate: hourly_rate || null,
                availability: availability || null,
                experience: experience || null,
                status: 'pending'
            })
            .select('id, applied_at')
            .single()

        if (applicationError) {
            console.error('Error creating application:', applicationError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to submit application",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            application: {
                id: application.id,
                created_at: application.applied_at
            },
            message: "Application submitted successfully",
        })

    } catch (error) {
        console.error("Error creating application:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to submit application",
            },
            { status: 500 },
        )
    }
}