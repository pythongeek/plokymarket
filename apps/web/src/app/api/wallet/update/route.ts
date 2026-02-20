import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/wallet/update
 * Server-Sent Events (SSE) for real-time balance updates
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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