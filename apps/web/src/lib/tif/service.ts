/**
 * Partial Fill Management & TIF (Time In Force) Service
 * 
 * TIF Types:
 * - FOK (Fill or Kill): Complete immediate fill or total cancel
 * - IOC (Immediate or Cancel): Fill available, cancel remainder
 * - GTC (Good Till Canceled): Remain until filled or cancelled
 * - GTD (Good Till Date): GTC with auto-expiry
 * - AON (All or Nothing): No partial fills permitted
 */

import { supabase } from '@/lib/supabase';
import type {
  TIFType,
  Order,
  FillRecord,
  PartialFillState,
  TIFOrderResult,
  ReEntryResult,
  VWAPResult,
  OrderStatus,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const TIF_CONFIG = {
  // Timing
  IOC_EXECUTION_TIMEOUT_MS: 100,
  FOK_EXECUTION_TIMEOUT_MS: 50,
  GTD_CHECK_INTERVAL_MS: 60000, // 1 minute
  
  // Precision
  VWAP_DECIMAL_PLACES: 8,
  TICK_SIZE: 0.01,
  
  // Re-entry
  MAX_RE_ENTRY_ATTEMPTS: 3,
};

// ============================================
// TIF ORDER PLACEMENT
// ============================================

/**
 * Place order with TIF (Time In Force)
 */
export async function placeTIFOrder(
  marketId: string,
  userId: string,
  side: 'buy' | 'sell',
  price: number,
  size: number,
  tif: TIFType,
  options?: {
    orderType?: 'limit' | 'market';
    gtdExpiry?: string;
    postOnly?: boolean;
  }
): Promise<TIFOrderResult> {
  if (!supabase) {
    return {
      orderId: '',
      status: 'cancelled',
      message: 'Supabase not initialized',
    };
  }

  try {
    const { data, error } = await supabase.rpc('process_order_with_tif', {
      p_market_id: marketId,
      p_user_id: userId,
      p_side: side.toUpperCase(),
      p_price: price,
      p_size: size,
      p_order_type: options?.orderType?.toUpperCase() || 'LIMIT',
      p_tif: tif,
      p_gtd_expiry: options?.gtdExpiry || null,
      p_time_in_force: tif,
    });

    if (error) {
      console.error('TIF order error:', error);
      return {
        orderId: '',
        status: 'cancelled',
        message: error.message,
      };
    }

    if (data && data.length > 0) {
      const result = data[0];
      
      // For FOK/IOC/AON, wait briefly and check final status
      if (['FOK', 'IOC', 'AON'].includes(tif)) {
        await sleep(TIF_CONFIG.IOC_EXECUTION_TIMEOUT_MS);
        const finalState = await getPartialFillState(result.order_id);
        
        return {
          orderId: result.order_id,
          status: finalState?.status || result.status,
          message: result.message,
          filled: finalState?.filledQuantity,
          remaining: finalState?.remainingQuantity,
          avgPrice: finalState?.avgFillPrice,
        };
      }

      return {
        orderId: result.order_id,
        status: result.status,
        message: result.message,
      };
    }

    return {
      orderId: '',
      status: 'cancelled',
      message: 'No response from order service',
    };
  } catch (error: any) {
    return {
      orderId: '',
      status: 'cancelled',
      message: error?.message || 'Order placement failed',
    };
  }
}

// ============================================
// PARTIAL FILL TRACKING
// ============================================

/**
 * Get complete partial fill state for an order
 */
export async function getPartialFillState(orderId: string): Promise<PartialFillState | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('partial_fill_state')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error || !data) {
    console.error('Error fetching partial fill state:', error);
    return null;
  }

  return {
    orderId: data.order_id,
    userId: data.user_id,
    marketId: data.market_id,
    side: data.side.toLowerCase() as 'buy' | 'sell',
    price: parseFloat(data.price),
    originalQuantity: parseFloat(data.original_quantity),
    filledQuantity: parseFloat(data.filled_quantity),
    remainingQuantity: parseFloat(data.remaining_quantity),
    avgFillPrice: parseFloat(data.avg_fill_price),
    fillCount: data.fill_count,
    lastFillAt: data.last_fill_at,
    tif: data.tif,
    gtdExpiry: data.gtd_expiry,
    status: data.status.toLowerCase() as OrderStatus,
    timePriority: data.time_priority,
    isReEntry: data.is_re_entry,
    parentOrderId: data.parent_order_id,
    fillHistory: data.fill_history || [],
  };
}

