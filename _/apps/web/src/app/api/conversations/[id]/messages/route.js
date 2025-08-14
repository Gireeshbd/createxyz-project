import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// GET /api/conversations/[id]/messages - Get messages for a conversation
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

        const { id: conversationId } = params
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit")) || 50
        const offset = parseInt(searchParams.get("offset")) || 0
        const before = searchParams.get("before") // timestamp for pagination

        // Check if user has access to this conversation
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .select('id, employer_id, worker_id')
            .eq('id', conversationId)
            .single()

        if (conversationError || !conversation) {
            return Response.json(
                {
                    success: false,
                    error: "Conversation not found",
                },
                { status: 404 },
            )
        }

        if (conversation.employer_id !== user.id && conversation.worker_id !== user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You don't have access to this conversation",
                },
                { status: 403 },
            )
        }

        // Build messages query
        let query = supabase
            .from('messages')
            .select(`
        id,
        message_text,
        sender_id,
        is_read,
        created_at,
        user_profiles!sender_id(
          full_name,
          profile_image
        )
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })

        if (before) {
            query = query.lt('created_at', before)
        }

        if (limit > 0) {
            query = query.range(offset, offset + limit - 1)
        }

        const { data: messages, error: messagesError } = await query

        if (messagesError) {
            console.error('Error fetching messages:', messagesError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch messages",
                },
                { status: 500 },
            )
        }

        // Format messages
        const formattedMessages = messages.map(message => ({
            id: message.id,
            message_text: message.message_text,
            sender_id: message.sender_id,
            is_read: message.is_read,
            created_at: message.created_at,
            is_from_me: message.sender_id === user.id,
            sender: {
                full_name: message.user_profiles?.full_name,
                profile_image: message.user_profiles?.profile_image
            }
        })).reverse() // Reverse to show oldest first

        // Mark messages as read (only messages not sent by current user)
        if (messages.length > 0) {
            const unreadMessageIds = messages
                .filter(msg => !msg.is_read && msg.sender_id !== user.id)
                .map(msg => msg.id)

            if (unreadMessageIds.length > 0) {
                const { error: markReadError } = await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadMessageIds)

                if (markReadError) {
                    console.error('Error marking messages as read:', markReadError)
                }
            }
        }

        return Response.json({
            success: true,
            messages: formattedMessages,
            total: messages.length,
            has_more: messages.length === limit
        })

    } catch (error) {
        console.error("Error fetching messages:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch messages",
            },
            { status: 500 },
        )
    }
}

// POST /api/conversations/[id]/messages - Send a message
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

        const { id: conversationId } = params
        const body = await request.json()
        const { message_text } = body

        if (!message_text || message_text.trim().length === 0) {
            return Response.json(
                {
                    success: false,
                    error: "Message text is required",
                },
                { status: 400 },
            )
        }

        // Check if user has access to this conversation
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .select('id, employer_id, worker_id')
            .eq('id', conversationId)
            .single()

        if (conversationError || !conversation) {
            return Response.json(
                {
                    success: false,
                    error: "Conversation not found",
                },
                { status: 404 },
            )
        }

        if (conversation.employer_id !== user.id && conversation.worker_id !== user.id) {
            return Response.json(
                {
                    success: false,
                    error: "You don't have access to this conversation",
                },
                { status: 403 },
            )
        }

        // Create the message
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message_text: message_text.trim(),
                is_read: false
            })
            .select(`
        id,
        message_text,
        sender_id,
        is_read,
        created_at,
        user_profiles!sender_id(
          full_name,
          profile_image
        )
      `)
            .single()

        if (messageError) {
            console.error('Error creating message:', messageError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to send message",
                },
                { status: 500 },
            )
        }

        // Format the response
        const formattedMessage = {
            id: message.id,
            message_text: message.message_text,
            sender_id: message.sender_id,
            is_read: message.is_read,
            created_at: message.created_at,
            is_from_me: true,
            sender: {
                full_name: message.user_profiles?.full_name,
                profile_image: message.user_profiles?.profile_image
            }
        }

        return Response.json({
            success: true,
            message: formattedMessage,
            message_text: "Message sent successfully"
        })

    } catch (error) {
        console.error("Error sending message:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to send message",
            },
            { status: 500 },
        )
    }
}