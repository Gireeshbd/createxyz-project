import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

console.log('🔧 Google OAuth Configuration Helper')
console.log('')
console.log('📋 Current Configuration:')
console.log('- Supabase URL:', supabaseUrl)
console.log('- Site URL:', process.env.NEXTAUTH_URL || 'http://localhost:4000')
console.log('- Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Missing')
console.log('')

console.log('🚨 IMPORTANT: Manual Configuration Required')
console.log('')
console.log('1️⃣ Go to your Supabase Dashboard:')
console.log('   https://supabase.com/dashboard/project/exwoeyozdwraxitiylzx')
console.log('')
console.log('2️⃣ Navigate to: Authentication > URL Configuration')
console.log('')
console.log('3️⃣ Set these URLs:')
console.log('   Site URL: http://localhost:4000')
console.log('   Redirect URLs: http://localhost:4000/auth/callback')
console.log('')
console.log('4️⃣ Navigate to: Authentication > Providers > Google')
console.log('')
console.log('5️⃣ Enable Google provider and set:')
console.log('   Client ID:', process.env.GOOGLE_CLIENT_ID)
console.log('   Client Secret:', process.env.GOOGLE_CLIENT_SECRET)
console.log('')
console.log('6️⃣ In your Google Cloud Console:')
console.log('   https://console.cloud.google.com/apis/credentials')
console.log('')
console.log('7️⃣ Add these Authorized redirect URIs:')
console.log('   http://localhost:4000/auth/callback')
console.log('   https://exwoeyozdwraxitiylzx.supabase.co/auth/v1/callback')
console.log('')
console.log('💡 After making these changes, restart your development server!')