/**
 * Production CLOB Event Types
 * Better Than Polymarket Architecture
 */

export type ResolutionMethod = 
  | 'manual_admin'
  | 'ai_oracle'
  | 'expert_panel'
  | 'external_api'
  | 'consensus'
  | 'community_vote'
  | 'hybrid';

export type EventStatus = 'active' | 'paused' | 'closed' | 'resolved' | 'cancelled';

export type OrderType = 'limit' | 'market' | 'stop_loss' | 'take_profit' | 'trailing_stop' | 'iceberg';
// Note: Database enum uses lowercase values
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'DAY' | 'GTD';

export interface CreateEventInput {
  // Basic Info
  title: string;
  question: string;
  description?: string;
  slug?: string;
  
  // Categorization
  category: string;
  subcategory?: string;
  tags?: string[];
  image_url?: string;
  
  // Trading Parameters
  answer_type?: 'binary' | 'multiple';
  answer1?: string;
  answer2?: string;
  
  // Timing
  starts_at?: string;
  trading_opens_at?: string;
  trading_closes_at: string;
  
  // Resolution
  resolution_method: ResolutionMethod;
  resolution_delay_hours?: number;
  resolution_source?: string;
  
  // Liquidity
  initial_liquidity?: number;
  
  // AI Oracle Config
  ai_keywords?: string[];
  ai_sources?: string[];
  ai_confidence_threshold?: number;
  
  // Display
  is_featured?: boolean;
  
  // Polymarket compatibility
  condition_id?: string;
  token1?: string;
  token2?: string;
  neg_risk?: boolean;
}

export interface CreateEventResult {
  success: boolean;
  event_id?: string;
  market_id?: string;
  slug?: string;
  message?: string;
  features?: {
    clob: boolean;
    order_types: string[];
    matching: string;
    settlement: string;
  };
  error?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  question: string;
  description?: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  image_url?: string;
  status: EventStatus;
  is_featured: boolean;
  is_trending: boolean;
  answer_type: string;
  answer1: string;
  answer2: string;
  starts_at?: string;
  trading_closes_at: string;
  resolution_method: ResolutionMethod;
  resolution_delay: number;
  resolution_source?: string;
  initial_liquidity: number;
  total_volume: number;
  total_trades: number;
  unique_traders: number;
  current_yes_price: number;
  current_no_price: number;
  resolver_reference?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  market_count?: number;
}

export interface ResolutionConfig {
  id: string;
  event_id: string;
  market_id?: string;
  primary_method: ResolutionMethod;
  confidence_threshold: number;
  ai_keywords: string[];
  ai_sources: string[];
  resolver_reference?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'disputed' | 'cancelled';
  proposed_outcome?: number;
  final_outcome?: number;
  resolution_notes?: string;
  evidence_urls?: string[];
  scheduled_resolution_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  order_count: number;
}

export interface OrderBookDepth {
  market_id: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: string;
}

export interface PriceHistory {
  id: string;
  market_id: string;
  outcome: string;
  price: number;
  volume_24h: number;
  liquidity: number;
  recorded_at: string;
}

export interface PriceOHLC {
  market_id: string;
  outcome: string;
  hour: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
}

export interface CustomCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

// Order interface for advanced order types
export interface AdvancedOrder {
  id: string;
  market_id: string;
  user_id: string;
  side: 'buy' | 'sell';
  outcome: 'YES' | 'NO';
  order_type: OrderType;  // lowercase: 'limit', 'market', 'stop_loss', etc.
  price: number;
  quantity: number;
  filled_quantity: number;
  status: 'pending' | 'open' | 'partially_filled' | 'filled' | 'cancelled';
  time_in_force: TimeInForce;
  
  // Advanced fields
  stop_price?: number;
  trigger_condition?: 'STOP_LOSS' | 'TAKE_PROFIT';
  parent_order_id?: string;
  oco_group_id?: string;
  display_size?: number;
  refresh_size?: number;
  batch_id?: string;
  client_order_id?: string;
  
  created_at: string;
  updated_at: string;
}
