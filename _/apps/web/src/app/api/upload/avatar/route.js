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

        if (!file) {
            return Response.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            )
        }

        // Validate file for avatar upload
        const validation = SupabaseStorage.validateFile(file, {
            maxSize: 5 * 1024 * 1024, // 5MB for avatars
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            allowedExtensions: ['jpg', 'jpeg', 'png', 'gif']
        })

        if (!validation.valid) {
            return Response.json(
                { success: false, error: validation.error },
                { status: 400 }
            )
        }

        // Upload avatar
        const uploadResult = await SupabaseStorage.uploadAvatar(file, user.id)

        if (!uploadResult.success) {
            return Response.json(
                { success: false, error: uploadResult.error },
                { status: 500 }
            )
        }

        // Update user profile with new avatar URL
        const { supabase } = await import('../../../lib/supabase-server')
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ profile_image: uploadResult.publicUrl })
            .eq('user_id', user.id)

        if (updateError) {
            console.error('Error updating profile:', updateError)
            // Don't fail the request, avatar was uploaded successfully
        }

        return Response.json({
            success: true,
            file: {
                path: uploadResult.path,
                url: uploadResult.publicUrl,
                fileName: uploadResult.fileName
            },
            message: "Avatar uploaded successfully"
        })

    } catch (error) {
        console.error('Avatar upload error:', error)
        return Response.json(
            { success: false, error: "Failed to upload avatar" },
            { status: 500 }
        )
    }
}