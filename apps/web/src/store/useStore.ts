import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Wallet,
  Market,
  Order,
  Trade,
  Position,
  Transaction,
  OutcomeType,
  OrderSide,
  MarketSuggestion,
} from '@/types';
import {
  supabase,
  signIn,
  signUp,
  signOut,
  fetchMarkets,
  fetchMarketById,
  fetchOrders,
  fetchTrades,
  fetchPositions,
  fetchWallet,
  fetchTransactions,
  placeOrder,
  cancelOrder,
  createMarket,
  resolveMarket,
  fetchMarketSuggestions,
  updateSuggestionStatus,
  deleteSuggestion,
  subscribeToMarket,
  subscribeToTrades,
} from '@/lib/supabase';
import { loginRateLimiter } from '@/lib/security';

// ===================================
// STORE STATE INTERFACE
// ===================================

interface StoreState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean | string>;
  register: (email: string, password: string, fullName: string) => Promise<boolean | string>;
  logout: () => void;

  // Data
  markets: Market[];
  orders: Order[];
  trades: Trade[];
  positions: Position[];
  transactions: Transaction[];
  wallet: Wallet | null;

  // Actions
  fetchMarkets: () => Promise<void>;
  fetchMarket: (id: string) => Promise<Market | null>;
  fetchOrders: (marketId: string) => Promise<void>;
  fetchTrades: (marketId: string) => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;

  // Trading
  placeOrder: (
    marketId: string,
    side: OrderSide,
    outcome: OutcomeType,
    price: number,
    quantity: number
  ) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;

  // Admin
  createMarket: (marketData: Partial<Market>) => Promise<boolean>;
  resolveMarket: (marketId: string, outcome: OutcomeType) => Promise<boolean>;
  fetchSuggestions: () => Promise<void>;
  updateSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  suggestions: MarketSuggestion[];

  // Wallet Management
  generateDepositAddress: (network: string) => Promise<any>;
  verifyDeposit: (txid: string, network: string) => Promise<any>;
  activeWallet: any | null;

  // Real-time
  subscribeToMarket: (marketId: string) => () => void;

  // Trading UI Slice
  tradingState: {
    price: number | null;
    quantity: number;
    side: 'buy' | 'sell';
    isOneClick: boolean;
    isBracket: boolean;
    stopLoss: number | null;
    takeProfit: number | null;
  };
  setTradingPrice: (price: number) => void;
  setTradingQuantity: (quantity: number) => void;
  setTradingSide: (side: 'buy' | 'sell') => void;
  toggleOneClick: (enabled: boolean) => void;
  toggleBracket: (enabled: boolean) => void;
  setBracketPrices: (stopLoss: number | null, takeProfit: number | null) => void;
}

