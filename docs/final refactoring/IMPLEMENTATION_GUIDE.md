# 🔧 PlokyMarket BD - Implementation Guide

## Quick Fixes for Critical Issues

### 1. Fix Package.json Dependencies

```json
{
  "name": "plokymarket-web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "supabase gen types typescript --project-id your-project-id --schema public > src/lib/types/database.ts",
    "qstash:setup:all": "node scripts/setup-all-qstash.js"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.52.0",
    "@tanstack/react-query-devtools": "^5.52.0",
    "@tanstack/react-virtual": "^3.13.0",
    "canvas-confetti": "^1.9.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "decimal.js": "^10.4.3",
    "embla-carousel-react": "^8.2.0",
    "framer-motion": "^11.3.0",
    "i18next": "^23.14.0",
    "i18next-browser-languagedetector": "^8.0.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.436.0",
    "next": "14.2.6",
    "next-i18n-router": "^5.5.1",
    "next-themes": "^0.3.0",
    "nuqs": "^1.19.0",
    "qrcode.react": "^4.0.1",
    "react": "^18.3.1",
    "react-day-picker": "^9.0.0",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-i18next": "^15.0.0",
    "react-resizable-panels": "^2.1.0",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.0",
    "use-debounce": "^10.0.0",
    "vaul": "^0.9.0",
    "zod": "^3.23.8",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.6.4",
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.4",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.6",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4"
  }
}
```

### 2. Create Database Types File

```typescript
// src/lib/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean
          is_verified: boolean
          current_level_id: string | null
          current_level_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_verified?: boolean
          current_level_id?: string | null
          current_level_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_verified?: boolean
          current_level_id?: string | null
          current_level_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      markets: {
        Row: {
          id: string
          event_id: string | null
          name: string
          question: string
          description: string | null
          category: string
          subcategory: string | null
          status: 'active' | 'closed' | 'resolved' | 'cancelled'
          is_verified: boolean
          is_featured: boolean
          is_trending: boolean
          resolution_criteria: string | null
          resolution_source: string | null
          trading_closes_at: string
          resolution_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          name: string
          question: string
          description?: string | null
          category: string
          subcategory?: string | null
          status?: 'active' | 'closed' | 'resolved' | 'cancelled'
          is_verified?: boolean
          is_featured?: boolean
          is_trending?: boolean
          resolution_criteria?: string | null
          resolution_source?: string | null
          trading_closes_at: string
          resolution_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          name?: string
          question?: string
          description?: string | null
          category?: string
          subcategory?: string | null
          status?: 'active' | 'closed' | 'resolved' | 'cancelled'
          is_verified?: boolean
          is_featured?: boolean
          is_trending?: boolean
          resolution_criteria?: string | null
          resolution_source?: string | null
          trading_closes_at?: string
          resolution_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          market_id: string
          side: 'buy' | 'sell'
          outcome: 'yes' | 'no'
          order_type: 'market' | 'limit'
          price: number
          size: number
          filled_size: number
          remaining_size: number
          status: 'open' | 'filled' | 'partially_filled' | 'cancelling' | 'cancelled' | 'expired'
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          side: 'buy' | 'sell'
          outcome: 'yes' | 'no'
          order_type?: 'market' | 'limit'
          price: number
          size: number
          filled_size?: number
          remaining_size?: number
          status?: 'open' | 'filled' | 'partially_filled' | 'cancelling' | 'cancelled' | 'expired'
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          side?: 'buy' | 'sell'
          outcome?: 'yes' | 'no'
          order_type?: 'market' | 'limit'
          price?: number
          size?: number
          filled_size?: number
          remaining_size?: number
          status?: 'open' | 'filled' | 'partially_filled' | 'cancelling' | 'cancelled' | 'expired'
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          order_id: string
          market_id: string
          buyer_id: string
          seller_id: string
          outcome: 'yes' | 'no'
          price: number
          size: number
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          market_id: string
          buyer_id: string
          seller_id: string
          outcome: 'yes' | 'no'
          price: number
          size: number
          total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          market_id?: string
          buyer_id?: string
          seller_id?: string
          outcome?: 'yes' | 'no'
          price?: number
          size?: number
          total?: number
          created_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          market_id: string
          outcome: 'yes' | 'no'
          size: number
          avg_price: number
          realized_pnl: number
          unrealized_pnl: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          market_id: string
          outcome: 'yes' | 'no'
          size: number
          avg_price: number
          realized_pnl?: number
          unrealized_pnl?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          market_id?: string
          outcome?: 'yes' | 'no'
          size?: number
          avg_price?: number
          realized_pnl?: number
          unrealized_pnl?: number
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          locked_balance: number
          currency: 'BDT' | 'USD'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          locked_balance?: number
          currency?: 'BDT' | 'USD'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          locked_balance?: number
          currency?: 'BDT' | 'USD'
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          method: 'bkash' | 'nagad' | 'rocket' | 'bank'
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id: string | null
          verification_code: string | null
          expires_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          method: 'bkash' | 'nagad' | 'rocket' | 'bank'
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id?: string | null
          verification_code?: string | null
          expires_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'deposit' | 'withdrawal'
          amount?: number
          method?: 'bkash' | 'nagad' | 'rocket' | 'bank'
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          transaction_id?: string | null
          verification_code?: string | null
          expires_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      match_order: {
        Args: { order_id: string }
        Returns: Json
      }
      update_position: {
        Args: { 
          p_user_id: string
          p_market_id: string
          p_outcome: string
          p_size: number
          p_price: number
        }
        Returns: Json
      }
      process_trade_settlement: {
        Args: { trade_id: string }
        Returns: Json
      }
      settle_market: {
        Args: { 
          p_market_id: string
          p_winning_outcome: string
        }
        Returns: Json
      }
      process_deposit: {
        Args: { tx_id: string }
        Returns: Json
      }
      process_withdrawal: {
        Args: { tx_id: string }
        Returns: Json
      }
    }
  }
}
```

