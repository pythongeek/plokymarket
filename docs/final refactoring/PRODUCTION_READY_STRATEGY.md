# 🚀 PlokyMarket BD - Production Ready Strategy

## Executive Summary

This document provides a comprehensive analysis of the current codebase and a strategic roadmap to transform PlokyMarket into a production-ready prediction market platform that exceeds Polymarket.com, with a Bangladesh-first (Bangla-default) approach.

---

## 📊 Current State Analysis

### Critical Issues Identified

#### 1. **TypeScript Errors (598+ errors)**
```
- Missing module declarations: @tanstack/react-query-devtools, @radix-ui/react-*
- Framer Motion type incompatibilities (string vs AnimationGeneratorType)
- Supabase client promise handling issues (.from() on Promise<SupabaseClient>)
- Missing type definitions for User, Market, Order interfaces
- Implicit 'any' types throughout codebase
```

#### 2. **Missing Dependencies**
```
- @radix-ui/react-aspect-ratio, react-context-menu, hover-card, etc.
- embla-carousel-react, cmdk, vaul, input-otp
- react-resizable-panels, @radix-ui/react-toggle-group
- @tanstack/react-query-devtools
- decimal.js
```

#### 3. **Architecture Issues**
```
- Mixed Vite + Next.js configuration
- Scattered business logic across components
- No clear separation of concerns
- Missing database types definitions
- Inconsistent API route patterns
```

#### 4. **Build & Deployment Issues**
```
- EBUSY resource lock during build
- Type errors ignored in production build
- Missing environment variable validation
- QStash schedules failing (invalid URL scheme)
```

---

## 🎯 Production-Ready Architecture

### Recommended Tech Stack (Optimized)

```
Frontend: Next.js 15 (App Router) + TypeScript 5.5
Styling: Tailwind CSS 3.4 + shadcn/ui
State: Zustand + TanStack Query v5
Backend: Next.js API Routes + Supabase
Realtime: Supabase Realtime + WebSockets
Cron Jobs: Upstash QStash
Payments: bKash/Nagad/Rocket integration
Blockchain: Polygon (for international), Local custody for BD
```

### Folder Structure (Organized)

```
app/
├── (auth)/                    # Auth route group
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── callback/route.ts
├── (dashboard)/               # Main app route group
│   ├── markets/
│   │   ├── page.tsx          # Market list
│   │   ├── [id]/
│   │   │   └── page.tsx      # Market detail
│   │   └── create/page.tsx   # Create market (admin)
│   ├── portfolio/page.tsx
│   ├── leaderboard/page.tsx
│   ├── wallet/
│   │   ├── page.tsx
│   │   ├── deposit/page.tsx
│   │   └── withdraw/page.tsx
│   └── admin/
│       ├── page.tsx
│       ├── users/page.tsx
│       └── markets/page.tsx
├── api/                       # API routes
│   ├── auth/
│   ├── markets/
│   ├── orders/
│   ├── trades/
│   ├── wallet/
│   └── webhooks/
├── layout.tsx
├── page.tsx
└── loading.tsx

components/
├── ui/                       # shadcn/ui components
├── forms/                    # Form components
├── markets/                  # Market-specific
├── trading/                  # Order book, charts
├── wallet/                   # Wallet components
├── layout/                   # Layout components
└── shared/                   # Shared utilities

lib/
├── supabase/                 # Supabase clients
│   ├── client.ts
│   ├── server.ts
│   └── admin.ts
├── services/                 # Business logic
│   ├── marketService.ts
│   ├── orderService.ts
│   ├── tradeService.ts
│   ├── walletService.ts
│   └── matchingEngine.ts
├── hooks/                    # Custom hooks
├── utils/
└── types/                    # TypeScript types

hooks/                        # React hooks
├── useMarkets.ts
├── useOrders.ts
├── useWallet.ts
├── useRealtime.ts
└── useAuth.ts

store/                        # Zustand stores
├── authStore.ts
├── marketStore.ts
├── orderStore.ts
└── walletStore.ts

i18n/                         # Internationalization
├── config.ts
├── messages/
│   ├── bn.json              # Bangla (default)
│   └── en.json              # English

public/
├── images/
├── fonts/                    # Bangla fonts
└── locales/

supabase/
├── migrations/               # Database migrations
├── functions/                # Edge functions
├── policies/                 # RLS policies
└── triggers/                 # DB triggers
```

