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
  signInWithGoogle,
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
  placeAtomicOrder,
  cancelOrder,
  createMarket,
  resolveMarket,
  fetchMarketSuggestions,
  updateSuggestionStatus,
  deleteSuggestion,
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
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<boolean | string>;
  logout: () => void;
  initializeAuth: () => void;

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
  addMarket: (market: Market) => void;
  updateMarket: (id: string, partialMarket: Partial<Market>) => void;
  removeMarket: (id: string) => void;
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
    quantity: number,
    orderType?: 'market' | 'limit',
    limitPrice?: number,
    slippageTolerance?: number
  ) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;

  // Admin
  createMarket: (marketData: Partial<Market>) => Promise<boolean>;
  resolveMarket: (marketId: string, outcome: OutcomeType) => Promise<boolean>;
  fetchSuggestions: () => Promise<void>;
  updateSuggestion: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  suggestions: MarketSuggestion[];

  // Risk Management
  riskControls: {
    trading_halted: boolean;
    withdrawals_halted: boolean;
    emergency_message: string;
  } | null;
  fetchRiskControls: () => Promise<void>;
  updateRiskControls: (controls: any) => Promise<boolean>;

  // Wallet Management
  generateDepositAddress: (network: string) => Promise<any>;
  verifyDeposit: (txid: string, network: string) => Promise<any>;
  withdrawFunds: (amount: number, address: string, network: string) => Promise<{ success: boolean; message: string }>;
  activeWallet: any | null;

  // KYC
  uploadKycDocuments: (formData: FormData) => Promise<{ success: boolean; message: string }>;

  // Payment Security
  submitDeposit: (amount: number, method: string, trxId: string) => Promise<{ success: boolean; message: string }>;
  paymentTransactions: any[];
  fetchPaymentTransactions: () => Promise<void>;

  // Real-time
  // Channel subscriptions now handled by custom hooks in components

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
      paymentTransactions: [],
      wallet: null,
      suggestions: [],
      activeWallet: null,
      riskControls: null,

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
        if (await loginRateLimiter.isRateLimited(email)) {
          const remainingTime = await loginRateLimiter.getRemainingTime(email);
          return `Too many login attempts. Please try again in ${remainingTime} seconds.`;
        }

        try {
          const { data, error } = await signIn(email, password);
          if (error) {
            console.error('Login error:', error);

            // Record attempt on failure
            await loginRateLimiter.recordAttempt(email);

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
              .from('user_profiles')
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
          await loginRateLimiter.reset(email);

          return 'Login failed. Please try again.';
        } catch (error: any) {
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
            // Silently ignore abort errors during login/navigation
            return true;
          }
          console.error('Login error:', error);
          return error?.message || 'An unexpected error occurred. Please try again.';
        }
      },

      loginWithGoogle: async () => {
        try {
          await signInWithGoogle();
        } catch (error) {
          console.error('Google login error:', error);
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
            const { error: profileError } = await supabase!.from('user_profiles').insert({
              id: data.user.id,
              email,
              full_name: fullName,
              is_admin: false,
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
                kyc_level: 0,
                account_status: 'active',
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

      initializeAuth: () => {
        if (!supabase) return;

        // Set up the listener
        supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          if (session?.user) {
            // Fetch user profile (simple query — no joins to non-existent tables)
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const profileData = profile ? {
              ...profile,
              account_status: profile.account_status || 'active',
              current_level_name: 'Novice'
            } : null;

            set({
              currentUser: profileData || {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'User',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_admin: false,
                kyc_verified: false,
                kyc_level: 0,
                account_status: 'active',
              },
              isAuthenticated: true,
            });

            // Track user activity (graceful)
            supabase.rpc('track_user_activity', { p_user_id: session.user.id }).then(({ error }: { error: any }) => {
              if (error) console.warn('Activity tracking failed:', error);
            });

            // Handle dormant status
            if (profileData?.account_status === 'dormant') {
              console.warn('User account is dormant. Verification required.');
            }

            // Load user data - suppress abort errors during initial load
            try {
              await Promise.all([
                get().fetchWallet(),
                get().fetchPositions(),
                get().fetchTransactions()
              ]);
            } catch (err: any) {
              if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
                console.error('Initial data load error:', err);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            set({
              currentUser: null,
              isAuthenticated: false,
              wallet: null,
              positions: [],
              transactions: [],
            });
          }
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

      addMarket: (market: Market) => {
        set((state) => {
          // Prevent duplicates
          if (state.markets.some(m => m.id === market.id)) return state;
          return { markets: [market, ...state.markets] };
        });
      },

      updateMarket: (id: string, partialMarket: Partial<Market>) => {
        set((state) => ({
          markets: state.markets.map(m =>
            m.id === id ? { ...m, ...partialMarket } : m
          )
        }));
      },

      removeMarket: (id: string) => {
        set((state) => ({
          markets: state.markets.filter(m => m.id !== id)
        }));
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
        } catch (error: any) {
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return;
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
        } catch (error: any) {
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return;
          console.error('Error fetching wallet:', error);
        }
      },

      fetchTransactions: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const transactions = await fetchTransactions(currentUser.id);
          set({ transactions: transactions || [] });
        } catch (error: any) {
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return;
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
        quantity: number,
        orderType: 'market' | 'limit' = 'market',
        limitPrice?: number,
        slippageTolerance?: number
      ) => {
        try {
          const executionPrice = orderType === 'limit' && limitPrice ? limitPrice : price;

          const orderId = await placeAtomicOrder({
            market_id: marketId,
            side,
            outcome,
            price: executionPrice,
            quantity,
            // Note: Actual DB RPC `place_atomic_order` handles execution.
            // Future enhancement: Pass slippage and order_type explicitly to the RPC.
          });

          if (!orderId) return false;

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

      fetchRiskControls: async () => {
        const { currentUser } = get();
        if (!currentUser?.is_admin) return;

        try {
          const { data, error } = await supabase!
            .from('admin_settings')
            .select('value')
            .eq('key', 'risk_controls')
            .single();

          if (error) throw error;
          set({ riskControls: data.value });
        } catch (error) {
          console.error('Error fetching risk controls:', error);
        }
      },

      updateRiskControls: async (controls: any) => {
        const { currentUser, riskControls } = get();
        if (!currentUser?.is_admin) return false;

        const newValue = { ...riskControls, ...controls };

        try {
          const { error } = await supabase!
            .from('admin_settings')
            .update({
              value: newValue,
              updated_by: currentUser.id,
              updated_at: new Date().toISOString()
            })
            .eq('key', 'risk_controls');

          if (error) throw error;
          set({ riskControls: newValue });
          return true;
        } catch (error) {
          console.error('Error updating risk controls:', error);
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
        const treasuryAddress = process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS;
        if (!treasuryAddress) {
          throw new Error('System Configuration Error: Treasury address missing.');
        }

        const { data: newWallet } = await supabase!
          .from('wallets')
          .insert({
            user_id: currentUser.id,
            network_type: network,
            usdt_address: treasuryAddress,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${treasuryAddress}`
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

      withdrawFunds: async (amount: number, address: string, network: string) => {
        const { currentUser } = get();
        if (!currentUser) return { success: false, message: 'Please login first.' };

        try {
          // 1. Call RPC to request withdrawal (handles balance check and KYC check)
          const { error } = await supabase!.rpc('request_withdrawal', {
            p_user_id: currentUser.id,
            p_amount: amount,
            p_address: address,
            p_network: network
          });

          if (error) {
            console.error('Withdrawal error:', error);
            // Handle specific KYC error message from backend
            if (error.message.includes('KYC Level 1')) {
              return { success: false, message: 'LIMIT_EXCEEDED_KYC_REQUIRED' };
            }
            return { success: false, message: error.message };
          }

          // Refresh wallet
          await get().fetchWallet();
          await get().fetchTransactions();

          return { success: true, message: 'Withdrawal request submitted successfully.' };
        } catch (error: any) {
          console.error('Withdrawal exception:', error);
          return { success: false, message: error.message || 'Withdrawal failed.' };
        }
      },

      uploadKycDocuments: async (formData: FormData) => {
        const { currentUser } = get();
        if (!currentUser) return { success: false, message: 'Please login first.' };

        try {
          // 1. Upload images to Storage
          const uploadFile = async (file: File, path: string) => {
            const { data, error } = await supabase!.storage
              .from('kyc-documents')
              .upload(`${currentUser.id}/${path}-${Date.now()}`, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase!.storage
              .from('kyc-documents')
              .getPublicUrl(data.path);

            return publicUrl;
          };

          const frontImage = formData.get('front') as File;
          const backImage = formData.get('back') as File;
          const selfieImage = formData.get('selfie') as File;
          const docType = formData.get('type') as string;

          if (!frontImage || !docType) {
            return { success: false, message: 'Missing required documents.' };
          }

          const frontUrl = await uploadFile(frontImage, 'front');
          const backUrl = backImage ? await uploadFile(backImage, 'back') : null;
          const selfieUrl = selfieImage ? await uploadFile(selfieImage, 'selfie') : null;

          // 2. Insert into kyc_documents
          const { error: dbError } = await supabase!
            .from('kyc_documents')
            .insert({
              user_id: currentUser.id,
              document_type: docType,
              document_front_url: frontUrl,
              document_back_url: backUrl,
              selfie_url: selfieUrl,
              status: 'pending'
            });

          if (dbError) throw dbError;

          return { success: true, message: 'Documents submitted successfully. Pending review.' };

        } catch (error: any) {
          console.error('KYC Upload Error:', error);
          return { success: false, message: error.message || 'Upload failed.' };
        }
      },

      submitDeposit: async (amount: number, method: string, trxId: string) => {
        const { currentUser } = get();
        if (!currentUser) return { success: false, message: 'Please login first.' };

        try {
          const { error } = await supabase!.rpc('submit_deposit_request', {
            p_user_id: currentUser.id,
            p_amount: amount,
            p_payment_method: method,
            p_transaction_id: trxId
          });

          if (error) {
            console.error('Deposit Error:', error);
            if (error.message.includes('Transaction ID already used')) {
              return { success: false, message: 'This Transaction ID has already been submitted.' };
            }
            return { success: false, message: error.message };
          }

          // Refresh payment transactions
          await get().fetchPaymentTransactions();

          return { success: true, message: 'Deposit request submitted successfully. Pending admin approval.' };
        } catch (error: any) {
          console.error('Deposit Exception:', error);
          return { success: false, message: error.message || 'Deposit failed.' };
        }
      },

      fetchPaymentTransactions: async () => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const { data, error } = await supabase!
            .from('payment_transactions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ paymentTransactions: data || [] });
        } catch (error) {
          console.error('Error fetching payment transactions:', error);
          set({ paymentTransactions: [] });
        }
      },

      // Realtime channel subscriptions removed from store,
      // now handled directly using custom hooks in components


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
