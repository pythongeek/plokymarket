/**
 * ============================================================
 * types/plokymarket.ts — Shared domain types
 * ============================================================
 * Import from this file in both client components and API routes
 * to keep the type system consistent across the entire app.
 *
 * These types mirror the Supabase DB schema after migration 140.
 */

// ── Event ────────────────────────────────────────────────────────────────────

export type EventStatus = 'draft' | 'pending' | 'active' | 'resolved' | 'cancelled';

export interface Event {
  id:              string;
  title:           string;
  question?:       string;
  description?:    string;
  slug:            string;
  category:        string;
  subcategory?:    string;
  tags?:           string[];
  image_url?:      string;
  status:          EventStatus;
  trading_closes_at: string; // UTC ISO
  created_at:      string;
  updated_at?:     string;
  created_by?:     string;
  is_featured?:    boolean;
  is_custom_category?: boolean;
  // Joined from markets via foreign key
  markets?:        Market[];
}

// ── Market ───────────────────────────────────────────────────────────────────

export type MarketStatus = 'pending' | 'active' | 'closed' | 'resolved' | 'cancelled';
export type AnswerType   = 'binary' | 'multiple' | 'scalar';

export interface Market {
  id:              string;
  event_id?:       string;
  name?:           string;      // Human-readable title (often same as question)
  question:        string;
  slug:            string;
  category?:       string;
  subcategory?:    string;
  status:          MarketStatus;

  // Answers
  answer_type:     AnswerType;
  answer1?:        string;      // Default: 'হ্যাঁ (Yes)'
  answer2?:        string;      // Default: 'না (No)'

  // Prices (0.00 – 1.00)
  yes_price:       number;
  no_price:        number;

  // Financial
  total_volume:    number;      // BDT
  liquidity:       number;      // BDT currently in orderbook

  // Timing
  trading_closes_at?: string;   // UTC ISO (same as events.trading_closes_at)
  resolution_delay_hours?: number;

  // Visibility
  is_featured?:    boolean;
  image_url?:      string;
  tags?:           string[];

  // Meta
  created_by?:     string;
  created_at:      string;
  updated_at?:     string;
}

// ── Order ────────────────────────────────────────────────────────────────────

export type OrderSide    = 'buy' | 'sell';
export type OrderOutcome = 'yes' | 'no';
export type OrderStatus  = 'open' | 'partial' | 'filled' | 'cancelled';
export type OrderType    = 'limit' | 'market';

export interface Order {
  id:         string;
  market_id:  string;
  user_id:    string;
  order_type: OrderType;
  side:       OrderSide;
  outcome:    OrderOutcome;
  price:      number;    // 0.00 – 1.00
  quantity:   number;    // BDT
  filled:     number;    // BDT filled so far
  status:     OrderStatus;
  created_at: string;
  updated_at?: string;
}

// ── Trade ────────────────────────────────────────────────────────────────────

export interface Trade {
  id:         string;
  market_id:  string;
  // New schema (migration 140)
  buyer_id?:  string;
  seller_id?: string;
  // Legacy schema (pre-140)
  user_id?:   string;
  price:      number;
  quantity:   number;
  outcome:    OrderOutcome;
  created_at: string;
}

// ── Price History ─────────────────────────────────────────────────────────────

export interface PriceHistoryPoint {
  id:          string;
  market_id:   string;
  yes_price:   number;
  no_price:    number;
  volume:      number;
  recorded_at: string; // UTC ISO
}

// ── Resolution System ─────────────────────────────────────────────────────────

export type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'external_api' | 'consensus' | 'community_vote' | 'hybrid';

export interface ResolutionSystem {
  id:                   string;
  event_id:             string;
  method:               ResolutionMethod;
  confidence_threshold: number;   // 0 – 100
  ai_keywords?:         string[];
  ai_sources?:          string[];
  resolver_reference?:  string;
  created_at:           string;
}

// ── API response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T = void> {
  success:  true;
  data?:    T;
  message?: string;
}

export interface ApiError {
  success: false;
  error:   string;
  detail?: string;
  hint?:   string;
}

export type ApiResponse<T = void> = ApiSuccess<T> | ApiError;

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface AdminEventRow extends Event {
  market_count: number;
  resolver_reference?: string;
}
