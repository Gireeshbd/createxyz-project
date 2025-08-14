import { supabase } from './supabase-client'

// Storage bucket names
export const STORAGE_BUCKETS = {
    AVATARS: 'avatars',
    JOB_IMAGES: 'job-images',
    MESSAGE_ATTACHMENTS: 'message-attachments',
    DOCUMENTS: 'documents'
}

// File upload utilities
export class SupabaseStorage {

    // Upload avatar image
    static async uploadAvatar(file, userId) {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKETS.AVATARS)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.AVATARS)
                .getPublicUrl(filePath)

            return {
                success: true,
                path: data.path,
                publicUrl,
                fileName
            }
        } catch (error) {
            console.error('Avatar upload error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Upload job image
    static async uploadJobImage(file, jobId, userId) {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${jobId}-${Date.now()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKETS.JOB_IMAGES)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.JOB_IMAGES)
                .getPublicUrl(filePath)

            return {
                success: true,
                path: data.path,
                publicUrl,
                fileName
            }
        } catch (error) {
            console.error('Job image upload error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Upload message attachment
    static async uploadMessageAttachment(file, conversationId, userId) {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${conversationId}-${Date.now()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.MESSAGE_ATTACHMENTS)
                .getPublicUrl(filePath)

            return {
                success: true,
                path: data.path,
                publicUrl,
                fileName,
                fileSize: file.size,
                fileType: file.type
            }
        } catch (error) {
            console.error('Message attachment upload error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Upload document
    static async uploadDocument(file, userId, category = 'general') {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${category}-${Date.now()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKETS.DOCUMENTS)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.DOCUMENTS)
                .getPublicUrl(filePath)

            return {
                success: true,
                path: data.path,
                publicUrl,
                fileName,
                fileSize: file.size,
                fileType: file.type
            }
        } catch (error) {
            console.error('Document upload error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Delete file
    static async deleteFile(bucket, filePath) {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath])

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('File deletion error:', error)
            return {
                success: false,
                error: error.message
            }
        }
    }

    // Get file URL
    static getPublicUrl(bucket, filePath) {
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return publicUrl
    }

    // Validate file
    static validateFile(file, options = {}) {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf']
        } = options

        // Check file size
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File size must be less than ${maxSize / (1024 * 1024)}MB`
            }
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type ${file.type} is not allowed`
            }
        }

        // Check file extension
        const fileExt = file.name.split('.').pop().toLowerCase()
        if (!allowedExtensions.includes(fileExt)) {
            return {
                valid: false,
                error: `File extension .${fileExt} is not allowed`
            }
        }

        return { valid: true }
    }
}

export default SupabaseStorage