/**
 * Get fill records for an order
 */
export async function getFillRecords(orderId: string): Promise<FillRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('fill_records')
    .select('*')
    .eq('order_id', orderId)
    .order('fill_number', { ascending: true });

  if (error) {
    console.error('Error fetching fill records:', error);
    return [];
  }

  return (data || []).map(fill => ({
    id: fill.id,
    order_id: fill.order_id,
    quantity: parseFloat(fill.quantity),
    price: parseFloat(fill.price),
    total_value: parseFloat(fill.total_value),
    counterparty_order_id: fill.counterparty_order_id,
    counterparty_user_id: fill.counterparty_user_id,
    trade_id: fill.trade_id,
    fill_number: fill.fill_number,
    is_maker: fill.is_maker,
    transaction_hash: fill.transaction_hash,
    blockchain_reference: fill.blockchain_reference,
    filled_at: fill.filled_at,
    created_at: fill.created_at,
  }));
}

// ============================================
// VWAP CALCULATION
// ============================================

/**
 * Calculate Volume-Weighted Average Price (VWAP)
 * 
 * Formula: VWAP = Σ(Price × Quantity) / Σ(Quantity)
 * 
 * @param fills Array of fill records
 * @returns VWAP result with full precision
 */
export function calculateVWAP(fills: FillRecord[]): VWAPResult {
  if (fills.length === 0) {
    return {
      totalValue: 0,
      totalQuantity: 0,
      averagePrice: 0,
      fills: [],
    };
  }

  let totalValue = 0;
  let totalQuantity = 0;

  for (const fill of fills) {
    totalValue += fill.price * fill.quantity;
    totalQuantity += fill.quantity;
  }

  // Calculate raw average with extra precision
  const rawAverage = (totalValue * Math.pow(10, TIF_CONFIG.VWAP_DECIMAL_PLACES)) / totalQuantity;
  
  // Round half-up to nearest tick
  const remainder = rawAverage % Math.pow(10, TIF_CONFIG.VWAP_DECIMAL_PLACES);
  const halfway = Math.pow(10, TIF_CONFIG.VWAP_DECIMAL_PLACES) / 2;
  
  let rounded: number;
  if (remainder >= halfway) {
    rounded = Math.ceil(rawAverage / Math.pow(10, TIF_CONFIG.VWAP_DECIMAL_PLACES));
  } else {
    rounded = Math.floor(rawAverage / Math.pow(10, TIF_CONFIG.VWAP_DECIMAL_PLACES));
  }

  return {
    totalValue,
    totalQuantity,
    averagePrice: rounded,
    fills,
  };
}

/**
 * Get VWAP for an order from database
 */
export async function getOrderVWAP(orderId: string): Promise<VWAPResult> {
  const fills = await getFillRecords(orderId);
  return calculateVWAP(fills);
}

// ============================================
// GTC ORDER RE-ENTRY
// ============================================

/**
 * Re-enter a GTC order with a new price
 * 
 * Rules:
 * - Price unchanged: maintain original time priority
 * - Price improved (better for market): new time priority at new price
 * - Price worsened: rejected as queue jumping
 */
