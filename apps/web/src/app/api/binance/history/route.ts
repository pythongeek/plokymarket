import { NextResponse } from 'next/server';

const BINANCE_API_BASE = 'https://api.binance.com';

interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

/**
 * GET /api/binance/history
 * Fetch historical price data for charting
 * 
 * Query params:
 * - symbol: Trading pair (default: 'USDTUSDT')
 * - interval: Kline interval (1m, 5m, 15m, 1h, 4h, 1d) - default: '1h'
 * - limit: Number of data points (default: 24, max: 500)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'USDTUSDT';
    const interval = searchParams.get('interval') || '1h';
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 500);

    // Validate interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json({
        success: false,
        error: `Invalid interval. Valid intervals: ${validIntervals.join(', ')}`,
      }, { status: 400 });
    }

    // Fetch klines from Binance
    const response = await fetch(
      `${BINANCE_API_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      // Try alternative symbol
      const altResponse = await fetch(
        `${BINANCE_API_BASE}/api/v3/klines?symbol=USDCUSDT&interval=${interval}&limit=${limit}`
      );
      
      if (!altResponse.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const altData: KlineData[] = await altResponse.json();
      return formatKlineResponse(altData, interval);
    }

    const data: KlineData[] = await response.json();
    return formatKlineResponse(data, interval);
  } catch (error) {
    console.error('Binance history API error:', error);
    
    // Return mock data for demo purposes
    return NextResponse.json({
      success: true,
      data: generateMockHistory(),
      source: 'mock',
      message: 'Using mock data due to API error',
    });
  }
}

function formatKlineResponse(data: KlineData[], interval: string) {
  const formattedData = data.map((kline) => ({
    timestamp: kline.openTime,
    date: new Date(kline.openTime).toISOString(),
    open: parseFloat(kline.open),
    high: parseFloat(kline.high),
    low: parseFloat(kline.low),
    close: parseFloat(kline.close),
    volume: parseFloat(kline.volume),
    quoteVolume: parseFloat(kline.quoteAssetVolume),
    trades: kline.numberOfTrades,
  }));

  // Calculate summary stats
  const prices = formattedData.map(d => d.close);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceChange = prices[prices.length - 1] - prices[0];
  const priceChangePercent = (priceChange / prices[0]) * 100;

  return NextResponse.json({
    success: true,
    data: formattedData,
    interval,
    summary: {
      startPrice: prices[0],
      endPrice: prices[prices.length - 1],
      avgPrice,
      minPrice,
      maxPrice,
      priceChange,
      priceChangePercent,
      dataPoints: formattedData.length,
    },
    source: 'binance',
  });
}

function generateMockHistory() {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const basePrice = 100; // Base USDT/BDT rate
  
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 2; // -1 to 1
    const price = basePrice + variation;
    
    data.push({
      timestamp: now - (i * hourMs),
      date: new Date(now - (i * hourMs)).toISOString(),
      open: price - 0.2,
      high: price + 0.5,
      low: price - 0.5,
      close: price,
      volume: Math.random() * 100000,
      quoteVolume: Math.random() * 10000000,
      trades: Math.floor(Math.random() * 1000),
    });
  }
  
  return data;
}