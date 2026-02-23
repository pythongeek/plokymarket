import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { bkashService } from '@/lib/payments/bkash';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Verify user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, method } = body;

        // Validation
        if (!amount || amount < 100) {
            return NextResponse.json({ error: 'Minimum deposit is ৳100' }, { status: 400 });
        }

        if (!method || !['bkash', 'nagad', 'rocket'].includes(method)) {
            return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
        }

        // Generate invoice number
        const invoiceNumber = `DEP${Date.now()}${user.id.slice(0, 8)}`;
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/deposit/callback`;

        let paymentData: any;

        if (method === 'bkash') {
            // Create bKash payment
            paymentData = await bkashService.createPayment(amount, invoiceNumber, callbackUrl);
        } else {
            // Handle other methods similarly
            return NextResponse.json({ error: 'Method not yet implemented' }, { status: 400 });
        }

        // Create pending transaction
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .insert({
                user_id: user.id,
                type: 'deposit',
                amount,
                method,
                status: 'pending',
                transaction_id: paymentData.paymentID,
                provider_response: paymentData,
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
            })
            .select()
            .single();

        if (txError) {
            console.error('Transaction creation error:', txError);
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            transaction,
            paymentUrl: paymentData.bkashURL,
        });

    } catch (error) {
        console.error('Deposit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