### 3. Fix Supabase Server Client

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### 4. Fix Supabase Client (Browser)

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 5. Fix API Routes Pattern

```typescript
// src/app/api/wallet/balance/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ wallet })
  } catch (error) {
    console.error('Wallet balance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 6. Fix Framer Motion Variants

```typescript
// src/lib/animations/variants.ts
import { Variants } from 'framer-motion'

// Container variants with stagger
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Item variants for list animations
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

// Fade in variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

// Slide up variants
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

// Scale variants for cards
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
}

// Staggered list variants with custom delay
export const createStaggerVariants = (delay: number = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: delay,
    },
  },
})

// Card hover animation
export const cardHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
}
```

### 7. Fix Order Status Types

```typescript
// src/types/order.ts
export type OrderStatus = 
  | 'open' 
  | 'filled' 
  | 'partially_filled' 
  | 'cancelling' 
  | 'cancelled' 
  | 'expired'

export type OrderSide = 'buy' | 'sell'

export type OrderOutcome = 'yes' | 'no'

export type OrderType = 'market' | 'limit'

export interface Order {
  id: string
  user_id: string
  market_id: string
  side: OrderSide
  outcome: OrderOutcome
  order_type: OrderType
  price: number
  size: number
  filled_size: number
  remaining_size: number
  status: OrderStatus
  expires_at: string | null
  created_at: string
  updated_at: string
}

// Use this in CancelButton component
import { OrderStatus } from '@/types/order'

// Fix the status comparison
const isCancelling = order.status === 'cancelling'
const isCancelled = order.status === 'cancelled'
```

### 8. Create Matching Engine Service

```typescript
// src/lib/services/matchingEngine.ts
import { createClient } from '@/lib/supabase/server'
import { Order, Trade } from '@/types/order'

interface MatchResult {
  trades: Trade[]
  remainingSize: number
  filled: boolean
}

export class MatchingEngine {
  async matchOrder(orderId: string): Promise<MatchResult> {
    const supabase = await createClient()
    
    // Call the database function for atomic matching
    const { data, error } = await supabase.rpc('match_order', {
      order_id: orderId,
    })
    
    if (error) {
      console.error('Matching error:', error)
      throw new Error(`Failed to match order: ${error.message}`)
    }
    
    return data as MatchResult
  }
  
  async getOrderBook(marketId: string) {
    const supabase = await createClient()
    
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'open')
      .order('price', { ascending: false })
    
    if (!orders) return { bids: [], asks: [], spread: 0 }
    
    // Separate and aggregate bids/asks
    const bids = this.aggregateOrders(
      orders.filter(o => o.side === 'buy' && o.outcome === 'yes'),
      'desc'
    )
    
    const asks = this.aggregateOrders(
      orders.filter(o => o.side === 'sell' && o.outcome === 'yes'),
      'asc'
    )
    
    const bestBid = bids[0]?.price || 0
    const bestAsk = asks[0]?.price || 0
    const spread = bestAsk - bestBid
    
    return { bids, asks, spread }
  }
  
  private aggregateOrders(
    orders: Order[],
    sort: 'asc' | 'desc'
  ): Array<{ price: number; size: number }> {
    const aggregated = new Map<number, number>()
    
    for (const order of orders) {
      const current = aggregated.get(order.price) || 0
      aggregated.set(order.price, current + order.remaining_size)
    }
    
    const result = Array.from(aggregated.entries())
      .map(([price, size]) => ({ price, size }))
      .sort((a, b) => sort === 'desc' ? b.price - a.price : a.price - b.price)
    
    return result
  }
}
```

### 9. Environment Variables Template

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PlokyMarket BD

# bKash
BKASH_APP_KEY=your-bkash-app-key
BKASH_APP_SECRET=your-bkash-app-secret
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh

# Nagad
NAGAD_MERCHANT_ID=your-nagad-merchant-id
NAGAD_MERCHANT_PRIVATE_KEY=your-nagad-private-key
NAGAD_BASE_URL=https://sandbox.nagad.com

# Upstash QStash
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Cron Secrets
MASTER_CRON_SECRET=your-cron-secret

# Analytics (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

### 10. Fix next.config.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Remove these for production - only for development
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
}

module.exports = nextConfig
```

