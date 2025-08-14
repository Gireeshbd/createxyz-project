import { createClient } from '@supabase/supabase-js'

// For client-side usage, use hardcoded values or import.meta.env
const supabaseUrl = 'https://exwoeyozdwraxitiylzx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4d29leW96ZHdyYXhpdGl5bHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzEwNTAsImV4cCI6MjA3MDIwNzA1MH0.KvKIzC8quIWKzoNsD5CC9tx4tmRULQrpuhLONnsDgYw'

// Client-side Supabase client (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Note: supabaseAdmin should only be used in server-side contexts
// For API routes, import from a server-specific file
export const supabaseAdmin = null // Will be created in server context