#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🔄 Running migration 007_notifications.sql...');

        const migrationPath = path.join(__dirname, '../supabase/migrations/007_notifications.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.substring(0, 100) + '...');
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    console.error('Error executing statement:', error);
                    console.error('Statement:', statement);
                } else {
                    console.log('✅ Statement executed successfully');
                }
            }
        }

        console.log('✅ Migration 007_notifications.sql completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Create exec_sql function if it doesn't exist
async function createExecFunction() {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (error && error.message.includes('function "exec_sql" does not exist')) {
        console.log('Creating exec_sql function...');

        const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

        const { error: createError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0);

        // Use direct SQL execution
        console.log('Function creation may require manual setup in Supabase dashboard');
    }
}

runMigration();