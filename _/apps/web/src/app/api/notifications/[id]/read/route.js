import { supabase, getUser } from '../../../../../lib/supabase-server.js'

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request, { params }) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        const { id: notificationId } = params

        // Update notification read status
        const { data: notification, error } = await supabase
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('id', notificationId)
            .eq('user_id', user.id) // Ensure user owns the notification
            .select('id, read')
            .single()

        if (error) {
            console.error('Error marking notification as read:', error)
            return Response.json(
                { success: false, error: "Failed to mark notification as read" },
                { status: 500 }
            )
        }

        if (!notification) {
            return Response.json(
                { success: false, error: "Notification not found" },
                { status: 404 }
            )
        }

        return Response.json({
            success: true,
            notification,
            message: "Notification marked as read"
        })

    } catch (error) {
        console.error("Error marking notification as read:", error)
        return Response.json(
            { success: false, error: "Failed to mark notification as read" },
            { status: 500 }
        )
    }
}