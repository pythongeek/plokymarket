import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { deposit_id, amount, method, user_phone, user_id } = body;

        // 1. Log the notification attempt (Optional: could also be done via DB trigger)
        console.log(`New Manual Deposit: ${deposit_id}, Amount: ${amount}, User: ${user_id}`);

        // 2. Trigger n8n webhook for Agent/Telegram notification
        const n8nWebhookUrl = process.env.N8N_AGENT_NOTIFY_WEBHOOK_URL;

        if (n8nWebhookUrl) {
            // Fire and forget, or handle response
            fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'manual_deposit_created',
                    data: {
                        deposit_id,
                        amount,
                        method,
                        user_phone,
                        user_id,
                        timestamp: new Date().toISOString(),
                        admin_link: `${process.env.NEXT_PUBLIC_APP_URL}/sys-cmd-7x9k2/deposits/${deposit_id}`
                    }
                })
            }).catch(err => console.error('n8n notification failed:', err));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notify agent error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
