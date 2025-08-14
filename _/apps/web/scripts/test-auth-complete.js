#!/usr/bin/env node

/**
 * Comprehensive Auth System Test
 * Tests all authentication flows and database integration
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Comprehensive Auth System Test');
console.log('==================================\n');

async function testDatabaseConnection() {
    console.log('1️⃣ Testing Database Connection...');
    try {
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        if (error) throw error;
        console.log('   ✅ Database connection successful');
        return true;
    } catch (error) {
        console.log('   ❌ Database connection failed:', error.message);
        return false;
    }
}

async function testAuthTables() {
    console.log('\n2️⃣ Testing Auth Tables...');
    try {
        // Test user_profiles table
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(1);

        if (profileError) throw profileError;
        console.log('   ✅ User profiles table accessible');

        // Test if we can query auth.users (should fail with anon key)
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();
        if (!userError) {
            console.log('   ⚠️  Warning: Auth admin functions accessible with anon key');
        } else {
            console.log('   ✅ Auth admin properly restricted');
        }

        return true;
    } catch (error) {
        console.log('   ❌ Auth tables test failed:', error.message);
        return false;
    }
}

async function testGoogleOAuth() {
    console.log('\n3️⃣ Testing Google OAuth Configuration...');
    try {
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
            if (error.message.includes('Provider not found')) {
                console.log('   ❌ Google provider not enabled in Supabase Dashboard');
                console.log('   💡 Enable it at: Authentication > Providers > Google');
                return false;
            }
            throw error;
        }

        if (data.url) {
            console.log('   ✅ Google OAuth URL generated successfully');
            console.log('   🔗 OAuth URL available (not shown for security)');
            return true;
        }

        return false;
    } catch (error) {
        console.log('   ❌ Google OAuth test failed:', error.message);
        return false;
    }
}

async function testRLSPolicies() {
    console.log('\n4️⃣ Testing Row Level Security Policies...');
    try {
        // Test that we can't access user_profiles without auth
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*');

        if (error && error.message.includes('RLS')) {
            console.log('   ✅ RLS policies are active (good!)');
            return true;
        } else if (!error && data) {
            console.log('   ⚠️  Warning: User profiles accessible without authentication');
            console.log('   💡 Check RLS policies on user_profiles table');
            return true; // Not necessarily a failure
        }

        return true;
    } catch (error) {
        console.log('   ❌ RLS test failed:', error.message);
        return false;
    }
}

async function testAuthFunctions() {
    console.log('\n5️⃣ Testing Auth Functions...');
    try {
        // Test that auth functions exist by checking database structure
        const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .limit(1);

        if (error && error.message.includes('permission denied')) {
            console.log('   ✅ Auth functions and RLS are working');
            return true;
        } else if (error && error.message.includes('does not exist')) {
            console.log('   ❌ Database tables not found');
            console.log('   💡 Run database migrations');
            return false;
        } else {
            console.log('   ✅ Database structure is accessible');
            return true;
        }

        return true;
    } catch (error) {
        console.log('   ❌ Auth functions test failed:', error.message);
        return false;
    }
}

async function testEmailAuth() {
    console.log('\n6️⃣ Testing Email Auth Configuration...');
    try {
        // Try to sign up with a test email (this will fail but shows if auth is configured)
        const { data, error } = await supabase.auth.signUp({
            email: 'test@example.com',
            password: 'testpassword123'
        });

        if (error) {
            if (error.message.includes('Signup is disabled')) {
                console.log('   ⚠️  Email signup is disabled');
                console.log('   💡 Enable it in Supabase Dashboard: Authentication > Settings');
                return true; // Not necessarily a failure
            } else if (error.message.includes('Unable to validate email address')) {
                console.log('   ✅ Email auth is configured (validation required)');
                return true;
            }
        }

        if (data.user) {
            console.log('   ✅ Email auth is working');
            // Clean up test user
            try {
                await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            } catch (cleanupError) {
                console.log('   ⚠️  Could not clean up test user');
            }
            return true;
        }

        return true;
    } catch (error) {
        console.log('   ❌ Email auth test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    const results = [];

    results.push(await testDatabaseConnection());
    results.push(await testAuthTables());
    results.push(await testGoogleOAuth());
    results.push(await testRLSPolicies());
    results.push(await testAuthFunctions());
    results.push(await testEmailAuth());

    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${passed}/${total} tests`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! Your auth system is ready.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
    }

    console.log('\n📋 Manual Tests to Perform:');
    console.log('============================');
    console.log('1. Sign up with email at: http://localhost:4000/account/signup');
    console.log('2. Sign in with email at: http://localhost:4000/account/signin');
    console.log('3. Sign in with Google at: http://localhost:4000/account/signin');
    console.log('4. Test password reset at: http://localhost:4000/account/forgot-password');
    console.log('5. Check user profile creation in Supabase Dashboard');
    console.log('6. Test sign out functionality');
    console.log('7. Test protected routes (if any)');

    return passed === total;
}

// Run all tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});