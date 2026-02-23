import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/withdrawals/verify
// Verify OTP and finalize the withdrawal request
export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { verificationId, otpCode } = body;

        if (!verificationId || !otpCode) {
            return NextResponse.json(
                { error: 'Verification ID and OTP code are required' },
                { status: 400 }
            );
        }

        // 2. Fetch Verification Record
        const { data: verification, error: verifError } = await supabase
            .from('withdrawal_verifications')
            .select('*')
            .eq('id', verificationId)
            .eq('user_id', user.id)
            .single();

        if (verifError || !verification) {
            return NextResponse.json(
                { error: 'Verification session not found or invalid' },
                { status: 404 }
            );
        }

        // 3. Status Checks
        if (verification.is_verified) {
            return NextResponse.json(
                { error: 'This withdrawal request has already been verified' },
                { status: 400 }
            );
        }

        if (verification.attempts >= 3) {
            return NextResponse.json(
                { error: 'Too many failed attempts. This session is locked.' },
                { status: 403 }
            );
        }

        if (new Date() > new Date(verification.expires_at)) {
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new withdrawal.' },
                { status: 400 }
            );
        }

        // 4. Validate OTP
        if (verification.otp_code !== otpCode) {
            // Increment attempts
            await supabase
                .from('withdrawal_verifications')
                .update({ attempts: verification.attempts + 1 })
                .eq('id', verificationId);

            return NextResponse.json(
                { error: `Invalid OTP. You have ${2 - verification.attempts} attempts remaining.` },
                { status: 400 }
            );
        }

        // 5. OTP matches! Mark as verified
        await supabase
            .from('withdrawal_verifications')
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', verificationId);

        // 6. Execute original withdrawal insertion logic from payload
        const payload = verification.withdrawal_payload;

        const { data: withdrawalRequest, error: insertError } = await supabase
            .from('withdrawal_requests')
            .insert({
                user_id: user.id,
                usdt_amount: payload.usdt_amount,
                bdt_amount: payload.bdt_amount,
                exchange_rate: payload.exchange_rate,
                mfs_provider: payload.mfs_provider,
                recipient_number: payload.recipient_number,
                recipient_name: payload.recipient_name,
                status: 'pending',
                ip_address: payload.ip_address,
                user_agent: payload.user_agent
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create actual withdrawal request post-verification:', insertError);
            return NextResponse.json(
                { error: 'Failed to create withdrawal request' },
                { status: 500 }
            );
        }

        // Trigger withdrawal processing workflow via Upstash
        try {
            if (process.env.UPSTASH_WORKFLOW_BASE_URL && process.env.UPSTASH_WORKFLOW_TOKEN) {
                const workflowResponse = await fetch(`${process.env.UPSTASH_WORKFLOW_BASE_URL}/withdrawal-processing`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.UPSTASH_WORKFLOW_TOKEN}`
                    },
                    body: JSON.stringify({
                        withdrawalId: withdrawalRequest.id,
                        userId: user.id,
                        amount: payload.usdt_amount,
                        mfsProvider: payload.mfs_provider,
                        recipientNumber: payload.recipient_number
                    })
                });

                if (!workflowResponse.ok) {
                    console.warn('Failed to trigger withdrawal processing workflow from /verify');
                }
            }
        } catch (workflowError) {
            console.warn('Workflow processing failed from /verify:', workflowError);
        }

        return NextResponse.json({
            success: true,
            message: 'Withdrawal verification successful',
            withdrawalRequest: {
                id: withdrawalRequest.id,
                usdtAmount: withdrawalRequest.usdt_amount,
                bdtAmount: withdrawalRequest.bdt_amount,
                mfsProvider: withdrawalRequest.mfs_provider,
                recipientNumber: withdrawalRequest.recipient_number,
                status: withdrawalRequest.status,
                createdAt: withdrawalRequest.created_at
            }
        });

    } catch (error) {
        console.error('Withdrawal verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
