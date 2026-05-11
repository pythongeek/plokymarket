import { NextRequest } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * GET /api/wallet/update
 * Server-Sent Events (SSE) for real-time balance updates
 */
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


export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Get initial balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('usdt_balance, locked_usdt')
        .eq('user_id', user.id)
        .single();

      sendEvent({
        type: 'connected',
        balance: wallet || { usdt_balance: 0, locked_usdt: 0 }
      });

      // Set up Supabase realtime subscription
      const channel = supabase
        .channel(`wallet_updates_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            sendEvent({
              type: 'balance_update',
              balance: payload.new
            });
          }
        )
        .subscribe();

      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        sendEvent({ type: 'ping', timestamp: Date.now() });
      }, 30000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        supabase.removeChannel(channel);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}