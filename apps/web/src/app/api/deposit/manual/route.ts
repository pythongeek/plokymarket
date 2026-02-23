import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { method, amount, wallet_id, user_phone, transaction_id } = body;

        // 1. Get current user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify transaction ID format
        // bKash: 8-10 alphanumeric characters
        // Nagad: 8-10 alphanumeric characters
        const trxIdPattern = /^[A-Z0-9]{8,12}$/i;
        if (!trxIdPattern.test(transaction_id)) {
            return NextResponse.json({ error: 'Invalid Transaction ID format' }, { status: 400 });
        }

        // 3. Check for duplicate TrxID within the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: existing } = await supabase
            .from('manual_deposits')
            .select('id')
            .eq('transaction_id', transaction_id.toUpperCase())
            .gt('created_at', thirtyDaysAgo.toISOString())
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                error: 'এই ট্রানজাকশন আইডিটি আগে ব্যবহার করা হয়েছে।',
                errorEn: 'This Transaction ID has already been used.'
            }, { status: 409 });
        }

        // 4. Rate limiting check (e.g., max 3 pending deposits)
        const { count } = await supabase
            .from('manual_deposits')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'pending');

        if (count && count >= 3) {
            return NextResponse.json({
                error: 'আপনার ৩টি রিকোয়েস্ট পেন্ডিং আছে। অনুগ্রহ করে এজেন্ট প্রসেস করা পর্যন্ত অপেক্ষা করুন।',
                errorEn: 'You have 3 pending requests. Please wait until they are processed.'
            }, { status: 429 });
        }

        // 5. Create deposit request
        const { data: deposit, error: depositError } = await supabase
            .from('manual_deposits')
            .insert({
                user_id: user.id,
                method,
                amount_bdt: amount,
                agent_wallet_id: wallet_id,
                user_phone_number: user_phone,
                transaction_id: transaction_id.toUpperCase(),
                status: 'pending'
            })
            .select()
            .single();

        if (depositError) throw depositError;

        // 6. Trigger notification
        const n8nWebhookUrl = process.env.N8N_AGENT_NOTIFY_WEBHOOK_URL;
        if (n8nWebhookUrl) {
            fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'manual_deposit_created',
                    data: {
                        ...deposit,
                        user_id: user.id,
                        admin_link: `${process.env.NEXT_PUBLIC_APP_URL}/sys-cmd-7x9k2/deposits/${deposit.id}`
                    }
                })
            }).catch(err => console.error('n8n notification failed:', err));
        }

        return NextResponse.json({ success: true, deposit_id: deposit.id });

    } catch (error: any) {
        console.error('Manual Deposit API Error:', error);
        return NextResponse.json(
            { error: 'ডিপোজিট সাবমিট করতে সমস্যা হয়েছে।', detail: error.message },
            { status: 500 }
        );
    }
}
