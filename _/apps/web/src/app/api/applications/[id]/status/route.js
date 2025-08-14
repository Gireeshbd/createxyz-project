import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// PUT /api/applications/[id]/status - Update application status
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
            )
        }

        const { id: applicationId } = params
        const body = await request.json()
        const { status } = body

        // Validate status
        const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn']
        if (!status || !validStatuses.includes(status)) {
            return Response.json(
                {
                    success: false,
                    error: "Invalid status. Must be one of: " + validStatuses.join(', '),
                },
                { status: 400 },
            )
        }

        // Get application with job info
        const { data: application, error: applicationError } = await supabase
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
            .single()

        if (applicationError || !application) {
            return Response.json(
                {
                    success: false,
                    error: "Application not found",
                },
                { status: 404 },
            )
        }

        // Check permissions
        const isJobOwner = application.jobs.user_id === user.id
        const isApplicant = application.user_id === user.id

        if (!isJobOwner && !isApplicant) {
            return Response.json(
                {
                    success: false,
                    error: "You don't have permission to update this application",
                },
                { status: 403 },
            )
        }

        // Business logic checks
        if (status === 'withdrawn' && !isApplicant) {
            return Response.json(
                {
                    success: false,
                    error: "Only applicants can withdraw their applications",
                },
                { status: 403 },
            )
        }

        if ((status === 'accepted' || status === 'rejected') && !isJobOwner) {
            return Response.json(
                {
                    success: false,
                    error: "Only job owners can accept or reject applications",
                },
                { status: 403 },
            )
        }

        // Check if job is still active for acceptance
        if (status === 'accepted' && application.jobs.job_status !== 'active') {
            return Response.json(
                {
                    success: false,
                    error: "Cannot accept applications for inactive jobs",
                },
                { status: 400 },
            )
        }

        // Update application status
        const { data: updatedApplication, error: updateError } = await supabase
            .from('job_applications')
            .update({
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select('id, status, updated_at')
            .single()

        if (updateError) {
            console.error('Error updating application:', updateError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to update application status",
                },
                { status: 500 },
            )
        }

        // If application is accepted, update job status and assign worker
        if (status === 'accepted') {
            const { error: jobUpdateError } = await supabase
                .from('jobs')
                .update({
                    status: 'assigned',
                    assigned_to: application.user_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', application.jobs.id)

            if (jobUpdateError) {
                console.error('Error updating job status:', jobUpdateError)
                // Don't fail the request, but log the error
            }

            // Reject all other pending applications for this job
            const { error: rejectError } = await supabase
                .from('job_applications')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('job_id', application.jobs.id)
                .eq('status', 'pending')
                .neq('id', applicationId)

            if (rejectError) {
                console.error('Error rejecting other applications:', rejectError)
                // Don't fail the request, but log the error
            }
        }

        return Response.json({
            success: true,
            application: updatedApplication,
            message: `Application ${status} successfully`,
        })

    } catch (error) {
        console.error("Error updating application status:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to update application status",
            },
            { status: 500 },
        )
    }
}