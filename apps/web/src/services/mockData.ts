import type {
  User,
  Wallet,
  Market,
  Order,
  Trade,
  Position,
  Transaction
} from '@/types';

// ===================================
// MOCK USERS
// ===================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@polymarket.bd',
    phone: '+8801712345678',
    full_name: 'Admin User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_admin: true,
    kyc_verified: true,
    kyc_level: 1,
    account_status: 'active',
  },
  {
    id: 'user-2',
    email: 'trader@example.com',
    phone: '+8801712345679',
    full_name: 'John Trader',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    is_admin: false,
    kyc_verified: true,
    kyc_level: 1,
    account_status: 'active',
  },
];

// ===================================
// MOCK WALLETS
// ===================================

export const mockWallets: Wallet[] = [
  {
    id: 'wallet-1',
    user_id: 'user-1',
    balance: 50000,
    locked_balance: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'wallet-2',
    user_id: 'user-2',
    balance: 25000,
    locked_balance: 5000,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
];

// ===================================
// MOCK MARKETS
// ===================================

export const mockMarkets: Market[] = [
  {
    id: 'market-1',
    question: 'Will Bangladesh win the T20 World Cup 2024?',
    description: 'Bangladesh national cricket team to win the ICC T20 World Cup 2024 tournament.',
    category: 'Sports',
    source_url: 'https://www.espncricinfo.com/',
    image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'ICC Official',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-01-10T00:00:00Z',
    trading_closes_at: '2024-06-01T00:00:00Z',
    event_date: '2024-06-30T00:00:00Z',
    total_volume: 125000,
    yes_shares_outstanding: 75000,
    no_shares_outstanding: 50000,
    yes_price: 0.65,
    no_price: 0.35,
  },
  {
    id: 'market-2',
    question: 'Will Dhaka Metro Rail Phase 1 open before December 2024?',
    description: 'The first phase of Dhaka Metro Rail (Uttara to Agargaon) to be officially opened for public use.',
    category: 'Politics',
    source_url: 'https://www.prothomalo.com/',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'Prothom Alo',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-01-15T00:00:00Z',
    trading_closes_at: '2024-11-30T00:00:00Z',
    event_date: '2024-12-01T00:00:00Z',
    total_volume: 89000,
    yes_shares_outstanding: 60000,
    no_shares_outstanding: 29000,
    yes_price: 0.72,
    no_price: 0.28,
  },
  {
    id: 'market-3',
    question: 'Will BDT depreciate below 120 per USD by end of 2024?',
    description: 'Bangladesh Taka to depreciate and trade below 120 BDT per 1 USD in the interbank market.',
    category: 'Finance',
    source_url: 'https://www.bb.org.bd/',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'Bangladesh Bank',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-01-20T00:00:00Z',
    trading_closes_at: '2024-12-25T00:00:00Z',
    event_date: '2024-12-31T00:00:00Z',
    total_volume: 156000,
    yes_shares_outstanding: 95000,
    no_shares_outstanding: 61000,
    yes_price: 0.45,
    no_price: 0.55,
  },
  {
    id: 'market-4',
    question: 'Will India win more than 5 gold medals at Paris Olympics 2024?',
    description: 'Indian athletes to win more than 5 gold medals at the Paris Summer Olympics 2024.',
    category: 'Sports',
    source_url: 'https://olympics.com/',
    image_url: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'Olympics Official',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-02-01T00:00:00Z',
    trading_closes_at: '2024-07-25T00:00:00Z',
    event_date: '2024-08-11T00:00:00Z',
    total_volume: 67000,
    yes_shares_outstanding: 35000,
    no_shares_outstanding: 32000,
    yes_price: 0.38,
    no_price: 0.62,
  },
  {
    id: 'market-5',
    question: 'Will GPT-5 be released before July 2025?',
    description: 'OpenAI to officially release GPT-5 model to the public before July 1, 2025.',
    category: 'Technology',
    source_url: 'https://openai.com/',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'OpenAI Official',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-02-10T00:00:00Z',
    trading_closes_at: '2025-06-30T00:00:00Z',
    event_date: '2025-06-30T00:00:00Z',
    total_volume: 210000,
    yes_shares_outstanding: 140000,
    no_shares_outstanding: 70000,
    yes_price: 0.58,
    no_price: 0.42,
  },
  {
    id: 'market-6',
    question: 'Will Bangladesh GDP growth exceed 6% in FY2024-25?',
    description: 'Bangladesh GDP growth rate to exceed 6% for the fiscal year 2024-25.',
    category: 'Finance',
    source_url: 'https://www.bbs.gov.bd/',
    image_url: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800',
    creator_id: 'user-1',
    status: 'active',
    resolution_source: 'Bangladesh Bureau of Statistics',
    min_price: 0.0001,
    max_price: 0.9999,
    tick_size: 0.01,
    created_at: '2024-02-15T00:00:00Z',
    trading_closes_at: '2025-06-01T00:00:00Z',
    event_date: '2025-06-30T00:00:00Z',
    total_volume: 98000,
    yes_shares_outstanding: 55000,
    no_shares_outstanding: 43000,
    yes_price: 0.52,
    no_price: 0.48,
  },
];

// ===================================
// MOCK ORDERS
// ===================================

export const mockOrders: Order[] = [
  // YES Buy Orders
  { id: 'order-1', market_id: 'market-1', user_id: 'user-2', order_type: 'limit', side: 'buy', outcome: 'YES', price: 0.60, quantity: 1000, filled_quantity: 0, status: 'open', created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z' },
  { id: 'order-2', market_id: 'market-1', user_id: 'user-2', order_type: 'limit', side: 'buy', outcome: 'YES', price: 0.62, quantity: 500, filled_quantity: 0, status: 'open', created_at: '2024-02-01T11:00:00Z', updated_at: '2024-02-01T11:00:00Z' },
  { id: 'order-3', market_id: 'market-1', user_id: 'user-2', order_type: 'limit', side: 'buy', outcome: 'YES', price: 0.64, quantity: 750, filled_quantity: 0, status: 'open', created_at: '2024-02-01T12:00:00Z', updated_at: '2024-02-01T12:00:00Z' },

  // YES Sell Orders
  { id: 'order-4', market_id: 'market-1', user_id: 'user-1', order_type: 'limit', side: 'sell', outcome: 'YES', price: 0.66, quantity: 800, filled_quantity: 0, status: 'open', created_at: '2024-02-01T09:00:00Z', updated_at: '2024-02-01T09:00:00Z' },
  { id: 'order-5', market_id: 'market-1', user_id: 'user-1', order_type: 'limit', side: 'sell', outcome: 'YES', price: 0.68, quantity: 1200, filled_quantity: 0, status: 'open', created_at: '2024-02-01T08:00:00Z', updated_at: '2024-02-01T08:00:00Z' },
  { id: 'order-6', market_id: 'market-1', user_id: 'user-1', order_type: 'limit', side: 'sell', outcome: 'YES', price: 0.70, quantity: 600, filled_quantity: 0, status: 'open', created_at: '2024-02-01T07:00:00Z', updated_at: '2024-02-01T07:00:00Z' },

  // NO Buy Orders
  { id: 'order-7', market_id: 'market-1', user_id: 'user-2', order_type: 'limit', side: 'buy', outcome: 'NO', price: 0.30, quantity: 900, filled_quantity: 0, status: 'open', created_at: '2024-02-01T10:30:00Z', updated_at: '2024-02-01T10:30:00Z' },
  { id: 'order-8', market_id: 'market-1', user_id: 'user-2', order_type: 'limit', side: 'buy', outcome: 'NO', price: 0.32, quantity: 400, filled_quantity: 0, status: 'open', created_at: '2024-02-01T11:30:00Z', updated_at: '2024-02-01T11:30:00Z' },

  // NO Sell Orders
  { id: 'order-9', market_id: 'market-1', user_id: 'user-1', order_type: 'limit', side: 'sell', outcome: 'NO', price: 0.36, quantity: 700, filled_quantity: 0, status: 'open', created_at: '2024-02-01T09:30:00Z', updated_at: '2024-02-01T09:30:00Z' },
  { id: 'order-10', market_id: 'market-1', user_id: 'user-1', order_type: 'limit', side: 'sell', outcome: 'NO', price: 0.38, quantity: 1100, filled_quantity: 0, status: 'open', created_at: '2024-02-01T08:30:00Z', updated_at: '2024-02-01T08:30:00Z' },
];

// ===================================
// MOCK TRADES
// ===================================

export const mockTrades: Trade[] = [
  {
    id: "t1",
    market_id: "m1",
    buy_order_id: "user1",
    sell_order_id: "user2",
    outcome: "YES",
    price: 0.65,
    quantity: 100,
    maker_id: "user1",
    taker_id: "user2",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "t2",
    market_id: "m1",
    buy_order_id: "user3",
    sell_order_id: "user1",
    outcome: "YES",
    price: 0.64,
    quantity: 50,
    maker_id: "user3",
    taker_id: "user1",
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  { id: 'trade-3', market_id: 'market-1', buy_order_id: 'order-3', sell_order_id: 'order-6', outcome: 'YES', price: 0.67, quantity: 150, maker_id: 'user-2', taker_id: 'user-1', created_at: '2024-02-01T12:30:00Z' },
  { id: 'trade-4', market_id: 'market-1', buy_order_id: 'order-7', sell_order_id: 'order-9', outcome: 'NO', price: 0.33, quantity: 250, maker_id: 'user-2', taker_id: 'user-1', created_at: '2024-02-01T10:45:00Z' },
  { id: 'trade-5', market_id: 'market-1', buy_order_id: 'order-8', sell_order_id: 'order-10', outcome: 'NO', price: 0.35, quantity: 180, maker_id: 'user-2', taker_id: 'user-1', created_at: '2024-02-01T11:45:00Z' },
];

// ===================================
// MOCK POSITIONS
// ===================================

export const mockPositions: Position[] = [
  { id: 'pos-1', market_id: 'market-1', user_id: 'user-2', outcome: 'YES', quantity: 650, average_price: 0.65, realized_pnl: 0, created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T12:30:00Z' },
  { id: 'pos-2', market_id: 'market-1', user_id: 'user-2', outcome: 'NO', quantity: 430, average_price: 0.34, realized_pnl: 0, created_at: '2024-02-01T10:30:00Z', updated_at: '2024-02-01T11:45:00Z' },
  { id: 'pos-3', market_id: 'market-2', user_id: 'user-2', outcome: 'YES', quantity: 1200, average_price: 0.70, realized_pnl: 0, created_at: '2024-01-20T10:00:00Z', updated_at: '2024-01-25T12:00:00Z' },
];

// ===================================
// MOCK TRANSACTIONS
// ===================================

export const mockTransactions: Transaction[] = [
  { id: 'txn-1', user_id: 'user-2', type: 'deposit', amount: 25000, balance_before: 0, balance_after: 25000, created_at: '2024-01-15T00:00:00Z' },
  { id: 'txn-2', user_id: 'user-2', type: 'trade_buy', amount: -13000, balance_before: 25000, balance_after: 12000, market_id: 'market-1', created_at: '2024-02-01T10:30:00Z' },
  { id: 'txn-3', user_id: 'user-2', type: 'trade_buy', amount: -15000, balance_before: 12000, balance_after: -3000, market_id: 'market-2', created_at: '2024-01-20T10:00:00Z' },
];

// ===================================
// HELPER FUNCTIONS
// ===================================

export function getMarketById(id: string): Market | undefined {
  return mockMarkets.find(m => m.id === id);
}

export function getOrdersByMarket(marketId: string): Order[] {
  return mockOrders.filter(o => (o as any).market_id === marketId && ['open', 'partially_filled'].includes(o.status));
}

export function getTradesByMarket(marketId: string): Trade[] {
  return mockTrades.filter(t => t.market_id === marketId).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getPositionsByUser(userId: string): Position[] {
  return mockPositions.filter(p => p.user_id === userId);
}

export function getWalletByUser(userId: string): Wallet | undefined {
  return mockWallets.find(w => w.user_id === userId);
}

export function getTransactionsByUser(userId: string): Transaction[] {
  return mockTransactions.filter(t => t.user_id === userId).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