export async function reEnterGTCOrder(
  orderId: string,
  newPrice: number
): Promise<ReEntryResult> {
  if (!supabase) {
    return {
      newOrderId: '',
      preservedPriority: false,
      message: 'Supabase not initialized',
    };
  }

  try {
    const { data, error } = await supabase.rpc('re_enter_gtc_order', {
      p_order_id: orderId,
      p_new_price: newPrice,
    });

    if (error) {
      return {
        newOrderId: '',
        preservedPriority: false,
        message: error.message,
      };
    }

    if (data && data.length > 0) {
      return {
        newOrderId: data[0].new_order_id,
        preservedPriority: data[0].preserved_priority,
        message: data[0].message,
      };
    }

    return {
      newOrderId: '',
      preservedPriority: false,
      message: 'Re-entry failed',
    };
  } catch (error: any) {
    return {
      newOrderId: '',
      preservedPriority: false,
      message: error?.message || 'Re-entry failed',
    };
  }
}

// ============================================
// GTD EXPIRY MANAGEMENT
// ============================================

/**
 * Check and expire GTD orders that have reached their expiry time
 */
export async function checkGTDExpiry(): Promise<Array<{ orderId: string; releasedCollateral: number }>> {
  if (!supabase) return [];

  const { data, error } = await supabase.rpc('check_gtd_expiry');

  if (error) {
    console.error('GTD expiry check error:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    orderId: item.expired_order_id,
    releasedCollateral: parseFloat(item.released_collateral || '0'),
  }));
}

/**
 * Update GTD expiry time for an order
 */
export async function updateGTDExpiry(
  orderId: string,
  newExpiry: string
): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase not initialized' };
  }

  const { data, error } = await supabase
    .from('order_book')
    .update({ gtd_expiry: newExpiry, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'GTD expiry updated' };
}

// ============================================
// TIF-SPECIFIC QUERIES
// ============================================

/**
 * Get orders by TIF type
 */
export async function getOrdersByTIF(
  userId: string,
  tif: TIFType,
  status?: OrderStatus[]
): Promise<Order[]> {
  if (!supabase) return [];

  let query = supabase
    .from('order_book')
    .select('*')
    .eq('user_id', userId)
    .eq('tif', tif);

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by TIF:', error);
    return [];
  }

  return (data || []).map(mapOrderFromDB);
}

/**
 * Get all active GTD orders nearing expiry
 */
export async function getGTDNearingExpiry(
  userId: string,
  withinMinutes: number = 60
): Promise<Order[]> {
  if (!supabase) return [];

  const expiryThreshold = new Date(Date.now() + withinMinutes * 60000).toISOString();

  const { data, error } = await supabase
    .from('order_book')
    .select('*')
    .eq('user_id', userId)
    .eq('tif', 'GTD')
    .in('status', ['OPEN', 'PARTIAL'])
    .lte('gtd_expiry', expiryThreshold)
    .order('gtd_expiry', { ascending: true });

  if (error) {
    console.error('Error fetching GTD orders:', error);
    return [];
  }

  return (data || []).map(mapOrderFromDB);
}

// ============================================
// UTILITIES
// ============================================

function mapOrderFromDB(data: any): Order {
  return {
    id: data.id,
    market_id: data.market_id,
    user_id: data.user_id,
    order_type: data.order_type?.toLowerCase() || 'limit',
    side: data.side?.toLowerCase() || 'buy',
    outcome: data.outcome || 'YES',
    price: parseFloat(data.price),
    quantity: parseFloat(data.size),
    filled_quantity: parseFloat(data.filled || 0),
    status: data.status?.toLowerCase() || 'open',
    created_at: data.created_at,
    updated_at: data.updated_at,
    expires_at: data.gtd_expiry,
    tif: data.tif,
    gtd_expiry: data.gtd_expiry,
    original_quantity: parseFloat(data.original_quantity || data.size),
    avg_fill_price: parseFloat(data.avg_fill_price || 0),
    fill_count: data.fill_count || 0,
    last_fill_at: data.last_fill_at,
    time_priority: data.time_priority,
    is_re_entry: data.is_re_entry,
    parent_order_id: data.parent_order_id,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// EXPORTS
// ============================================

export { TIF_CONFIG };
