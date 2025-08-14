import { getUser } from '../../../../lib/supabase-server.js'
import { SupabaseStorage } from '../../../../lib/supabase-storage.js'

export async function POST(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file')
        const jobId = formData.get('jobId')

        if (!file) {
            return Response.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            )
        }

        if (!jobId) {
            return Response.json(
                { success: false, error: "Job ID is required" },
                { status: 400 }
            )
        }

        // Validate file for job image upload
        const validation = SupabaseStorage.validateFile(file, {
            maxSize: 10 * 1024 * 1024, // 10MB for job images
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            allowedExtensions: ['jpg', 'jpeg', 'png', 'gif']
        })

        if (!validation.valid) {
            return Response.json(
                { success: false, error: validation.error },
                { status: 400 }
            )
        }

        // Verify user owns the job
        const { supabase } = await import('../../../lib/supabase-server')
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('user_id')
            .eq('id', jobId)
            .single()

        if (jobError || !job) {
            return Response.json(
                { success: false, error: "Job not found" },
                { status: 404 }
            )
        }

        if (job.user_id !== user.id) {
            return Response.json(
                { success: false, error: "You can only upload images for your own jobs" },
                { status: 403 }
            )
        }

        // Upload job image
        const uploadResult = await SupabaseStorage.uploadJobImage(file, jobId, user.id)

        if (!uploadResult.success) {
            return Response.json(
                { success: false, error: uploadResult.error },
                { status: 500 }
            )
        }

        // Create file attachment record
        const { error: attachmentError } = await supabase
            .from('file_attachments')
            .insert({
                job_id: jobId,
                user_id: user.id,
                file_name: file.name,
                file_path: uploadResult.path,
                file_size: file.size,
                file_type: file.type
            })

        if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError)
            // Don't fail the request, file was uploaded successfully
        }

        return Response.json({
            success: true,
            file: {
                path: uploadResult.path,
                url: uploadResult.publicUrl,
                fileName: uploadResult.fileName
            },
            message: "Job image uploaded successfully"
        })

    } catch (error) {
        console.error('Job image upload error:', error)
        return Response.json(
            { success: false, error: "Failed to upload job image" },
            { status: 500 }
        )
    }
}