### 11. Create i18n Configuration

```typescript
// src/i18n/config.ts
export const i18n = {
  defaultLocale: 'bn',
  locales: ['bn', 'en'],
} as const

export type Locale = (typeof i18n)['locales'][number]

export const localeLabels: Record<Locale, string> = {
  bn: 'বাংলা',
  en: 'English',
}

// Messages
export const messages = {
  bn: {
    // Navigation
    'nav.home': 'হোম',
    'nav.markets': 'বাজারসমূহ',
    'nav.portfolio': 'পোর্টফোলিও',
    'nav.leaderboard': 'লিডারবোর্ড',
    'nav.wallet': 'ওয়ালেট',
    'nav.admin': 'অ্যাডমিন',
    
    // Auth
    'auth.login': 'লগইন',
    'auth.register': 'নিবন্ধন',
    'auth.logout': 'লগআউট',
    'auth.email': 'ইমেইল',
    'auth.password': 'পাসওয়ার্ড',
    'auth.forgotPassword': 'পাসওয়ার্ড ভুলে গেছেন?',
    
    // Trading
    'trade.buy': 'কিনুন',
    'trade.sell': 'বিক্রি করুন',
    'trade.yes': 'হ্যাঁ',
    'trade.no': 'না',
    'trade.price': 'দাম',
    'trade.shares': 'শেয়ার',
    'trade.total': 'মোট',
    'trade.placeOrder': 'অর্ডার দিন',
    'trade.marketOrder': 'মার্কেট অর্ডার',
    'trade.limitOrder': 'লিমিট অর্ডার',
    
    // Wallet
    'wallet.deposit': 'জমা করুন',
    'wallet.withdraw': 'উত্তোলন করুন',
    'wallet.balance': 'ব্যালেন্স',
    'wallet.available': 'উপলব্ধ',
    'wallet.locked': 'লক করা',
    'wallet.bdt': '৳ টাকা',
    
    // Markets
    'market.politics': 'রাজনীতি',
    'market.sports': 'খেলাধুলা',
    'market.entertainment': 'বিনোদন',
    'market.cricket': 'ক্রিকেট',
    'market.technology': 'প্রযুক্তি',
    'market.economics': 'অর্থনীতি',
    
    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'ত্রুটি',
    'common.success': 'সফল',
    'common.cancel': 'বাতিল',
    'common.confirm': 'নিশ্চিত',
    'common.search': 'অনুসন্ধান',
    'common.filter': 'ফিল্টার',
    'common.sort': 'সাজান',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.markets': 'Markets',
    'nav.portfolio': 'Portfolio',
    'nav.leaderboard': 'Leaderboard',
    'nav.wallet': 'Wallet',
    'nav.admin': 'Admin',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    
    // Trading
    'trade.buy': 'Buy',
    'trade.sell': 'Sell',
    'trade.yes': 'Yes',
    'trade.no': 'No',
    'trade.price': 'Price',
    'trade.shares': 'Shares',
    'trade.total': 'Total',
    'trade.placeOrder': 'Place Order',
    'trade.marketOrder': 'Market Order',
    'trade.limitOrder': 'Limit Order',
    
    // Wallet
    'wallet.deposit': 'Deposit',
    'wallet.withdraw': 'Withdraw',
    'wallet.balance': 'Balance',
    'wallet.available': 'Available',
    'wallet.locked': 'Locked',
    'wallet.bdt': '৳ BDT',
    
    // Markets
    'market.politics': 'Politics',
    'market.sports': 'Sports',
    'market.entertainment': 'Entertainment',
    'market.cricket': 'Cricket',
    'market.technology': 'Technology',
    'market.economics': 'Economics',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
  },
}
```

### 12. Middleware for Auth & i18n

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { i18n } from './i18n/config'

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/']
const ADMIN_PATHS = ['/admin', '/sys-cmd-7x9k2']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path))
  
  // Create Supabase client
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect to login if not authenticated
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check admin access
  if (isAdminPath && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/markets', request.url))
    }
  }
  
  // Language detection & redirect
  const pathnameWithoutLocale = pathname.replace(/^\/(bn|en)/, '') || '/'
  const pathnameHasLocale = /^\/(bn|en)/.test(pathname)
  
  if (!pathnameHasLocale && pathname !== '/') {
    // Default to Bangla
    const newUrl = new URL(`/bn${pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 🚀 Deployment Commands

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npm run type-check

# 3. Build
npm run build

# 4. Deploy to Vercel
vercel --prod
```

---

## 📞 Emergency Contacts

- **Technical Issues**: [Your Email]
- **bKash Integration**: merchant@bkash.com
- **Supabase Support**: support@supabase.com
- **Vercel Support**: support@vercel.com
