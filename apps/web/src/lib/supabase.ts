import { createClient } from './supabase/client';

// Create client only if credentials are available
export const supabase = createClient();

// Helper function to get current user
export async function getCurrentUser() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Helper function to get session
export async function getSession() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Auth functions
export async function signUp(email: string, password: string, fullName: string) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  // Return both data and error for proper handling
  return { data, error };
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  // Return both data and error for proper handling
  return { data, error };
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Database helpers
export async function fetchMarkets() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMarketById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function fetchOrders(marketId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('market_id', marketId)
    .in('status', ['open', 'partially_filled'])
    .order('price', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchTrades(marketId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('market_id', marketId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

export async function fetchPositions(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('positions')
    .select('*, markets(*)')
    .eq('user_id', userId)
    .gt('quantity', 0);
  if (error) throw error;
  return data;
}

export async function fetchWallet(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function fetchTransactions(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function placeOrder(order: {
  market_id: string;
  side: 'buy' | 'sell';
  outcome: 'YES' | 'NO';
  price: number;
  quantity: number;
}) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function placeAtomicOrder(order: {
  market_id: string;
  side: 'buy' | 'sell';
  outcome: 'YES' | 'NO';
  price: number;
  quantity: number;
  order_type?: 'limit' | 'market';
}) {
  if (!supabase) throw new Error('Supabase client not initialized');

  // Place the order
  const { data: orderId, error } = await supabase.rpc('place_atomic_order', {
    p_market_id: order.market_id,
    p_side: order.side,
    p_outcome: order.outcome,
    p_price: order.price,
    p_quantity: order.quantity,
    p_order_type: order.order_type || 'limit'
  });

  if (error) {
    console.error('Atomic order error:', error);
    throw error;
  }

  // If it's a limit order (maker), start tracking for rebates
  // Market orders are taker orders, not eligible for maker rebates
  if (orderId && order.order_type !== 'market') {
    try {
      await supabase.rpc('start_resting_order_tracking', {
        p_order_id: orderId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_market_id: order.market_id,
        p_side: order.side,
        p_price: order.price,
        p_quantity: order.quantity
      });
    } catch (trackError) {
      // Don't fail the order if tracking fails
      console.error('Error starting order tracking:', trackError);
    }
  }

  return orderId; // Returns the order UUID
}

export async function cancelOrder(orderId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);
  if (error) throw error;
}

// Admin functions
export async function createMarket(market: {
  question: string;
  description?: string;
  category: string;
  source_url?: string;
  trading_closes_at: string;
  event_date: string;
  resolution_source_type?: string;
  resolution_data?: any;
  fee_percent?: number;
  initial_liquidity?: number;
  maker_rebate_percent?: number;
}) {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('markets')
    .insert(market)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resolveMarket(marketId: string, winningOutcome: 'YES' | 'NO') {
  if (!supabase) return;
  const { error } = await supabase
    .from('markets')
    .update({
      status: 'resolved',
      winning_outcome: winningOutcome,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', marketId);
  if (error) throw error;
}

// Market Suggestions functions
export async function fetchMarketSuggestions() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('market_suggestions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateSuggestionStatus(id: string, status: 'approved' | 'rejected') {
  if (!supabase) return;
  const { error } = await supabase
    .from('market_suggestions')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSuggestion(id: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from('market_suggestions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Realtime subscription - now handled by custom hooks in components
