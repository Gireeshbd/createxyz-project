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

async function runSingleMigration() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        console.log('🚀 Connected to database, disabling trigger and creating manual function...')

        const migration = '006_disable_trigger_manual_profile.sql'

        console.log(`📄 Running migration: ${migration}`)

        const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migration)
        const sql = readFileSync(migrationPath, 'utf8')

        await client.query(sql)

        console.log(`✅ Successfully ran ${migration}`)
        console.log('🎉 Manual profile creation function ready!')

    } catch (err) {
        console.error('❌ Migration failed:', err.message)
        process.exit(1)
    } finally {
        await client.end()
    }
}

runSingleMigration().catch(console.error)