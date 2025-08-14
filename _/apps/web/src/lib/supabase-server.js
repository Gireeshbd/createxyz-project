import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables for server - some functionality may not work')
}

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null

// Create a client with anon key for RLS-protected operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Helper function to get user from request headers
export async function getUser(request) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured - cannot authenticate user')
      return null
    }

    console.log('=== SERVER AUTH DEBUG ===')

    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    console.log('Auth header starts with Bearer:', authHeader?.startsWith('Bearer '))

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header found')
      return null
    }

    const token = authHeader.substring(7)
    console.log('Token extracted, length:', token.length)

    // Create a client with the access token
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    const { data: { user }, error } = await authenticatedSupabase.auth.getUser()
    console.log('User from token:', user ? `Found: ${user.email}` : 'Not found')
    console.log('Auth error:', error?.message || 'None')

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Helper function to create authenticated Supabase client
export function createAuthenticatedClient(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}

export default supabase