// ===================================
// STORE IMPLEMENTATION
// ===================================

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      markets: [],
      orders: [],
      trades: [],
      positions: [],
      transactions: [],
      wallet: null,
      suggestions: [],
      activeWallet: null,

      // Trading UI Initial State
      tradingState: {
        price: null,
        quantity: 100,
        side: 'buy',
        isOneClick: false,
        isBracket: false,
        stopLoss: null,
        takeProfit: null,
      },

      // ===================================
      // AUTH ACTIONS
      // ===================================

      login: async (email: string, password: string): Promise<boolean | string> => {
        // Rate limiting check
        if (loginRateLimiter.isRateLimited(email)) {
          const remainingTime = loginRateLimiter.getRemainingTime(email);
          return `Too many login attempts. Please try again in ${remainingTime} seconds.`;
        }

        try {
          const { data, error } = await signIn(email, password);
          if (error) {
            console.error('Login error:', error);

            // Record attempt on failure
            loginRateLimiter.recordAttempt(email);

            // Return specific error message
            if (error.message.includes('Invalid login credentials')) {
              return 'Invalid email or password. Please try again.';
            }
            if (error.message.includes('Email not confirmed')) {
              return 'Please check your email to confirm your account.';
            }
            return error.message || 'Login failed. Please try again.';
          }

          if (data.user) {
            // Fetch user profile
            if (!supabase) return 'Database connection error';
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            set({
              currentUser: profile || {
                id: data.user.id,
                email: data.user.email || email,
                full_name: data.user.user_metadata?.full_name || 'User',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_admin: false,
                kyc_verified: false,
              },
              isAuthenticated: true,
            });

            // Load user data
            await get().fetchWallet();
            await get().fetchPositions();
            await get().fetchTransactions();

            return true;
          }

          // Reset rate limiter on success
          loginRateLimiter.reset(email);

          return 'Login failed. Please try again.';
        } catch (error: any) {
          console.error('Login error:', error);
          return error?.message || 'An unexpected error occurred. Please try again.';
        }
      },

      register: async (email: string, password: string, fullName: string): Promise<boolean | string> => {
        try {
          const { data, error } = await signUp(email, password, fullName);
          if (error) {
            console.error('Register error:', error);
            // Return specific error message
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
              return 'Email already registered. Please login instead.';
            }
            if (error.message.includes('invalid')) {
              return 'Invalid email address. Please use a valid email.';
            }
            if (error.message.includes('Password')) {
              return error.message;
            }
            return error.message || 'Registration failed. Please try again.';
          }

          if (data.user) {
            // Create user profile
            const { error: profileError } = await supabase!.from('users').insert({
              id: data.user.id,
              email,
              full_name: fullName,
              is_admin: false,
              kyc_verified: false,
            });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            }

            // Create wallet
            const { error: walletError } = await supabase!.from('wallets').insert({
              user_id: data.user.id,
              balance: 0,
              locked_balance: 0,
            });

            if (walletError) {
              console.error('Wallet creation error:', walletError);
            }

            set({
              currentUser: {
                id: data.user.id,
                email,
                full_name: fullName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_admin: false,
                kyc_verified: false,
              },
              isAuthenticated: true,
              wallet: {
                id: `wallet-${Date.now()}`,
                user_id: data.user.id,
                balance: 0,
                locked_balance: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            });

            return true;
          }
          return 'Registration failed. Please try again.';
        } catch (error: any) {
          console.error('Register error:', error);
          return error?.message || 'An unexpected error occurred. Please try again.';
        }
      },

      logout: async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({
          currentUser: null,
          isAuthenticated: false,
          wallet: null,
          positions: [],
          transactions: [],
        });
      },

      // ===================================
      // DATA FETCHING
      // ===================================

      fetchMarkets: async () => {
        try {
          const markets = await fetchMarkets();
          set({ markets: markets || [] });
        } catch (error) {
          console.error('Error fetching markets:', error);
          set({ markets: [] });
        }
      },

      fetchMarket: async (id: string) => {
        try {
          const market = await fetchMarketById(id);
          return market;
        } catch (error) {
          console.error('Error fetching market:', error);
          return null;
        }
      },

      fetchOrders: async (marketId: string) => {
        try {
          const orders = await fetchOrders(marketId);
          set({ orders: orders || [] });
        } catch (error) {
          console.error('Error fetching orders:', error);
          set({ orders: [] });
        }
      },

      fetchTrades: async (marketId: string) => {
        try {
          const trades = await fetchTrades(marketId);
          set({ trades: trades || [] });
        } catch (error) {
          console.error('Error fetching trades:', error);
          set({ trades: [] });
        }
      },

      fetchPositions: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const positions = await fetchPositions(currentUser.id);
          set({ positions: positions || [] });
        } catch (error) {
          console.error('Error fetching positions:', error);
          set({ positions: [] });
        }
      },

      fetchWallet: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const wallet = await fetchWallet(currentUser.id);
          set({ wallet });
        } catch (error) {
          console.error('Error fetching wallet:', error);
        }
      },

      fetchTransactions: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const transactions = await fetchTransactions(currentUser.id);
          set({ transactions: transactions || [] });
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set({ transactions: [] });
        }
      },

      // ===================================
      // TRADING ACTIONS
      // ===================================

      placeOrder: async (
        marketId: string,
        side: OrderSide,
        outcome: OutcomeType,
        price: number,
        quantity: number
      ) => {
        const { currentUser, wallet } = get();
        if (!currentUser || !wallet) return false;

        try {
          const totalCost = price * quantity;

          // Check balance for buy orders
          if (side === 'buy' && wallet.balance < totalCost) {
            console.error('Insufficient balance');
            return false;
          }

          const order = await placeOrder({
            market_id: marketId,
            side,
            outcome,
            price,
            quantity,
          });

          // If using matching engine, trigger it
          await supabase!.rpc('match_order', { p_order_id: order.id });

          // Refresh data
          await get().fetchOrders(marketId);
          await get().fetchWallet();

          return true;
        } catch (error) {
          console.error('Error placing order:', error);
          return false;
        }
      },

      cancelOrder: async (orderId: string) => {
        try {
          await cancelOrder(orderId);
          const { orders } = get();
          if (orders.length > 0) {
            const order = orders.find((o) => o.id === orderId);
            if (order) {
              await get().fetchOrders(order.market_id);
            }
          }
          return true;
        } catch (error) {
          console.error('Error cancelling order:', error);
          return false;
        }
      },

      // ===================================
      // ADMIN ACTIONS
      // ===================================

      createMarket: async (marketData: Partial<Market>) => {
        const { currentUser } = get();
        if (!currentUser?.is_admin) return false;

        try {
          await createMarket({
            question: marketData.question || '',
            description: marketData.description,
            category: marketData.category || 'General',
            source_url: marketData.source_url,
            trading_closes_at: marketData.trading_closes_at || new Date().toISOString(),
            event_date: marketData.event_date || new Date().toISOString(),
            resolution_source_type: (marketData as any).resolution_source_type,
            resolution_data: (marketData as any).resolution_data,
          });

          await get().fetchMarkets();
          return true;
        } catch (error) {
          console.error('Error creating market:', error);
          return false;
        }
      },

      resolveMarket: async (marketId: string, outcome: OutcomeType) => {
        const { currentUser } = get();
        if (!currentUser?.is_admin) return false;

        try {
          await resolveMarket(marketId, outcome);
          await get().fetchMarkets();
          return true;
        } catch (error) {
          console.error('Error resolving market:', error);
          return false;
        }
      },

      fetchSuggestions: async () => {
        try {
          const suggestions = await fetchMarketSuggestions();
          set({ suggestions: suggestions || [] });
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          set({ suggestions: [] });
        }
      },

      updateSuggestion: async (id: string, status: 'approved' | 'rejected') => {
        try {
          await updateSuggestionStatus(id, status);
          await get().fetchSuggestions();
        } catch (error) {
          console.error('Error updating suggestion:', error);
        }
      },

      // ===================================
      // WALLET MANAGEMENT
      // ===================================

      generateDepositAddress: async (network: string) => {
        const { currentUser } = get();
        if (!currentUser) return null;

        const { data, error } = await supabase!
          .from('wallets')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('network_type', network)
          .single();

        if (data) {
          set({ activeWallet: data });
          return data;
        }

        // Logic handled by service or RPC in production
        // For now, let's assume we insert a new one if not exists
        const mockAddress = network === 'TRC20' ? 'T' + Math.random().toString(36).substring(7) : '0x' + Math.random().toString(36).substring(7);
        const { data: newWallet } = await supabase!
          .from('wallets')
          .insert({
            user_id: currentUser.id,
            network_type: network,
            usdt_address: mockAddress,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${mockAddress}`
          })
          .select()
          .single();

        set({ activeWallet: newWallet });
        return newWallet;
      },

      verifyDeposit: async (txid: string, network: string) => {
        const { currentUser } = get();
        if (!currentUser) return { status: 'INVALID' };

        // Simulate verification logic for Demo
        if (txid.length < 10) return { status: 'NOT_FOUND' };

        // Finalize demo
        await get().fetchWallet();
        return { status: 'SUCCESS', amount: 500 };
      },

      // ===================================
      // REAL-TIME SUBSCRIPTIONS
      // ===================================

      subscribeToMarket: (marketId: string) => {
        const { fetchOrders, fetchTrades } = get();

        if (!supabase) return () => { };

        const channel = subscribeToMarket(marketId, () => {
          fetchOrders(marketId);
        });

        const tradeChannel = subscribeToTrades(marketId, () => {
          fetchTrades(marketId);
        });

        return () => {
          if (supabase) {
            supabase.removeChannel(channel as any);
            supabase.removeChannel(tradeChannel as any);
          }
        };
      },

      // ===================================
      // TRADING UI ACTIONS
      // ===================================

      setTradingPrice: (price) =>
        set((state) => ({ tradingState: { ...state.tradingState, price } })),

      setTradingQuantity: (quantity) =>
        set((state) => ({ tradingState: { ...state.tradingState, quantity } })),

      setTradingSide: (side) =>
        set((state) => ({ tradingState: { ...state.tradingState, side } })),

      toggleOneClick: (isOneClick) =>
        set((state) => ({ tradingState: { ...state.tradingState, isOneClick } })),

      toggleBracket: (isBracket) =>
        set((state) => ({ tradingState: { ...state.tradingState, isBracket } })),

      setBracketPrices: (stopLoss, takeProfit) =>
        set((state) => ({ tradingState: { ...state.tradingState, stopLoss, takeProfit } })),

    }),
    {
      name: 'polymarket-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
