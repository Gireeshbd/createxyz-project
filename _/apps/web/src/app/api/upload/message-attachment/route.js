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
        const conversationId = formData.get('conversationId')

        if (!file) {
            return Response.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            )
        }

        if (!conversationId) {
            return Response.json(
                { success: false, error: "Conversation ID is required" },
                { status: 400 }
            )
        }

        // Validate file for message attachment
        const validation = SupabaseStorage.validateFile(file, {
            maxSize: 25 * 1024 * 1024, // 25MB for message attachments
            allowedTypes: [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf', 'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'doc', 'docx']
        })

        if (!validation.valid) {
            return Response.json(
                { success: false, error: validation.error },
                { status: 400 }
            )
        }

        // Verify user has access to the conversation
        const { supabase } = await import('../../../lib/supabase-server')
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .select('employer_id, worker_id')
            .eq('id', conversationId)
            .single()

        if (conversationError || !conversation) {
            return Response.json(
                { success: false, error: "Conversation not found" },
                { status: 404 }
            )
        }

        if (conversation.employer_id !== user.id && conversation.worker_id !== user.id) {
            return Response.json(
                { success: false, error: "You don't have access to this conversation" },
                { status: 403 }
            )
        }

        // Upload message attachment
        const uploadResult = await SupabaseStorage.uploadMessageAttachment(file, conversationId, user.id)

        if (!uploadResult.success) {
            return Response.json(
                { success: false, error: uploadResult.error },
                { status: 500 }
            )
        }

        // Create file attachment record
        const { data: attachment, error: attachmentError } = await supabase
            .from('file_attachments')
            .insert({
                user_id: user.id,
                file_name: file.name,
                file_path: uploadResult.path,
                file_size: uploadResult.fileSize,
                file_type: uploadResult.fileType
            })
            .select('id')
            .single()

        if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError)
            return Response.json(
                { success: false, error: "Failed to create attachment record" },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            attachment: {
                id: attachment.id,
                path: uploadResult.path,
                url: uploadResult.publicUrl,
                fileName: uploadResult.fileName,
                fileSize: uploadResult.fileSize,
                fileType: uploadResult.fileType
            },
            message: "File uploaded successfully"
        })

    } catch (error) {
        console.error('Message attachment upload error:', error)
        return Response.json(
            { success: false, error: "Failed to upload attachment" },
            { status: 500 }
        )
    }
}