#!/usr/bin/env node

/**
 * Test script for Google OAuth functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGoogleOAuth() {
    console.log('🧪 Testing Google OAuth Configuration');
    console.log('====================================\n');

    try {
        // Test if we can initiate Google OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:4000/auth/callback',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) {
            console.error('❌ Google OAuth Error:', error.message);

            if (error.message.includes('Provider not found')) {
                console.log('\n💡 Solution: Enable Google provider in Supabase Dashboard');
                console.log('   Go to: Authentication > Providers > Google');
            }

            return false;
        }

        if (data.url) {
            console.log('✅ Google OAuth URL generated successfully!');
            console.log('🔗 OAuth URL:', data.url);
            console.log('\n✨ Google OAuth is configured correctly!');
            return true;
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        return false;
    }
}

// Run the test
testGoogleOAuth().then(success => {
    if (success) {
        console.log('\n🎉 Google OAuth test passed!');
    } else {
        console.log('\n🔧 Please configure Google OAuth in Supabase Dashboard');
        process.exit(1);
    }
});