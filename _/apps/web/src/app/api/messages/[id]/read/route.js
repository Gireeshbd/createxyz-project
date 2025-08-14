import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// PUT /api/messages/[id]/read - Mark a message as read
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

        const { id: messageId } = params

        // Get message with conversation info to check permissions
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .select(`
        id,
        sender_id,
        is_read,
        conversations!inner(
          id,
          employer_id,
          worker_id
        )
      `)
            .eq('id', messageId)
            .single()

        if (messageError || !message) {
            return Response.json(
                {
                    success: false,
                    error: "Message not found",
                },
                { status: 404 },
            )
        }

        // Check if user has access to this conversation
        const conversation = message.conversations
        if (conversation.employer_id !== user.id && conversation.worker_id !== user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You don't have access to this message",
                },
                { status: 403 },
            )
        }

        // Users can only mark messages they didn't send as read
        if (message.sender_id === user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You cannot mark your own messages as read",
                },
                { status: 400 },
            )
        }

        // Update message read status
        const { data: updatedMessage, error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', messageId)
            .select('id, is_read')
            .single()

        if (updateError) {
            console.error('Error updating message read status:', updateError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to mark message as read",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            message: updatedMessage,
            message_text: "Message marked as read"
        })

    } catch (error) {
        console.error("Error marking message as read:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to mark message as read",
            },
            { status: 500 },
        )
    }
}