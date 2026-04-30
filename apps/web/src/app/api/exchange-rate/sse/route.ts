import { NextRequest } from 'next/server';
import { fetchBinanceP2PRates, getExchangeRate } from '@/lib/realtime/binance-p2p';

/**
 * GET /api/exchange-rate/sse
 * Server-Sent Events for real-time exchange rate updates
 */
export async function GET(request: NextRequest) {
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream may be closed
        }
      };

      // Send initial connection message
      try {
        const initialRate = await getExchangeRate();
        sendEvent({
          type: 'connected',
          rate: initialRate,
          timestamp: Date.now()
        });
      } catch (e) {
        sendEvent({
          type: 'error',
          error: 'Failed to fetch initial rate'
        });
      }

      // Poll Binance P2P every 30 seconds
      let lastRate: number | null = null;

      const pollRate = async () => {
        try {
          const rate = await fetchBinanceP2PRates();
          if (rate && rate.usdt_to_bdt !== lastRate) {
            lastRate = rate.usdt_to_bdt;
            sendEvent({
              type: 'rate_update',
              rate: rate,
              timestamp: Date.now()
            });
          }
        } catch (e) {
          sendEvent({
            type: 'error',
            error: 'Failed to fetch rate'
          });
        }
      };

      // Initial poll
      await pollRate();

      // Set up interval (every 30 seconds)
      const intervalId = setInterval(pollRate, 30000);

      // Keep-alive ping every 15 seconds
      const keepAliveId = setInterval(() => {
        sendEvent({ type: 'ping', timestamp: Date.now() });
      }, 15000);

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        clearInterval(keepAliveId);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}