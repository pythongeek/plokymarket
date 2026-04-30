import { NextResponse } from 'next/server';
import { fetchUSDTPrice, fetchAllTickers, fetchP2PPrice, fetchSpotPrice } from '@/lib/binance/price';

/**
 * GET /api/binance/price
 * Fetch current USDT price from Binance
 * 
 * Query params:
 * - source: 'p2p' | 'spot' | 'all' (default: 'all')
 * - detailed: 'true' | 'false' (include additional data)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const detailed = searchParams.get('detailed') === 'true';

    let priceData;

    switch (source) {
      case 'p2p':
        priceData = await fetchP2PPrice();
        break;
      case 'spot':
        priceData = await fetchSpotPrice();
        break;
      case 'all':
      default:
        priceData = await fetchUSDTPrice();
        break;
    }

    const response: any = {
      success: true,
      data: priceData,
    };

    // Include additional data if requested
    if (detailed) {
      try {
        const tickers = await fetchAllTickers();
        const usdtTickers = tickers.filter(t => 
          t.symbol.endsWith('USDT') && 
          ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'].includes(t.symbol)
        );
        
        response.majorPairs = usdtTickers.map(t => ({
          symbol: t.symbol,
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
        }));
      } catch (error) {
        console.error('Failed to fetch detailed data:', error);
        response.majorPairs = [];
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Binance price API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        price: 100, // Fallback rate
        timestamp: Date.now(),
        source: 'fallback',
      },
    }, { status: 500 });
  }
}

/**
 * POST /api/binance/price
 * Force refresh and cache new price
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { source = 'all' } = body;

    let priceData;
    switch (source) {
      case 'p2p':
        priceData = await fetchP2PPrice();
        break;
      case 'spot':
        priceData = await fetchSpotPrice();
        break;
      default:
        priceData = await fetchUSDTPrice();
    }

    return NextResponse.json({
      success: true,
      data: priceData,
      message: 'Price refreshed successfully',
    });
  } catch (error) {
    console.error('Binance price refresh error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}