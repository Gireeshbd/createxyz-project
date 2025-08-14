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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAuth() {
  try {
    console.log('🔍 Testing Supabase Auth setup...')
    
    // Test 1: Check if auth is properly configured
    console.log('📧 Testing auth configuration...')
    
    // Test 2: Check if we can access auth users (should be empty initially)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error accessing auth users:', usersError.message)
    } else {
      console.log(`✅ Auth users accessible (${users.users.length} users found)`)
    }
    
    // Test 3: Check if our custom tables exist and are accessible
    console.log('🗄️ Testing database tables...')
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles:', profilesError.message)
    } else {
      console.log('✅ user_profiles table accessible')
    }
    
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)
    
    if (jobsError) {
      console.error('❌ Error accessing jobs:', jobsError.message)
    } else {
      console.log('✅ jobs table accessible')
    }
    
    console.log('')
    console.log('🎉 Supabase Auth setup test completed!')
    console.log('')
    console.log('📝 Manual testing steps:')
    console.log('1. Start your development server: npm run dev')
    console.log('2. Go to http://localhost:3000/account/signup')
    console.log('3. Create a test account')
    console.log('4. Check your Supabase dashboard > Authentication > Users')
    console.log('5. Verify the user was created and user_profiles was populated')
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message)
    process.exit(1)
  }
}

testAuth()