---

## 🇧🇩 Bangladesh-First Strategy

### Localization (i18n)

```typescript
// i18n/config.ts
export const i18nConfig = {
  defaultLocale: 'bn',        // Bangla as default
  locales: ['bn', 'en'],
  localePrefix: 'as-needed',
};

// Key translations
const bnTranslations = {
  // Navigation
  "nav.markets": "বাজারসমূহ",
  "nav.portfolio": "পোর্টফোলিও",
  "nav.leaderboard": "লিডারবোর্ড",
  "nav.wallet": "ওয়ালেট",
  
  // Trading
  "trade.buy": "কিনুন",
  "trade.sell": "বিক্রি করুন",
  "trade.yes": "হ্যাঁ",
  "trade.no": "না",
  "trade.price": "দাম",
  "trade.shares": "শেয়ার",
  
  // Wallet
  "wallet.deposit": "জমা করুন",
  "wallet.withdraw": "উত্তোলন করুন",
  "wallet.balance": "ব্যালেন্স",
  "wallet.bdt": "৳ টাকা",
  
  // Markets
  "market.politics": "রাজনীতি",
  "market.sports": "খেলাধুলা",
  "market.entertainment": "বিনোদন",
  "market.cricket": "ক্রিকেট",
};
```

### Bangladesh-Specific Features

1. **Local Payment Methods**
   - bKash (primary)
   - Nagad
   - Rocket (DBBL)
   - Bank transfers (NPSB)

2. **Local Market Categories**
   - BPL (Bangladesh Premier League)
   - National Elections
   - Dhaka Stock Exchange predictions
   - Local weather events
   - Bangladesh cricket

3. **Compliance**
   - Bangladesh Bank regulations
   - BTRC guidelines
   - Local KYC requirements (NID)

---

## 🔧 Phase-by-Phase Implementation

### Phase 1: Foundation (Week 1-2) - CRITICAL

#### 1.1 Fix TypeScript & Dependencies
```bash
# Install missing dependencies
npm install @radix-ui/react-aspect-ratio @radix-ui/react-context-menu \
  @radix-ui/react-hover-card @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu @radix-ui/react-radio-group \
  @radix-ui/react-toggle @radix-ui/react-toggle-group \
  embla-carousel-react cmdk vaul input-otp \
  react-resizable-panels @tanstack/react-query-devtools \
  decimal.js

# Fix framer-motion types
npm install framer-motion@11.0.0 --save-exact
```

#### 1.2 Fix Core Type Issues
```typescript
// Create lib/types/database.ts
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          is_admin: boolean;
          current_level_id?: string;
          current_level_name?: string;
          created_at: string;
        };
      };
      markets: {
        Row: {
          id: string;
          name: string;
          question: string;
          description: string;
          category: string;
          status: 'active' | 'closed' | 'resolved';
          is_verified: boolean;
          is_featured: boolean;
          resolution_criteria?: string;
          trading_closes_at: string;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          side: 'buy' | 'sell';
          outcome: 'yes' | 'no';
          price: number;
          size: number;
          filled_size: number;
          status: 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';
          created_at: string;
        };
      };
      // ... other tables
    };
  };
}
```

#### 1.3 Fix Supabase Client Pattern
```typescript
// lib/supabase/server.ts - CORRECT PATTERN
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// Usage in API routes - AWAIT the client
export async function GET() {
  const supabase = await createClient();  // <-- AWAIT HERE
  const { data } = await supabase.from('markets').select('*');
  return Response.json(data);
}
```

#### 1.4 Fix Framer Motion Variants
```typescript
// CORRECT - Use const assertion for type safety
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,  // <-- const assertion
      stiffness: 100,
    }
  }
} satisfies Variants;
```

### Phase 2: Core Features (Week 3-4)

