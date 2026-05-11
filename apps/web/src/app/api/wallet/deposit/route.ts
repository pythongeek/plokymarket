import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { bkashService } from '@/lib/payments/bkash';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function POST(request: Request) {
    try {

        // Verify user
        const user = await getUserFromRequest(request);
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
