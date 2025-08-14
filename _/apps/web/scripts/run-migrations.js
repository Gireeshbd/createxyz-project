import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

const { Client } = pg

async function runMigrations() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('🚀 Connected to database, starting migrations...')
    
    const migrations = [
      '001_initial_schema.sql',
      '002_rls_policies.sql', 
      '003_functions.sql',
      '004_auth_tables.sql'
    ]

    for (const migration of migrations) {
      try {
        console.log(`📄 Running migration: ${migration}`)
        
        const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migration)
        const sql = readFileSync(migrationPath, 'utf8')
        
        await client.query(sql)
        
        console.log(`✅ Successfully ran ${migration}`)
      } catch (err) {
        console.error(`❌ Failed to run ${migration}:`, err.message)
        process.exit(1)
      }
    }
    
    console.log('🎉 All migrations completed successfully!')
  } catch (err) {
    console.error('❌ Database connection failed:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations().catch(console.error)