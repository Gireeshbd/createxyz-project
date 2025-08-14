import { supabase, getUser } from '../../../../lib/supabase-server.js'

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        const { data: preferences, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching notification preferences:', error)
            return Response.json(
                { success: false, error: "Failed to fetch notification preferences" },
                { status: 500 }
            )
        }

        // If no preferences exist, create default ones
        if (!preferences) {
            const { data: newPreferences, error: createError } = await supabase
                .from('notification_preferences')
                .insert({ user_id: user.id })
                .select('*')
                .single()

            if (createError) {
                console.error('Error creating notification preferences:', createError)
                return Response.json(
                    { success: false, error: "Failed to create notification preferences" },
                    { status: 500 }
                )
            }

            return Response.json({
                success: true,
                preferences: newPreferences
            })
        }

        return Response.json({
            success: true,
            preferences
        })

    } catch (error) {
        console.error("Error fetching notification preferences:", error)
        return Response.json(
            { success: false, error: "Failed to fetch notification preferences" },
            { status: 500 }
        )
    }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(request) {
    try {
        const user = await getUser(request)
        if (!user) {
            return Response.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            email_notifications,
            push_notifications,
            job_application_notifications,
            message_notifications,
            review_notifications,
            payment_notifications
        } = body

        // Build update object
        const updateData = {}
        if (typeof email_notifications === 'boolean') updateData.email_notifications = email_notifications
        if (typeof push_notifications === 'boolean') updateData.push_notifications = push_notifications
        if (typeof job_application_notifications === 'boolean') updateData.job_application_notifications = job_application_notifications
        if (typeof message_notifications === 'boolean') updateData.message_notifications = message_notifications
        if (typeof review_notifications === 'boolean') updateData.review_notifications = review_notifications
        if (typeof payment_notifications === 'boolean') updateData.payment_notifications = payment_notifications

        if (Object.keys(updateData).length === 0) {
            return Response.json(
                { success: false, error: "No valid preferences to update" },
                { status: 400 }
            )
        }

        updateData.updated_at = new Date().toISOString()

        // Update preferences (upsert in case they don't exist)
        const { data: preferences, error } = await supabase
            .from('notification_preferences')
            .upsert({ user_id: user.id, ...updateData })
            .select('*')
            .single()

        if (error) {
            console.error('Error updating notification preferences:', error)
            return Response.json(
                { success: false, error: "Failed to update notification preferences" },
                { status: 500 }
            )
        }

        return Response.json({
            success: true,
            preferences,
            message: "Notification preferences updated successfully"
        })

    } catch (error) {
        console.error("Error updating notification preferences:", error)
        return Response.json(
            { success: false, error: "Failed to update notification preferences" },
            { status: 500 }
        )
    }
}