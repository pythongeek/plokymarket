import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withdrawalRateLimiter } from '@/lib/security';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Initial Rate Limit Check
        const isLimited = await withdrawalRateLimiter.isRateLimited(user.id);
        if (isLimited) {
            return NextResponse.json({ error: 'Too many withdrawal requests. Please try again later.' }, { status: 429 });
        }

        // 3. Parse payload
        const body = await req.json();
        const { amount, method, phoneNumber, accountName } = body;

        // 4. Validation Rules
        if (!amount || amount < 500) {
            return NextResponse.json({ error: 'Minimum withdrawal is ৳500' }, { status: 400 });
        }

        const validMethods = ['bkash', 'nagad', 'rocket', 'bank'];
        if (!method || !validMethods.includes(method.toLowerCase())) {
            return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 });
        }

        if (!phoneNumber) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        // 5. KYC Tiered Daily Limit Check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('kyc_verified, kyc_level')
            .eq('id', user.id)
            .single();

        const dailyLimit = profile?.kyc_verified ? 50000 : 10000;
        const today = new Date().toISOString().split('T')[0];

        // Fetch today's approved/pending total
        const { data: todayRequests } = await supabase
            .from('withdrawal_requests')
            .select('amount')
            .eq('user_id', user.id)
            .gte('created_at', today)
            .in('status', ['pending', 'approved']);

        const todayTotal = (todayRequests || []).reduce((sum, req) => sum + Number(req.amount || 0), 0);

        if (todayTotal + amount > dailyLimit) {
            return NextResponse.json({ error: `Daily withdrawal limit exceeded. Limit: ৳${dailyLimit}` }, { status: 400 });
        }



        // 7. Fund Locking RPC
        // NOTE: lock_withdrawal_funds and unlock_withdrawal_funds must be implemented as SQL functions on the DB
        const { error: lockError } = await supabase.rpc('lock_withdrawal_funds', {
            p_user_id: user.id,
            p_amount: amount
        });

        if (lockError) {
            // Usually indicates insufficient DB-level spendable balance or missing RPC function
            return NextResponse.json({ error: 'Failed to lock funds' }, { status: 500 });
        }

        // 8. Withdrawal Record Creation
        const { data: withdrawal, error: withdrawError } = await supabase
            .from('withdrawal_requests')
            .insert({
                user_id: user.id,
                amount: amount,
                method: method.toLowerCase(),
                phone_number: phoneNumber,
                account_name: accountName,
                status: 'pending'
            })
            .select()
            .single();

        if (withdrawError) {
            // Critical Rollback
            await supabase.rpc('unlock_withdrawal_funds', { p_user_id: user.id, p_amount: amount });
            throw withdrawError; // escalate to top-level catch
        }

        // 9. Record the rate limit attempt
        await withdrawalRateLimiter.recordAttempt(user.id);

        // 10. Success Response
        return NextResponse.json({
            success: true,
            withdrawal,
            message: 'Withdrawal request submitted. It will be processed within 24 hours.'
        });

    } catch (error: any) {
        // 11. Top-Level Catch
        console.error('Withdrawal error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
