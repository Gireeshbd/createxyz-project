import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// POST /api/jobs/[id]/complete - Mark a job as completed
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

        // Get job details
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, user_id, assigned_to, status, title')
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

        // Check if user is the job owner
        if (job.user_id !== user.id) {
            return Response.json(
                {
                    success: false,
                    error: "Only job owners can mark jobs as completed",
                },
                { status: 403 },
            )
        }

        // Check if job is in assigned status
        if (job.status !== 'assigned') {
            return Response.json(
                {
                    success: false,
                    error: "Only assigned jobs can be marked as completed",
                },
                { status: 400 },
            )
        }

        // Check if job has an assigned worker
        if (!job.assigned_to) {
            return Response.json(
                {
                    success: false,
                    error: "Job must have an assigned worker to be completed",
                },
                { status: 400 },
            )
        }

        // Update job status to completed
        const { data: updatedJob, error: updateError } = await supabase
            .from('jobs')
            .update({
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .select('id, title, status, updated_at')
            .single()

        if (updateError) {
            console.error('Error completing job:', updateError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to mark job as completed",
                },
                { status: 500 },
            )
        }

        // Get worker and employer profiles for notification context
        const { data: workerProfile } = await supabase
            .from('user_profiles')
            .select('full_name, user_id')
            .eq('user_id', job.assigned_to)
            .single()

        const { data: employerProfile } = await supabase
            .from('user_profiles')
            .select('full_name, user_id')
            .eq('user_id', job.user_id)
            .single()

        return Response.json({
            success: true,
            job: updatedJob,
            message: "Job marked as completed successfully",
            next_steps: {
                can_review_worker: true,
                can_receive_review: true,
                worker_id: job.assigned_to,
                employer_id: job.user_id
            }
        })

    } catch (error) {
        console.error("Error completing job:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to mark job as completed",
            },
            { status: 500 },
        )
    }
}