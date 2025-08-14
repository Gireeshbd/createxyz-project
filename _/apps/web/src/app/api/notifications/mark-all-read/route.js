import { supabase, getUser } from '../../../../lib/supabase-server.js'

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export async function PUT(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        // Update all unread notifications for the user
        const { data: notifications, error } = await supabase
            .from('notifications')
            .update({ read: true, updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('read', false)
            .select('id')

        if (error) {
            console.error('Error marking all notifications as read:', error)
            return Response.json(
                { success: false, error: "Failed to mark notifications as read" },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            updated_count: notifications?.length || 0,
            message: "All notifications marked as read"
        })

    } catch (error) {
        console.error("Error marking all notifications as read:", error)
        return Response.json(
            { success: false, error: "Failed to mark notifications as read" },
            { status: 500 }
        )
    }
}