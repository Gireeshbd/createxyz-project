import { supabase, getUser } from '../../../lib/supabase-server.js'

// GET /api/notifications - Get user's notifications
export async function GET(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get("unread") === "true"
        const limit = parseInt(searchParams.get("limit")) || 20
        const offset = parseInt(searchParams.get("offset")) || 0

        // Build query
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (unreadOnly) {
            query = query.eq('read', false)
        }

        if (limit > 0) {
            query = query.range(offset, offset + limit - 1)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error('Error fetching notifications:', error)
            return Response.json(
                { success: false, error: "Failed to fetch notifications" },
                { status: 500 }
            )
        }

        // Get unread count
        const { count: unreadCount, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)

        return Response.json({
            success: true,
            notifications: notifications || [],
            unread_count: unreadCount || 0,
            total: notifications?.length || 0
        })

    } catch (error) {
        console.error("Error fetching notifications:", error)
        return Response.json(
            { success: false, error: "Failed to fetch notifications" },
            { status: 500 }
        )
    }
}

// POST /api/notifications - Create a notification (system use)
export async function POST(request) {
    try {
        const body = await request.json()
        const { user_id, type, title, message, data } = body

        if (!user_id || !type || !title || !message) {
            return Response.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            )
        }

        const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
                user_id,
                type,
                title,
                message,
                data: data || {}
            })
            .select('*')
            .single()

        if (error) {
            console.error('Error creating notification:', error)
            return Response.json(
                { success: false, error: "Failed to create notification" },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            notification,
            message: "Notification created successfully"
        })

    } catch (error) {
        console.error("Error creating notification:", error)
        return Response.json(
            { success: false, error: "Failed to create notification" },
            { status: 500 }
        )
    }
}