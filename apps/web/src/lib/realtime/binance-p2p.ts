// Binance P2P API for Real-time USDT/BDT Exchange Rate

export interface BinanceP2PResponse {
  success: boolean;
  data?: BinanceP2PData[];
  error?: string;
}

export interface BinanceP2PData {
  advNo: string;
  asset: string;
  fiat: string;
  price: string;
  amount: string;
  tradeType: 'BUY' | 'SELL';
  merchantRate: string;
  publisherNickname: string;
  payTypes: string[];
  tradeMethods: {
    payMethodId: string;
    payMethodName: string;
    payType: string;
  }[];
  advDetail: {
    price: string;
    minSingleTransAmount: string;
    maxSingleTransAmount: string;
    makerCoinRemainAmount: string;
  };
}

export interface ExchangeRate {
  usdt_to_bdt: number;
  bdt_to_usdt: number;
  source: 'binance_p2p' | 'binance_spot' | 'manual';
  fetched_at: string;
  buy_rate?: number;  // Rate when buying USDT with BDT
  sell_rate?: number; // Rate when selling USDT for BDT
}

const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

export async function fetchBinanceP2PRates(): Promise<ExchangeRate | null> {
  try {
    // Fetch BUY rates (how much BDT to pay for USDT)
    const buyPayload = {
      asset: 'USDT',
      fiat: 'BDT',
      tradeType: 'BUY', // Users buying USDT with BDT
      page: 1,
      rows: 10,
      payTypes: []
    };

    const buyResponse = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(buyPayload)
    });

    const buyData: BinanceP2PResponse = await buyResponse.json();

    // Fetch SELL rates (how much BDT you get for USDT)
    const sellPayload = {
      asset: 'USDT',
      fiat: 'BDT',
      tradeType: 'SELL', // Users selling USDT for BDT
      page: 1,
      rows: 10,
      payTypes: []
    };

    const sellResponse = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sellPayload)
    });

    const sellData: BinanceP2PResponse = await sellResponse.json();

    // Calculate average rates from top 5 offers
    let buyPrices: number[] = [];
    let sellPrices: number[] = [];

    if (buyData.success && buyData.data) {
      buyPrices = buyData.data.slice(0, 5).map(d => {
        // Handle new nested adv structure or fallback
        const adv = (d as any).adv || d;
        const detail = adv.advDetail || adv;
        return parseFloat(detail.price || (d as any).price);
      }).filter(p => !isNaN(p));
    }

    if (sellData.success && sellData.data) {
      sellPrices = sellData.data.slice(0, 5).map(d => {
        // Handle new nested adv structure or fallback
        const adv = (d as any).adv || d;
        const detail = adv.advDetail || adv;
        return parseFloat(detail.price || (d as any).price);
      }).filter(p => !isNaN(p));
    }

    const avgBuyRate = buyPrices.length > 0
      ? buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length
      : 0;

    const avgSellRate = sellPrices.length > 0
      ? sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length
      : 0;

    // Use mid-rate for calculation (average of buy and sell)
    const midRate = (avgBuyRate + avgSellRate) / 2;

    if (midRate === 0 || isNaN(midRate)) {
      console.error('[Binance P2P] Invalid rate calculated');
      return null;
    }

    return {
      usdt_to_bdt: Math.round(midRate * 100) / 100,
      bdt_to_usdt: Math.round((1 / midRate) * 1000000) / 1000000,
      source: 'binance_p2p',
      fetched_at: new Date().toISOString(),
      buy_rate: Math.round(avgBuyRate * 100) / 100,
      sell_rate: Math.round(avgSellRate * 100) / 100
    };
  } catch (error) {
    console.error('[Binance P2P] Error fetching rates:', error);
    return null;
  }
}

// Get only the best (lowest) rate
export async function fetchBestBinanceP2PRate(): Promise<number | null> {
  try {
    const payload = {
      asset: 'USDT',
      fiat: 'BDT',
      tradeType: 'BUY',
      page: 1,
      rows: 1,
      payTypes: []
    };

    const response = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data: BinanceP2PResponse = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const first = data.data[0] as any;
      const adv = first.adv || first;
      const detail = adv.advDetail || adv;
      return parseFloat(detail.price || first.price);
    }

    return null;
  } catch (error) {
    console.error('[Binance P2P] Error fetching best rate:', error);
    return null;
  }
}

// Fallback to Binance Spot price (less accurate for BDT)
export async function fetchBinanceSpotPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.binance.com/api/v3/ticker/price?symbol=USDTBUSD'
    );
    const data = await response.json();

    // Convert USDT to BDT using approximate rate (120 BDT per USDT as fallback)
    // This is a rough estimate - P2P rates are more accurate for BDT
    const usdtPrice = parseFloat(data.price);
    return usdtPrice * 120; // Approximate BDT rate
  } catch (error) {
    console.error('[Binance Spot] Error fetching price:', error);
    return null;
  }
}

export async function getExchangeRate(): Promise<ExchangeRate> {
  // Try Binance P2P first
  let rate = await fetchBinanceP2PRates();

  if (rate) {
    return rate;
  }

  // Fallback to spot price
  const spotRate = await fetchBinanceSpotPrice();

  if (spotRate) {
    return {
      usdt_to_bdt: Math.round(spotRate * 100) / 100,
      bdt_to_usdt: Math.round((1 / spotRate) * 1000000) / 1000000,
      source: 'binance_spot',
      fetched_at: new Date().toISOString()
    };
  }

  // Final fallback
  return {
    usdt_to_bdt: 120.00,
    bdt_to_usdt: 0.008333,
    source: 'manual',
    fetched_at: new Date().toISOString(),
    buy_rate: 120.00,
    sell_rate: 118.80
  };
}

// Class for real-time rate tracking
export class ExchangeRateTracker {
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(rate: ExchangeRate) => void> = new Set();
  private pollInterval: number = 30000; // Default 30 seconds

  constructor(pollInterval?: number) {
    if (pollInterval) {
      this.pollInterval = pollInterval;
    }
  }

  addListener(callback: (rate: ExchangeRate) => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: (rate: ExchangeRate) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners(rate: ExchangeRate) {
    this.listeners.forEach(callback => callback(rate));
  }

  async start() {
    if (this.intervalId) return;

    // Initial fetch
    const rate = await getExchangeRate();
    this.notifyListeners(rate);

    // Set up interval
    this.intervalId = setInterval(async () => {
      const rate = await getExchangeRate();
      this.notifyListeners(rate);
    }, this.pollInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getPollInterval() {
    return this.pollInterval;
  }

  setPollInterval(interval: number) {
    this.pollInterval = interval;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }
}