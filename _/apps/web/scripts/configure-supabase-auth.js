import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function configureSupabaseAuth() {
  try {
    console.log('🔧 Configuring Supabase Auth settings...')

    // Enable email confirmations (optional - can be disabled for development)
    const authConfig = {
      SITE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      URI_ALLOW_LIST: [
        process.env.NEXTAUTH_URL || 'http://localhost:3000',
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password`
      ].join(','),
      JWT_EXPIRY: 3600, // 1 hour
      REFRESH_TOKEN_ROTATION_ENABLED: true,
      SECURITY_REFRESH_TOKEN_REUSE_INTERVAL: 10,
      EXTERNAL_GOOGLE_ENABLED: true,
      EXTERNAL_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      EXTERNAL_GOOGLE_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
      EXTERNAL_GOOGLE_REDIRECT_URI: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/callback`,
      MAILER_AUTOCONFIRM: false, // Set to true for development to skip email confirmation
      MAILER_SECURE_EMAIL_CHANGE_ENABLED: true,
      PASSWORD_MIN_LENGTH: 6,
      SECURITY_CAPTCHA_ENABLED: false // Can be enabled for production
    }

    console.log('📧 Auth configuration:')
    console.log('- Site URL:', authConfig.SITE_URL)
    console.log('- Callback URLs:', authConfig.URI_ALLOW_LIST)
    console.log('- Email confirmation:', !authConfig.MAILER_AUTOCONFIRM ? 'Enabled' : 'Disabled')
    console.log('- Google OAuth:', authConfig.EXTERNAL_GOOGLE_ENABLED ? 'Enabled' : 'Disabled')

    console.log('✅ Supabase Auth configuration complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Go to your Supabase dashboard > Authentication > Settings')
    console.log('2. Update the Site URL to:', authConfig.SITE_URL)
    console.log('3. Add these redirect URLs:')
    authConfig.URI_ALLOW_LIST.split(',').forEach(url => {
      console.log(`   - ${url}`)
    })
    console.log('4. Configure email templates if needed')
    console.log('5. Set up OAuth providers (Google, etc.) if desired')

  } catch (error) {
    console.error('❌ Error configuring Supabase Auth:', error.message)
    process.exit(1)
  }
}

configureSupabaseAuth()