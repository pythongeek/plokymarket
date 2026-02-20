/**
 * Binance Price API Integration
 * Fetches real-time USDT/BDT price from Binance P2P, Spot market, and WebSocket
 */

const BINANCE_API_BASE = 'https://api.binance.com';
const BINANCE_P2P_API = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

// ===================================
// TYPES
// ===================================

export interface BinancePriceResponse {
  price: number;
  timestamp: number;
  source: 'p2p' | 'spot' | 'websocket' | 'cache';
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export interface TickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export interface PriceUpdate {
  eventType: string;
  eventTime: number;
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'price_update' | 'connected' | 'error';
  data?: BinancePriceResponse | string;
}

export type PriceCallback = (price: BinancePriceResponse) => void;
export type ConnectionCallback = (connected: boolean) => void;

// ===================================
// PRICE FETCHING FUNCTIONS
// ===================================

/**
 * Fetch USDT/BDT price from Binance P2P market
 * This gets the actual market rate from Bangladesh traders
 */
export async function fetchP2PPrice(): Promise<BinancePriceResponse> {
  try {
    const response = await fetch(BINANCE_P2P_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'BDT',
        tradeType: 'BUY',
        page: 1,
        rows: 10,
        countries: ['BD'],
        payTypes: ['bKash', 'Nagad', 'Rocket'],
        publisherType: null,
        transAmount: '',
        order: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Binance P2P API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No P2P offers found');
    }

    // Calculate average price from top offers
    const prices = data.data.map((offer: any) => 
      parseFloat(offer.adv.price)
    );
    
    const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    
    // Calculate min/max for range
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      price: Math.round(avgPrice * 100) / 100,
      timestamp: Date.now(),
      source: 'p2p',
      low24h: minPrice,
      high24h: maxPrice,
    };
  } catch (error) {
    console.error('Binance P2P fetch error:', error);
    throw error;
  }
}

/**
 * Fetch USDT price from Binance spot market (USDT/BTC or USDT/USD pairs)
 * Fallback if P2P is not available
 */
export async function fetchSpotPrice(): Promise<BinancePriceResponse> {
  try {
    // Get USDT/USDT price (1:1 with USD)
    // We'll use USDT/TRY as a proxy and convert, or use direct USD rate
    const response = await fetch(
      `${BINANCE_API_BASE}/api/v3/ticker/24hr?symbol=USDTUSDT`
    );

    if (!response.ok) {
      // Fallback: try USDC/USDT pair
      const fallbackResponse = await fetch(
        `${BINANCE_API_BASE}/api/v3/ticker/24hr?symbol=USDCUSDT`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Binance Spot API error: ${response.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      return {
        price: 1.0, // USDT is pegged 1:1 to USD
        timestamp: Date.now(),
        source: 'spot',
        change24h: parseFloat(fallbackData.priceChangePercent || '0'),
      };
    }

    const data = await response.json();

    return {
      price: 1.0, // USDT is pegged 1:1 to USD
      timestamp: Date.now(),
      source: 'spot',
      change24h: parseFloat(data.priceChangePercent || '0'),
      high24h: parseFloat(data.highPrice || '1'),
      low24h: parseFloat(data.lowPrice || '1'),
      volume24h: parseFloat(data.quoteVolume || '0'),
    };
  } catch (error) {
    console.error('Binance Spot fetch error:', error);
    throw error;
  }
}

/**
 * Fetch all ticker data from Binance
 */
export async function fetchAllTickers(): Promise<TickerData[]> {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/api/v3/ticker/24hr`);
    
    if (!response.ok) {
      throw new Error(`Binance Ticker API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Binance Ticker fetch error:', error);
    throw error;
  }
}

/**
 * Fetch USDT to BDT conversion rate
 * Uses multiple sources for accuracy
 */
export async function fetchUSDTPrice(): Promise<BinancePriceResponse> {
  try {
    // Try P2P first for real Bangladesh market rate
    return await fetchP2PPrice();
  } catch (error) {
    console.warn('P2P fetch failed, trying spot market:', error);
    
    // Fallback to spot market
    return await fetchSpotPrice();
  }
}

// ===================================
// WEBSOCKET CONNECTION MANAGER
// ===================================

class BinanceWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<PriceCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private lastPrice: BinancePriceResponse | null = null;
  private isConnecting = false;

  /**
   * Connect to Binance WebSocket stream
   */
  connect(symbols: string[] = ['usdtusdt', 'btcusdt', 'ethusdt']): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const streams = symbols.map(s => `${s}@ticker`).join('/');
    const wsUrl = `${BINANCE_WS_BASE}/${streams}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Binance WS] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[Binance WS] Parse error:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Binance WS] Error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('[Binance WS] Disconnected');
        this.isConnecting = false;
        this.stopPing();
        this.notifyConnection(false);
        this.attemptReconnect(symbols);
      };
    } catch (error) {
      console.error('[Binance WS] Connection error:', error);
      this.isConnecting = false;
      this.attemptReconnect(symbols);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    if (data.e === '24hrTicker') {
      const priceData: BinancePriceResponse = {
        price: parseFloat(data.c), // Current price
        timestamp: data.E,
        source: 'websocket',
        change24h: parseFloat(data.P),
        high24h: parseFloat(data.h),
        low24h: parseFloat(data.l),
        volume24h: parseFloat(data.q),
      };

      this.lastPrice = priceData;
      this.notifySubscribers(priceData);
    }
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: PriceCallback): () => void {
    this.subscribers.add(callback);
    
    // Send last known price immediately
    if (this.lastPrice) {
      callback(this.lastPrice);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      
      // Close connection if no subscribers
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Subscribe to connection status updates
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of price update
   */
  private notifySubscribers(price: BinancePriceResponse): void {
    this.subscribers.forEach(callback => {
      try {
        callback(price);
      } catch (error) {
        console.error('[Binance WS] Callback error:', error);
      }
    });
  }

  /**
   * Notify connection status callbacks
   */
  private notifyConnection(connected: boolean): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[Binance WS] Connection callback error:', error);
      }
    });
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(symbols: string[]): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Binance WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[Binance WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(symbols);
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.connectionCallbacks.clear();
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get last known price
   */
  getLastPrice(): BinancePriceResponse | null {
    return this.lastPrice;
  }
}

// Singleton instance
let wsManager: BinanceWebSocketManager | null = null;

/**
 * Get the WebSocket manager singleton
 */
export function getBinanceWebSocket(): BinanceWebSocketManager {
  if (!wsManager) {
    wsManager = new BinanceWebSocketManager();
  }
  return wsManager;
}

/**
 * Subscribe to real-time USDT price updates
 */
export function subscribeToUSDTPrice(
  callback: PriceCallback
): () => void {
  const manager = getBinanceWebSocket();
  
  if (!manager.isConnected()) {
    manager.connect(['usdtusdt']);
  }
  
  return manager.subscribe(callback);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Calculate BDT to USDT conversion
 */
export function calculateBDTtoUSDT(bdtAmount: number, rate: number): number {
  return Math.round((bdtAmount / rate) * 100) / 100;
}

/**
 * Calculate USDT to BDT conversion
 */
export function calculateUSDTtoBDT(usdtAmount: number, rate: number): number {
  return Math.round((usdtAmount * rate) * 100) / 100;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals: number = 2): string {
  return price.toFixed(decimals);
}

/**
 * Format price change percentage
 */
export function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}
