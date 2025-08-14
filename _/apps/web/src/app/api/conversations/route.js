import { supabase, getUser } from '../../../lib/supabase-server.js'

// GET /api/conversations - Get user's conversations
export async function GET(request) {
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

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get("limit")) || 20
        const offset = parseInt(searchParams.get("offset")) || 0

        // Get conversations where user is either employer or worker
        const { data: conversations, error: conversationsError } = await supabase
            .from('conversations')
            .select(`
        id,
        job_id,
        employer_id,
        worker_id,
        created_at,
        updated_at,
        jobs!inner(
          id,
          title,
          category,
          status
        ),
        employer:user_profiles!employer_id(
          full_name,
          profile_image
        ),
        worker:user_profiles!worker_id(
          full_name,
          profile_image
        )
      `)
            .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (conversationsError) {
            console.error('Error fetching conversations:', conversationsError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to fetch conversations",
                },
                { status: 500 },
            )
        }

        // Get last message for each conversation
        const conversationIds = conversations.map(c => c.id)
        const { data: lastMessages, error: messagesError } = await supabase
            .from('messages')
            .select('conversation_id, message_text, created_at, sender_id, is_read')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })

        if (messagesError) {
            console.error('Error fetching last messages:', messagesError)
        }

        // Group messages by conversation and get the latest one
        const lastMessagesByConversation = {}
        if (lastMessages) {
            lastMessages.forEach(message => {
                if (!lastMessagesByConversation[message.conversation_id]) {
                    lastMessagesByConversation[message.conversation_id] = message
                }
            })
        }

        // Get unread message counts
        const { data: unreadCounts, error: unreadError } = await supabase
            .from('messages')
            .select('conversation_id')
            .in('conversation_id', conversationIds)
            .eq('is_read', false)
            .neq('sender_id', user.id)

        const unreadCountsByConversation = {}
        if (!unreadError && unreadCounts) {
            unreadCounts.forEach(message => {
                unreadCountsByConversation[message.conversation_id] =
                    (unreadCountsByConversation[message.conversation_id] || 0) + 1
            })
        }

        // Format conversations
        const formattedConversations = conversations.map(conversation => {
            const isEmployer = conversation.employer_id === user.id
            const otherUser = isEmployer ? conversation.worker : conversation.employer
            const lastMessage = lastMessagesByConversation[conversation.id]
            const unreadCount = unreadCountsByConversation[conversation.id] || 0

            return {
                id: conversation.id,
                job_id: conversation.job_id,
                created_at: conversation.created_at,
                updated_at: conversation.updated_at,
                job: {
                    id: conversation.jobs.id,
                    title: conversation.jobs.title,
                    category: conversation.jobs.category,
                    status: conversation.jobs.status
                },
                other_user: {
                    id: isEmployer ? conversation.worker_id : conversation.employer_id,
                    full_name: otherUser?.full_name,
                    profile_image: otherUser?.profile_image,
                    role: isEmployer ? 'worker' : 'employer'
                },
                last_message: lastMessage ? {
                    text: lastMessage.message_text,
                    created_at: lastMessage.created_at,
                    sender_id: lastMessage.sender_id,
                    is_from_me: lastMessage.sender_id === user.id
                } : null,
                unread_count: unreadCount
            }
        })

        return Response.json({
            success: true,
            conversations: formattedConversations,
            total: conversations.length
        })

    } catch (error) {
        console.error("Error fetching conversations:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to fetch conversations",
            },
            { status: 500 },
        )
    }
}

// POST /api/conversations - Create a new conversation
export async function POST(request) {
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

        const body = await request.json()
        const { job_id, other_user_id } = body

        if (!job_id || !other_user_id) {
            return Response.json(
                {
                    success: false,
                    error: "Missing required fields: job_id, other_user_id",
                },
                { status: 400 },
            )
        }

        // Get job details to determine roles
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, user_id, assigned_to, status')
            .eq('id', job_id)
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

        // Determine employer and worker IDs
        let employer_id, worker_id

        if (job.user_id === user.id) {
            // Current user is the employer
            employer_id = user.id
            worker_id = other_user_id
        } else if (job.assigned_to === user.id || other_user_id === job.user_id) {
            // Current user is the worker or other user is employer
            employer_id = other_user_id
            worker_id = user.id
        } else {
            return Response.json(
                {
                    success: false,
                    error: "You can only create conversations for jobs you're involved in",
                },
                { status: 403 },
            )
        }

        // Check if conversation already exists
        const { data: existingConversation, error: existingError } = await supabase
            .from('conversations')
            .select('id')
            .eq('job_id', job_id)
            .eq('employer_id', employer_id)
            .eq('worker_id', worker_id)
            .single()

        if (existingConversation) {
            return Response.json({
                success: true,
                conversation: { id: existingConversation.id },
                message: "Conversation already exists"
            })
        }

        // Create new conversation
        const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
                job_id: job_id,
                employer_id: employer_id,
                worker_id: worker_id
            })
            .select('id, created_at')
            .single()

        if (conversationError) {
            console.error('Error creating conversation:', conversationError)
            return Response.json(
                {
                    success: false,
                    error: "Failed to create conversation",
                },
                { status: 500 },
            )
        }

        return Response.json({
            success: true,
            conversation: conversation,
            message: "Conversation created successfully"
        })

    } catch (error) {
        console.error("Error creating conversation:", error)
        return Response.json(
            {
                success: false,
                error: "Failed to create conversation",
            },
            { status: 500 },
        )
    }
}