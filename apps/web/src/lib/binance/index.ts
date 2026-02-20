/**
 * Binance API Integration Module
 * Real-time USDT price from Binance P2P and Spot markets
 */

export {
  // Price fetching functions
  fetchUSDTPrice,
  fetchP2PPrice,
  fetchSpotPrice,
  fetchAllTickers,
  
  // WebSocket functions
  subscribeToUSDTPrice,
  getBinanceWebSocket,
  
  // Utility functions
  calculateBDTtoUSDT,
  calculateUSDTtoBDT,
  formatPrice,
  formatPriceChange,
  
  // Types
  type BinancePriceResponse,
  type TickerData,
  type PriceUpdate,
  type WebSocketMessage,
  type PriceCallback,
  type ConnectionCallback,
} from './price';