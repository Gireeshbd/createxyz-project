import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Helper function to get authenticated user from request
export async function getAuthenticatedUser(request) {
    try {
        // For now, let's create a simple client-side compatible approach
        // We'll get the session from the request headers or cookies

        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)

            // Create a client with the access token
            const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })

            const { data: { user }, error } = await authenticatedClient.auth.getUser()

            if (error || !user) {
                console.error('Auth error:', error)
                return null
            }

            return user
        }

        // If no auth header, try to parse cookies for session
        const cookieHeader = request.headers.get('cookie')
        if (cookieHeader) {
            // Simple cookie parsing - in production you might want to use a proper cookie parser
            const cookies = Object.fromEntries(
                cookieHeader.split('; ').map(c => {
                    const [key, ...v] = c.split('=')
                    return [key, decodeURIComponent(v.join('='))]
                })
            )

            // Look for Supabase session cookies
            const sessionCookie = cookies['sb-access-token'] ||
                cookies['supabase.auth.token'] ||
                Object.keys(cookies).find(key => key.includes('supabase') && key.includes('auth'))

            if (sessionCookie) {
                try {
                    const { data: { user }, error } = await supabase.auth.getUser(sessionCookie)

                    if (!error && user) {
                        return user
                    }
                } catch (cookieError) {
                    console.error('Cookie auth error:', cookieError)
                }
            }
        }

        return null
    } catch (error) {
        console.error('Error getting authenticated user:', error)
        return null
    }
}

// Alternative: Create a client that can be used with RLS
export function createServerClient(accessToken = null) {
    const config = {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }

    if (accessToken) {
        config.global = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    }

    return createClient(supabaseUrl, supabaseAnonKey, config)
}

export default supabase