#### 2.1 Matching Engine (CLOB)
```typescript
// lib/services/matchingEngine.ts
export class CentralLimitOrderBook {
  private bids: Order[] = [];  // Buy orders (sorted desc)
  private asks: Order[] = [];  // Sell orders (sorted asc)
  
  addOrder(order: Order): MatchResult {
    if (order.side === 'buy') {
      return this.matchBuyOrder(order);
    } else {
      return this.matchSellOrder(order);
    }
  }
  
  private matchBuyOrder(order: Order): MatchResult {
    const matches: Trade[] = [];
    let remainingSize = order.size;
    
    // Match against asks (lowest price first)
    while (remainingSize > 0 && this.asks.length > 0) {
      const bestAsk = this.asks[0];
      
      if (order.price < bestAsk.price) break;
      
      const matchSize = Math.min(remainingSize, bestAsk.remainingSize);
      matches.push(this.createTrade(order, bestAsk, matchSize));
      
      remainingSize -= matchSize;
      bestAsk.remainingSize -= matchSize;
      
      if (bestAsk.remainingSize <= 0) {
        this.asks.shift();
      }
    }
    
    // Add remaining to book if limit order
    if (remainingSize > 0 && order.type === 'limit') {
      this.bids.push({ ...order, remainingSize });
      this.bids.sort((a, b) => b.price - a.price);
    }
    
    return { matches, remainingSize };
  }
  
  getOrderBook(): OrderBookSnapshot {
    return {
      bids: this.aggregateOrders(this.bids),
      asks: this.aggregateOrders(this.asks),
      spread: this.asks[0]?.price - this.bids[0]?.price || 0,
    };
  }
}
```

