// ===================================
// ENUM TYPES
// ===================================

export type MarketStatus = 'active' | 'closed' | 'resolved' | 'cancelled';
export type OutcomeType = 'YES' | 'NO';
export type OrderType = 'limit' | 'market';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled';
export type TransactionType = 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'settlement' | 'refund';
export type OracleStatus = 'pending' | 'verified' | 'disputed' | 'finalized';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'bkash' | 'nagad' | 'bank_transfer';

// ===================================
// USER & WALLET
// ===================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  kyc_verified: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

// ===================================
// MARKETS
// ===================================

export interface Market {
  id: string;
  question: string;
  description?: string;
  category: string;
  source_url?: string;
  image_url?: string;
  creator_id?: string;
  status: MarketStatus;
  resolution_source?: string;
  min_price: number;
  max_price: number;
  tick_size: number;
  created_at: string;
  trading_closes_at: string;
  event_date: string;
  resolved_at?: string;
  winning_outcome?: OutcomeType;
  resolution_source_type?: string;
  resolution_data?: Record<string, any>;
  resolution_details?: Record<string, any>;
  total_volume: number;
  yes_shares_outstanding: number;
  no_shares_outstanding: number;
  fee_percent?: number;
  initial_liquidity?: number;
  maker_rebate_percent?: number;
  // Computed fields
  yes_price?: number;
  no_price?: number;
}

// ===================================
// ORDERS & TRADES
// ===================================

export interface Order {
  id: string;
  market_id: string;
  user_id: string;
  order_type: OrderType;
  side: OrderSide;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface Trade {
  id: string;
  market_id: string;
  buy_order_id?: string;
  sell_order_id?: string;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  buyer_id?: string;
  seller_id?: string;
  created_at: string;
}

// ===================================
// POSITIONS & TRANSACTIONS
// ===================================

export interface Position {
  id: string;
  market_id: string;
  user_id: string;
  outcome: OutcomeType;
  quantity: number;
  average_price: number;
  realized_pnl: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  market?: Market;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string;
  trade_id?: string;
  market_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ===================================
// ORACLE & PAYMENTS
// ===================================

export interface OracleVerification {
  id: string;
  market_id: string;
  ai_result?: OutcomeType;
  ai_confidence?: number;
  ai_reasoning?: string;
  scraped_data?: Record<string, any>;
  admin_id?: string;
  admin_decision?: OutcomeType;
  admin_notes?: string;
  status: OracleStatus;
  created_at: string;
  finalized_at?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_id?: string;
  sender_number?: string;
  receiver_number?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

// ===================================
// MARKET SUGGESTIONS
// ===================================

export interface MarketSuggestion {
  id: string;
  title: string;
  description?: string;
  source_url?: string;
  ai_confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  metadata?: Record<string, any>;
}

// ===================================
// UI TYPES
// ===================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  adminOnly?: boolean;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  volume?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}
