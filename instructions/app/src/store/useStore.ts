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
  OrderSide 
} from '@/types';
import { 
  mockUsers, 
  mockWallets, 
  mockMarkets, 
  mockOrders, 
  mockTrades,
  getMarketById,
  getOrdersByMarket,
  getTradesByMarket,
  getPositionsByUser,
  getWalletByUser,
  getTransactionsByUser
} from '@/services/mockData';

// ===================================
// STORE STATE INTERFACE
// ===================================

interface StoreState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  
  // Data
  markets: Market[];
  orders: Order[];
  trades: Trade[];
  positions: Position[];
  transactions: Transaction[];
  wallet: Wallet | null;
  
  // Actions
  fetchMarkets: () => void;
  fetchMarket: (id: string) => Market | undefined;
  fetchOrders: (marketId: string) => void;
  fetchTrades: (marketId: string) => void;
  fetchPositions: () => void;
  fetchWallet: () => void;
  fetchTransactions: () => void;
  
  // Trading
  placeOrder: (marketId: string, side: OrderSide, outcome: OutcomeType, price: number, quantity: number) => Promise<boolean>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  
  // Admin
  createMarket: (marketData: Partial<Market>) => Promise<boolean>;
  resolveMarket: (marketId: string, outcome: OutcomeType) => Promise<boolean>;
  
  // Real-time simulation
  subscribeToMarket: (marketId: string, callback: () => void) => () => void;
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
      markets: mockMarkets,
      orders: [],
      trades: [],
      positions: [],
      transactions: [],
      wallet: null,
      
      // ===================================
      // AUTH ACTIONS
      // ===================================
      
      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = mockUsers.find(u => u.email === email);
        if (user && password === 'password') {
          set({ 
            currentUser: user, 
            isAuthenticated: true 
          });
          
          // Load user data
          get().fetchWallet();
          get().fetchPositions();
          get().fetchTransactions();
          
          return true;
        }
        return false;
      },
      
      register: async (email: string, _password: string, fullName: string) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user exists
        if (mockUsers.find(u => u.email === email)) {
          return false;
        }
        
        // Create new user (in real app, this would be an API call)
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_admin: false,
          kyc_verified: false,
        };
        
        mockUsers.push(newUser);
        
        // Create wallet
        const newWallet: Wallet = {
          id: `wallet-${Date.now()}`,
          user_id: newUser.id,
          balance: 0,
          locked_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        mockWallets.push(newWallet);
        
        set({ 
          currentUser: newUser, 
          isAuthenticated: true,
          wallet: newWallet
        });
        
        return true;
      },
      
      logout: () => {
        set({ 
          currentUser: null, 
          isAuthenticated: false,
          wallet: null,
          positions: [],
          transactions: []
        });
      },
      
      // ===================================
      // DATA FETCHING
      // ===================================
      
      fetchMarkets: () => {
        set({ markets: [...mockMarkets] });
      },
      
      fetchMarket: (id: string) => {
        return getMarketById(id);
      },
      
      fetchOrders: (marketId: string) => {
        const orders = getOrdersByMarket(marketId);
        set({ orders });
      },
      
      fetchTrades: (marketId: string) => {
        const trades = getTradesByMarket(marketId);
        set({ trades });
      },
      
      fetchPositions: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        const positions = getPositionsByUser(currentUser.id);
        // Enrich with market data
        const enrichedPositions = positions.map(pos => ({
          ...pos,
          market: getMarketById(pos.market_id)
        }));
        set({ positions: enrichedPositions });
      },
      
      fetchWallet: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        const wallet = getWalletByUser(currentUser.id);
        set({ wallet });
      },
      
      fetchTransactions: () => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        const transactions = getTransactionsByUser(currentUser.id);
        set({ transactions });
      },
      
      // ===================================
      // TRADING ACTIONS
      // ===================================
      
      placeOrder: async (marketId: string, side: OrderSide, outcome: OutcomeType, price: number, quantity: number) => {
        const { currentUser, wallet } = get();
        if (!currentUser || !wallet) return false;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const totalCost = price * quantity;
        
        // Check balance for buy orders
        if (side === 'buy' && wallet.balance < totalCost) {
          return false;
        }
        
        // Create order
        const newOrder: Order = {
          id: `order-${Date.now()}`,
          market_id: marketId,
          user_id: currentUser.id,
          order_type: 'limit',
          side,
          outcome,
          price,
          quantity,
          filled_quantity: 0,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        mockOrders.push(newOrder);
        
        // Get wallet index
        const walletIndex = mockWallets.findIndex(w => w.user_id === currentUser.id);
        
        // Lock balance for buy orders
        if (side === 'buy' && walletIndex !== -1) {
          mockWallets[walletIndex].balance -= totalCost;
          mockWallets[walletIndex].locked_balance += totalCost;
        }
        
        // Simulate matching (in real app, this would be done by the matching engine)
        setTimeout(() => {
          // Simulate a partial fill
          const fillQuantity = Math.floor(Math.random() * quantity * 0.5);
          if (fillQuantity > 0 && walletIndex !== -1) {
            newOrder.filled_quantity = fillQuantity;
            newOrder.status = fillQuantity >= quantity ? 'filled' : 'partially_filled';
            
            // Create trade
            const newTrade: Trade = {
              id: `trade-${Date.now()}`,
              market_id: marketId,
              outcome,
              price,
              quantity: fillQuantity,
              buyer_id: side === 'buy' ? currentUser.id : 'user-1',
              seller_id: side === 'sell' ? currentUser.id : 'user-1',
              created_at: new Date().toISOString(),
            };
            
            mockTrades.push(newTrade);
            
            // Update wallet
            if (side === 'buy') {
              mockWallets[walletIndex].locked_balance -= price * fillQuantity;
            } else {
              mockWallets[walletIndex].balance += price * fillQuantity;
            }
            
            // Refresh data
            get().fetchWallet();
            get().fetchTrades(marketId);
          }
        }, 1000);
        
        get().fetchWallet();
        get().fetchOrders(marketId);
        
        return true;
      },
      
      cancelOrder: async (orderId: string) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const orderIndex = mockOrders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return false;
        
        const order = mockOrders[orderIndex];
        if (order.status === 'filled' || order.status === 'cancelled') {
          return false;
        }
        
        // Refund locked balance
        if (order.side === 'buy') {
          const walletIndex = mockWallets.findIndex(w => w.user_id === order.user_id);
          if (walletIndex !== -1) {
            const remainingQuantity = order.quantity - order.filled_quantity;
            const refundAmount = remainingQuantity * order.price;
            mockWallets[walletIndex].balance += refundAmount;
            mockWallets[walletIndex].locked_balance -= refundAmount;
          }
        }
        
        mockOrders[orderIndex].status = 'cancelled';
        mockOrders[orderIndex].updated_at = new Date().toISOString();
        
        get().fetchWallet();
        get().fetchOrders(order.market_id);
        
        return true;
      },
      
      // ===================================
      // ADMIN ACTIONS
      // ===================================
      
      createMarket: async (marketData: Partial<Market>) => {
        const { currentUser } = get();
        if (!currentUser?.is_admin) return false;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newMarket: Market = {
          id: `market-${Date.now()}`,
          question: marketData.question || '',
          description: marketData.description,
          category: marketData.category || 'General',
          source_url: marketData.source_url,
          image_url: marketData.image_url,
          creator_id: currentUser.id,
          status: 'active',
          resolution_source: marketData.resolution_source,
          min_price: 0.0001,
          max_price: 0.9999,
          tick_size: 0.01,
          created_at: new Date().toISOString(),
          trading_closes_at: marketData.trading_closes_at || new Date().toISOString(),
          event_date: marketData.event_date || new Date().toISOString(),
          total_volume: 0,
          yes_shares_outstanding: 0,
          no_shares_outstanding: 0,
          yes_price: 0.50,
          no_price: 0.50,
        };
        
        mockMarkets.push(newMarket);
        set({ markets: [...mockMarkets] });
        
        return true;
      },
      
      resolveMarket: async (marketId: string, outcome: OutcomeType) => {
        const { currentUser } = get();
        if (!currentUser?.is_admin) return false;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const marketIndex = mockMarkets.findIndex(m => m.id === marketId);
        if (marketIndex === -1) return false;
        
        mockMarkets[marketIndex].status = 'resolved';
        mockMarkets[marketIndex].winning_outcome = outcome;
        mockMarkets[marketIndex].resolved_at = new Date().toISOString();
        
        set({ markets: [...mockMarkets] });
        
        return true;
      },
      
      // ===================================
      // REAL-TIME SIMULATION
      // ===================================
      
      subscribeToMarket: (marketId: string, callback: () => void) => {
        // Simulate real-time updates
        const interval = setInterval(() => {
          // Randomly update prices
          const marketIndex = mockMarkets.findIndex(m => m.id === marketId);
          if (marketIndex !== -1 && mockMarkets[marketIndex].status === 'active') {
            const priceChange = (Math.random() - 0.5) * 0.02;
            const currentYesPrice = mockMarkets[marketIndex].yes_price || 0.5;
            const newYesPrice = Math.max(0.01, Math.min(0.99, currentYesPrice + priceChange));
            
            mockMarkets[marketIndex].yes_price = newYesPrice;
            mockMarkets[marketIndex].no_price = 1 - newYesPrice;
            
            callback();
          }
        }, 5000);
        
        return () => clearInterval(interval);
      },
    }),
    {
      name: 'polymarket-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
