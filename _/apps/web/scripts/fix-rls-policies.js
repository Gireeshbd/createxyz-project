#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
    try {
        console.log('🔧 Fixing RLS policies for user_profiles...');

        // First, let's check if the user has a profile
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        console.log('Users found:', users?.length || 0);
        console.log('Users error:', usersError?.message);

        if (users && users.length > 0) {
            const user = users[0];
            console.log('First user:', user.email, user.id);

            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            console.log('Profile exists:', !!profile);
            console.log('Profile error:', profileError?.message);

            // If no profile exists, create one
            if (!profile && profileError?.code === 'PGRST116') {
                console.log('Creating profile for user...');
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: user.id,
                        full_name: user.user_metadata?.full_name || user.email,
                    })
                    .select()
                    .single();

                console.log('Profile created:', !!newProfile);
                console.log('Create error:', createError?.message);
            }
        }

        console.log('✅ RLS policies check completed');

    } catch (error) {
        console.error('❌ Error fixing RLS policies:', error);
    }
}

fixRLSPolicies();