#### 2.2 Real-time Price Updates
```typescript
// hooks/useRealtimePrice.ts
export function useRealtimePrice(marketId: string) {
  const [price, setPrice] = useState<number>(0.5);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  
  useEffect(() => {
    const channel = supabase
      .channel(`market:${marketId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `market_id=eq.${marketId}` },
        (payload) => {
          // Update order book
          updateOrderBook(payload.new as Order);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades', filter: `market_id=eq.${marketId}` },
        (payload) => {
          // Update last traded price
          setPrice(payload.new.price);
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [marketId]);
  
  return { price, orderBook };
}
```

#### 2.3 Wallet Service
```typescript
// lib/services/walletService.ts
export class WalletService {
  async deposit(userId: string, amount: number, method: 'bkash' | 'nagad' | 'rocket') {
    // Create pending transaction
    const { data: tx } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount,
        method,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      })
      .select()
      .single();
      
    // Generate payment URL/number
    const paymentUrl = await this.generatePaymentUrl(tx.id, amount, method);
    
    return { transaction: tx, paymentUrl };
  }
  
  async verifyDeposit(txId: string, verificationCode: string) {
    // Verify with payment provider
    const verified = await this.verifyWithProvider(txId, verificationCode);
    
    if (verified) {
      await supabase.rpc('process_deposit', { tx_id: txId });
    }
    
    return verified;
  }
}
```

### Phase 3: Bangladesh Integration (Week 5-6)

#### 3.1 bKash Integration
```typescript
// lib/payments/bkash.ts
export class bKashService {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  
  async createPayment(amount: number, merchantInvoice: string) {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseUrl}/checkout/payment/create`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'X-APP-Key': this.appKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'BDT',
        merchantInvoiceNumber: merchantInvoice,
        intent: 'sale',
      }),
    });
    
    return response.json();
  }
  
  async executePayment(paymentID: string) {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseUrl}/checkout/payment/execute/${paymentID}`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'X-APP-Key': this.appKey,
      },
    });
    
    return response.json();
  }
}
```

#### 3.2 Nagad Integration
```typescript
// lib/payments/nagad.ts
export class NagadService {
  // Similar implementation for Nagad
}
```

### Phase 4: Advanced Features (Week 7-8)

#### 4.1 AI-Powered Market Creation
```typescript
// lib/ai/marketGenerator.ts
export class MarketGenerator {
  async generateFromNews(newsText: string): Promise<MarketSuggestion> {
    const prompt = `
      Analyze this news and suggest a prediction market:
      "${newsText}"
      
      Return JSON with:
      - question: Clear yes/no question in Bangla
      - category: One of [politics, sports, entertainment, cricket, technology]
      - description: Context in Bangla
      - resolutionCriteria: How to determine outcome
      - tradingClosesAt: Suggested closing date
      - initialProbability: Estimated probability (0-1)
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    
    return JSON.parse(response.choices[0].message.content!);
  }
}
```

#### 4.2 Social Features
```typescript
// lib/services/socialService.ts
export class SocialService {
  async followUser(followerId: string, followingId: string) {
    return supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
  }
  
  async getActivityFeed(userId: string): Promise<Activity[]> {
    const { data } = await supabase
      .from('activities')
      .select(`
        *,
        user:users(id, full_name, avatar_url),
        market:markets(id, question)
      `)
      .in('user_id', 
        supabase.from('follows').select('following_id').eq('follower_id', userId)
      )
      .order('created_at', { ascending: false })
      .limit(50);
      
    return data || [];
  }
}
```

---

## 📋 Production Checklist

### Pre-Launch

- [ ] All TypeScript errors resolved
- [ ] Unit tests > 80% coverage
- [ ] Integration tests for critical paths
- [ ] Security audit completed
- [ ] Performance optimization (Lighthouse > 90)
- [ ] Database indexes optimized
- [ ] Backup strategy implemented
- [ ] Monitoring & alerting setup
- [ ] GDPR/privacy compliance
- [ ] Terms of Service & Privacy Policy

### Bangladesh-Specific

- [ ] bKash integration tested
- [ ] Nagad integration tested
- [ ] Bangla translations complete
- [ ] Local market categories added
- [ ] NID KYC flow implemented
- [ ] Bangladesh Bank compliance review
- [ ] Local support channels
- [ ] Bengali-speaking support team

### Features vs Polymarket

| Feature | Polymarket | PlokyMarket BD |
|---------|-----------|----------------|
| Order Book (CLOB) | ✅ | ✅ |
| Real-time Updates | ✅ | ✅ |
| USDC Settlement | ✅ | ❌ (BDT instead) |
| Local Payments | ❌ | ✅ (bKash/Nagad) |
| Bangla Language | ❌ | ✅ (Default) |
| Bangladesh Markets | ❌ | ✅ |
| Social Trading | ❌ | ✅ |
| AI Market Creation | ❌ | ✅ |
| Mobile App | ❌ | ✅ (PWA) |
| Lower Fees | 0-1% | 0.5% |

---

## 🚀 Shortest Path to Production (4-Week Sprint)

### Week 1: Fix & Stabilize
- [ ] Fix all TypeScript errors
- [ ] Install missing dependencies
- [ ] Fix Supabase client patterns
- [ ] Fix Framer Motion types
- [ ] Create database types

### Week 2: Core Trading
- [ ] Implement CLOB matching engine
- [ ] Order placement & cancellation
- [ ] Real-time price updates
- [ ] Portfolio tracking
- [ ] Basic wallet functionality

### Week 3: Payments & Auth
- [ ] bKash integration
- [ ] Nagad integration
- [ ] User authentication
- [ ] KYC flow
- [ ] Deposit/withdrawal

### Week 4: Polish & Launch
- [ ] Bangla translations
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Deploy to production

---

## 🔐 Security Considerations

```typescript
// middleware.ts - Admin protection
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/markets', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## 📈 Monitoring & Analytics

```typescript
// lib/analytics/index.ts
export const analytics = {
  trackEvent: (event: string, properties?: Record<string, any>) => {
    // Send to analytics provider
    if (typeof window !== 'undefined') {
      // Mixpanel, Amplitude, etc.
    }
  },
  
  trackTrade: (trade: Trade) => {
    analytics.trackEvent('Trade Executed', {
      marketId: trade.market_id,
      side: trade.side,
      size: trade.size,
      price: trade.price,
    });
  },
  
  trackDeposit: (amount: number, method: string) => {
    analytics.trackEvent('Deposit', { amount, method });
  },
};
```

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Monthly Active Users | 10,000 |
| Daily Trading Volume | ৳50,00,000 |
| Average Order Fill Time | < 2 seconds |
| Deposit Success Rate | > 95% |
| User Retention (30d) | > 40% |
| App Load Time | < 3 seconds |
| Uptime | 99.9% |

---

## 📞 Support & Resources

- **Technical Lead**: [Your Name]
- **Bangladesh Operations**: [Local Partner]
- **Compliance Advisor**: [Legal Contact]
- **Emergency Hotline**: +880-1XXX-XXXXXX

---

## Next Steps

1. **Immediate**: Review and approve this strategy
2. **Day 1**: Begin Phase 1 (TypeScript fixes)
3. **Week 1**: Complete foundation fixes
4. **Week 2**: Begin core trading implementation
5. **Week 4**: Soft launch with beta users
6. **Week 6**: Public launch

---

*Document Version: 1.0*
*Last Updated: 2026-02-22*
*Prepared for: PlokyMarket BD Team*
