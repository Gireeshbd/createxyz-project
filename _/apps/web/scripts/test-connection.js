import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const { Client } = pg

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('🔍 Testing database connection...')
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    console.log('🔗 URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...')
    
    await client.connect()
    console.log('✅ Connected to database!')
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time')
    console.log('✅ Database connection successful!')
    console.log('📅 Current time:', result.rows[0].current_time)
    
    // Test table existence
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('📋 Available tables:')
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })
    
    console.log('🎉 Database setup is complete and working!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

testConnection()