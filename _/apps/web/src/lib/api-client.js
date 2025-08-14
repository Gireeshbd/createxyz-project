import { supabase } from './supabase-client'

class APIClient {
    constructor() {
        this.baseURL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000'
    }

    async getAuthHeaders() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            console.log('API Client - Session:', session ? 'Found' : 'Not found')
            console.log('API Client - Access token:', session?.access_token ? 'Present' : 'Missing')

            if (session?.access_token) {
                return {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        } catch (error) {
            console.error('Error getting auth headers:', error)
        }

        return {
            'Content-Type': 'application/json'
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`
        const headers = await this.getAuthHeaders()

        console.log('API Client - Making request to:', endpoint)
        console.log('API Client - Headers:', headers)

        const config = {
            headers: {
                ...headers,
                ...options.headers
            },
            ...options
        }

        try {
            const response = await fetch(url, config)

            // Handle non-JSON responses (like HTML error pages)
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            return data
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error)
            throw error
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString())
            }
        })

        const queryString = searchParams.toString()
        const url = queryString ? `${endpoint}?${queryString}` : endpoint

        return this.request(url, { method: 'GET' })
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' })
    }

    // File upload
    async uploadFile(endpoint, file, additionalData = {}) {
        const headers = await this.getAuthHeaders()
        delete headers['Content-Type'] // Let browser set content-type for FormData

        const formData = new FormData()
        formData.append('file', file)

        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value)
        })

        return this.request(endpoint, {
            method: 'POST',
            headers,
            body: formData
        })
    }
}

// Create singleton instance
const apiClient = new APIClient()

// Convenience methods for common API calls
export const api = {
    // Jobs
    jobs: {
        list: (params) => apiClient.get('/api/jobs', params),
        get: (id) => apiClient.get(`/api/jobs/${id}`),
        create: (data) => apiClient.post('/api/jobs', data),
        update: (id, data) => apiClient.put(`/api/jobs/${id}`, data),
        delete: (id) => apiClient.delete(`/api/jobs/${id}`),
        my: () => apiClient.get('/api/jobs/my'),
        complete: (id) => apiClient.post(`/api/jobs/${id}/complete`),
        apply: (id, data) => apiClient.post(`/api/jobs/${id}/apply`, data),
        getApplications: (id) => apiClient.get(`/api/jobs/${id}/applications`),
        review: (id, data) => apiClient.post(`/api/jobs/${id}/review`, data)
    },

    // Applications
    applications: {
        list: (params) => apiClient.get('/api/applications', params),
        updateStatus: (id, status) => apiClient.put(`/api/applications/${id}/status`, { status })
    },

    // Users
    users: {
        dashboard: (id) => apiClient.get(`/api/users/${id}/dashboard`),
        reviews: (id, params) => apiClient.get(`/api/users/${id}/reviews`, params),
        ratingStats: (id) => apiClient.get(`/api/users/${id}/rating-stats`)
    },

    // Conversations
    conversations: {
        list: (params) => apiClient.get('/api/conversations', params),
        create: (data) => apiClient.post('/api/conversations', data),
        getMessages: (id, params) => apiClient.get(`/api/conversations/${id}/messages`, params),
        sendMessage: (id, data) => apiClient.post(`/api/conversations/${id}/messages`, data)
    },

    // Messages
    messages: {
        markAsRead: (id) => apiClient.put(`/api/messages/${id}/read`)
    },

    // Notifications
    notifications: {
        list: (params) => apiClient.get('/api/notifications', params),
        markAsRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
        markAllAsRead: () => apiClient.put('/api/notifications/mark-all-read'),
        getPreferences: () => apiClient.get('/api/notifications/preferences'),
        updatePreferences: (data) => apiClient.put('/api/notifications/preferences', data)
    },

    // File uploads
    upload: {
        avatar: (file) => apiClient.uploadFile('/api/upload/avatar', file),
        jobImage: (file, jobId) => apiClient.uploadFile('/api/upload/job-image', file, { jobId }),
        messageAttachment: (file, conversationId) => apiClient.uploadFile('/api/upload/message-attachment', file, { conversationId })
    }
}

export default apiClient