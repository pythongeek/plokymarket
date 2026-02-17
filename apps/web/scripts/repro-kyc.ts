
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Authenticating...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@plokymarket.bd',
        password: 'PlokyAdmin2026!'
    });

    if (authError || !session) {
        console.error('Auth failed:', authError);
        return;
    }

    const userId = session.user.id;
    console.log('Logged in as:', userId);

    console.log('Attempting KYC Submission...');

    // 1. Try upserting profile (This is where we suspect failure)
    const profileData = {
        id: userId,
        full_name: 'Test Admin KYC',
        verification_status: 'pending',
        updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await supabase
        .from('user_kyc_profiles')
        .upsert(profileData)
        .select()
        .single();

    if (profileError) {
        console.error('❌ user_kyc_profiles UPSERT failed:', profileError);
    } else {
        console.log('✅ user_kyc_profiles UPSERT success:', profile);
    }

    // 2. Try inserting submission
    const submissionData = {
        user_id: userId,
        submitted_data: { test: true },
        status: 'pending'
    };

    const { data: sub, error: subError } = await supabase
        .from('kyc_submissions')
        .insert(submissionData)
        .select()
        .single();

    if (subError) {
        console.error('❌ kyc_submissions INSERT failed:', subError);
    } else {
        console.log('✅ kyc_submissions INSERT success:', sub);
    }
}

run().catch(console.error);
