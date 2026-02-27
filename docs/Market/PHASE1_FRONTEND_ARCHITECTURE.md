# 🖥️ PHASE 1 — FRONTEND ARCHITECTURE
## Plokymarket Complete Market System
### Synced with Existing Event Creation System · Beyond Polymarket Standard

---

> **CRITICAL RULE:** Never remove any file without explicit user consent. All changes are additive unless an error mandates replacement. The existing event creation pipeline (EventCreationPanel, EventCreationPanelWithPreview, AI agents, Vertex + Kimi rotation) is fully preserved and extended, not replaced.

---

## 📐 ARCHITECTURE OVERVIEW

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── markets/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx                     ← EXTEND (add thumbnail, banner, tabs)
│   │   │   │   ├── MarketPageClient.tsx          ← NEW: client-side orchestrator
│   │   │   │   └── loading.tsx                  ← NEW: skeleton loader
│   │   │   └── page.tsx                         ← EXTEND (multi-outcome cards)
│   │   ├── portfolio/
│   │   │   └── page.tsx                         ← EXTEND (P&L, open positions)
│   │   └── leaderboard/page.tsx                 ← EXISTS, extend with market stats
│   └── api/  ← See Phase 2 (Backend)
│
├── components/
│   ├── market/
│   │   ├── MarketActions.tsx                    ← NEW: Share/Bookmark/Follow/Bell
│   │   ├── MarketStatsBanner.tsx                ← NEW: Volume/Liquidity/Traders
│   │   ├── MarketThumbnail.tsx                  ← NEW: Round image with fallback
│   │   ├── MultiOutcomeList.tsx                 ← NEW: N-outcome market display
│   │   ├── OutcomeRow.tsx                       ← NEW: Single outcome row
│   │   ├── RelatedMarkets.tsx                   ← NEW: "You might also like"
│   │   ├── PriceChangeIndicator.tsx             ← NEW: Sparkline + delta arrows
│   │   ├── MarketInfoPanel.tsx                  ← EXTEND: dynamic creator badge
│   │   └── MarketStatusDisplay.tsx              ← EXISTS, keep as-is
│   │
│   ├── trading/
│   │   ├── TradingPanel.tsx                     ← EXTEND: multi-outcome support
│   │   ├── BetSlip.tsx                          ← NEW: persistent cart
│   │   ├── MobileTradingBar.tsx                 ← NEW: sticky mobile footer
│   │   ├── TradingBottomSheet.tsx               ← NEW: mobile drawer
│   │   ├── OrderConfirmDialog.tsx               ← NEW: review before submit
│   │   └── ProfitEstimator.tsx                  ← NEW: live payout calculator
│   │
│   ├── social/
│   │   ├── CommentSection.tsx                   ← EXTEND: avatar, likes, sort
│   │   ├── ActivityFeed.tsx                     ← EXISTS (847 loc) → wire to page
│   │   ├── MarketActivityTab.tsx                ← NEW: per-market activity wrapper
│   │   └── TradeCard.tsx                        ← NEW: individual trade display
│   │
│   ├── layout/
│   │   ├── NotificationBell.tsx                 ← NEW: bell + unread badge
│   │   └── Navbar.tsx                           ← EXTEND: add bell icon
│   │
│   ├── admin/
│   │   ├── EventCreationPanel.tsx               ← EXISTS — DO NOT MODIFY
│   │   ├── EventCreationPanelWithPreview.tsx    ← EXISTS — DO NOT MODIFY
│   │   ├── AIAgentStatus.tsx                    ← EXISTS — DO NOT MODIFY
│   │   └── AIProposalPanel.tsx                  ← EXISTS — DO NOT MODIFY
│   │
│   └── ai/
│       ├── AIRotationToggle.tsx                 ← EXTEND: make Vertex/Kimi rotation visible
│       ├── AIProviderBadge.tsx                  ← NEW: show active provider
│       └── AIConfidenceBar.tsx                  ← NEW: confidence score display
│
├── hooks/
│   ├── useMarketActions.ts                      ← NEW: bookmark/follow/share
│   ├── useRelatedMarkets.ts                     ← NEW: fetch related markets
│   ├── usePriceHistory.ts                       ← NEW: 24h price delta
│   ├── useMultiOutcome.ts                       ← NEW: outcome selection state
│   ├── useBetSlip.ts                            ← NEW: cart management
│   ├── useAIAgents.ts                           ← EXISTS — keep
│   └── useMarketProposals.ts                    ← EXISTS — keep
│
├── store/
│   ├── betSlipStore.ts                          ← NEW: Zustand persistent cart
│   ├── notificationStore.ts                     ← NEW: unread count + items
│   └── aiProviderStore.ts                       ← NEW: Vertex/Kimi active state
│
└── lib/
    ├── ai-agents/                               ← EXISTS — keep all files
    ├── services/
    │   ├── MarketService.ts                     ← EXTEND: multi-outcome support
    │   └── NotificationService.ts               ← NEW
    └── utils/
        ├── priceUtils.ts                        ← NEW: sparkline + delta calc
        └── formatUtils.ts                       ← EXTEND: BDT, pct, relative time
```

---

## 🔴 PRIORITY 0 — WIRE EXISTING COMPONENTS (Quick Wins, ~1 Day)

### 1. Market Thumbnail (`components/market/MarketThumbnail.tsx`)

```typescript
// NEW FILE — displays event image or gradient fallback
'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MarketThumbnailProps {
  imageUrl?: string | null;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GRADIENT_MAP: Record<string, string> = {
  Sports: 'from-green-500 to-emerald-700',
  Politics: 'from-red-500 to-rose-700',
  Crypto: 'from-orange-400 to-amber-600',
  Finance: 'from-blue-500 to-indigo-700',
  Entertainment: 'from-purple-500 to-violet-700',
  Technology: 'from-cyan-400 to-sky-600',
  default: 'from-slate-500 to-slate-700',
};

export function MarketThumbnail({ imageUrl, title, size = 'md', className }: MarketThumbnailProps) {
  const sizeMap = { sm: 40, md: 64, lg: 96 };
  const px = sizeMap[size];

  if (imageUrl) {
    return (
      <div className={cn('rounded-full overflow-hidden shrink-0 border-2 border-slate-700', className)}
        style={{ width: px, height: px }}>
        <Image src={imageUrl} alt={title} width={px} height={px} className="object-cover" />
      </div>
    );
  }

  // Gradient fallback based on first letter
  const initial = title.charAt(0).toUpperCase();
  const gradient = GRADIENT_MAP[initial] || GRADIENT_MAP.default;
  return (
    <div className={cn(`rounded-full shrink-0 flex items-center justify-center text-white font-bold bg-gradient-to-br ${gradient} border-2 border-slate-700`, className)}
      style={{ width: px, height: px, fontSize: px * 0.4 }}>
      {initial}
    </div>
  );
}
```

---

### 2. Market Stats Banner (`components/market/MarketStatsBanner.tsx`)

```typescript
// NEW FILE — prominent volume/liquidity/traders banner
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Droplets, Users } from 'lucide-react';

interface MarketStatsBannerProps {
  marketId: string;
  initialVolume?: number;
  initialLiquidity?: number;
}

export function MarketStatsBanner({ marketId, initialVolume = 0, initialLiquidity = 0 }: MarketStatsBannerProps) {
  const [stats, setStats] = useState({
    volume: initialVolume,
    liquidity: initialLiquidity,
    traders: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    // Initial fetch
    fetchStats(supabase, marketId).then(setStats);

    // Realtime: subscribe to new trades to update volume live
    const channel = supabase
      .channel(`market-stats:${marketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trades',
        filter: `market_id=eq.${marketId}`,
      }, () => fetchStats(supabase, marketId).then(setStats))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [marketId]);

  return (
    <div className="flex flex-wrap gap-4 py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
      <StatItem icon={<TrendingUp className="w-4 h-4 text-green-400" />}
        label="মোট ভলিউম" value={formatBDT(stats.volume)} />
      <span className="text-slate-600 self-center">·</span>
      <StatItem icon={<Droplets className="w-4 h-4 text-blue-400" />}
        label="লিকুইডিটি" value={formatBDT(stats.liquidity)} />
      <span className="text-slate-600 self-center">·</span>
      <StatItem icon={<Users className="w-4 h-4 text-purple-400" />}
        label="ট্রেডার" value={`${stats.traders}+`} />
    </div>
  );
}

async function fetchStats(supabase: any, marketId: string) {
  const [tradesRes, positionsRes] = await Promise.all([
    supabase.from('trades').select('price,quantity').eq('market_id', marketId),
    supabase.from('positions').select('user_id').eq('market_id', marketId),
  ]);
  const volume = (tradesRes.data || []).reduce((sum: number, t: any) => sum + t.price * t.quantity, 0);
  const traders = new Set((positionsRes.data || []).map((p: any) => p.user_id)).size;
  return { volume, liquidity: 0, traders }; // liquidity from market record
}

function StatItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-slate-400 text-sm">{label}:</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

function formatBDT(n: number): string {
  if (n >= 1e5) return `৳${(n / 1e5).toFixed(1)} লাখ`;
  if (n >= 1e3) return `৳${(n / 1e3).toFixed(1)}K`;
  return `৳${n.toFixed(0)}`;
}
```

---

### 3. Market Activity Tab — Wire Existing ActivityFeed

**Modify:** `app/(dashboard)/markets/[id]/page.tsx`

```typescript
// ADD BELOW the chart section (do not remove existing chart/orderbook)
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { CommentSection } from '@/components/social/CommentSection';

// In JSX, replace the existing comment section with:
<Tabs defaultValue="activity" className="mt-6">
  <TabsList className="bg-slate-800 border border-slate-700">
    <TabsTrigger value="activity">📊 ট্রেড অ্যাক্টিভিটি</TabsTrigger>
    <TabsTrigger value="comments">💬 মন্তব্য</TabsTrigger>
    <TabsTrigger value="positions">📈 পজিশন র‍্যাংকিং</TabsTrigger>
  </TabsList>
  <TabsContent value="activity">
    <ActivityFeed
      marketId={market.id}
      filterTypes={['trade_buy', 'trade_sell', 'order_placed']}
      showHeader={false}
    />
  </TabsContent>
  <TabsContent value="comments">
    <CommentSection marketId={market.id} />
  </TabsContent>
  <TabsContent value="positions">
    <TopPositionsLeaderboard marketId={market.id} />
  </TabsContent>
</Tabs>
```

---

## 🔴 PRIORITY 1 — SOCIAL LAYER (~3-4 Days)

### 4. Market Actions Bar (`components/market/MarketActions.tsx`)

```typescript
// NEW FILE — Share / Bookmark / Follow / Notify
'use client';
import { useState, useEffect } from 'react';
import { Share2, Bookmark, BookmarkCheck, Bell, BellOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MarketActionsProps {
  marketId: string;
  marketTitle: string;
  followerCount: number;
}

export function MarketActions({ marketId, marketTitle, followerCount }: MarketActionsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [count, setCount] = useState(followerCount);

  // Fetch initial state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      Promise.all([
        supabase.from('user_bookmarks').select('*').eq('user_id', user.id).eq('market_id', marketId).single(),
        supabase.from('market_followers').select('*').eq('user_id', user.id).eq('market_id', marketId).single(),
      ]).then(([b, f]) => {
        setIsBookmarked(!!b.data);
        setIsFollowing(!!f.data);
      });
    });
  }, [marketId]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: marketTitle, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('লিংক কপি হয়েছে!');
    }
  };

  const toggleBookmark = async () => {
    const res = await fetch(`/api/markets/${marketId}/bookmark`, { method: 'POST' });
    if (res.ok) {
      const { bookmarked } = await res.json();
      setIsBookmarked(bookmarked);
      toast.success(bookmarked ? '✅ বুকমার্ক হয়েছে' : 'বুকমার্ক সরানো হয়েছে');
    }
  };

  const toggleFollow = async () => {
    const res = await fetch(`/api/markets/${marketId}/follow`, { method: 'POST' });
    if (res.ok) {
      const { following } = await res.json();
      setIsFollowing(following);
      setCount(c => following ? c + 1 : c - 1);
      toast.success(following ? '🔔 ফলো করা হচ্ছে' : 'আনফলো করা হয়েছে');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="ghost" size="sm" onClick={handleShare} className="text-slate-400 hover:text-white">
        <Share2 className="w-4 h-4 mr-1" /> শেয়ার
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleBookmark} className={isBookmarked ? 'text-yellow-400' : 'text-slate-400'}>
        {isBookmarked ? <BookmarkCheck className="w-4 h-4 mr-1" /> : <Bookmark className="w-4 h-4 mr-1" />}
        {isBookmarked ? 'সেভড' : 'সেভ করুন'}
      </Button>
      <Button variant="ghost" size="sm" onClick={toggleFollow}
        className={isFollowing ? 'text-blue-400 border border-blue-400/30' : 'text-slate-400'}>
        {isFollowing ? <BellOff className="w-4 h-4 mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
        <Users className="w-3 h-3 mr-1" /> {count} ফলোয়ার
      </Button>
    </div>
  );
}
```

---

## 🟡 PRIORITY 2 — MULTI-OUTCOME MARKETS (~5-7 Days)

### 5. Multi-Outcome List (`components/market/MultiOutcomeList.tsx`)

This is the most architecturally significant addition. It extends binary YES/NO markets to support N outcomes (e.g., "Who wins the BPL 2026?" with 8 teams).

```typescript
// NEW FILE
'use client';
import { useState } from 'react';
import { OutcomeRow } from './OutcomeRow';
import { TradingPanel } from '@/components/trading/TradingPanel';
import type { MarketOutcome } from '@/types';

interface MultiOutcomeListProps {
  outcomes: MarketOutcome[];
  marketId: string;
  marketStatus: string;
}

export function MultiOutcomeList({ outcomes, marketId, marketStatus }: MultiOutcomeListProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<MarketOutcome | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'YES' | 'NO'>('YES');

  const handleTrade = (outcome: MarketOutcome, direction: 'YES' | 'NO') => {
    setSelectedOutcome(outcome);
    setTradeDirection(direction);
  };

  return (
    <div className="space-y-2">
      {outcomes.map((outcome) => (
        <OutcomeRow
          key={outcome.id}
          outcome={outcome}
          isSelected={selectedOutcome?.id === outcome.id}
          onTrade={handleTrade}
          disabled={marketStatus !== 'active'}
        />
      ))}
      {selectedOutcome && (
        <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-sm mb-3">
            ট্রেড করুন: <span className="text-white font-medium">{selectedOutcome.label}</span>
          </p>
          <TradingPanel
            marketId={marketId}
            selectedOutcomeId={selectedOutcome.id}
            forcedDirection={tradeDirection}
          />
        </div>
      )}
    </div>
  );
}
```

```typescript
// NEW FILE: components/market/OutcomeRow.tsx
'use client';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketOutcome } from '@/types';

interface OutcomeRowProps {
  outcome: MarketOutcome;
  isSelected: boolean;
  onTrade: (outcome: MarketOutcome, direction: 'YES' | 'NO') => void;
  disabled: boolean;
}

export function OutcomeRow({ outcome, isSelected, onTrade, disabled }: OutcomeRowProps) {
  const pct = Math.round(outcome.current_price * 100);
  const isUp = (outcome.price_change_24h ?? 0) >= 0;

  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-colors
      ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70'}`}>
      {outcome.image_url && (
        <img src={outcome.image_url} alt={outcome.label}
          className="w-8 h-8 rounded-full object-cover shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{outcome.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-lg font-bold text-white">{pct}¢</span>
          {isUp
            ? <span className="text-green-400 text-xs flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />+{Math.abs(outcome.price_change_24h ?? 0).toFixed(1)}¢</span>
            : <span className="text-red-400 text-xs flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />-{Math.abs(outcome.price_change_24h ?? 0).toFixed(1)}¢</span>
          }
        </div>
      </div>
      {/* Probability bar */}
      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="sm" disabled={disabled}
          onClick={() => onTrade(outcome, 'YES')}
          className="bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 text-xs h-7 px-2">
          কিনুন {pct}¢
        </Button>
        <Button size="sm" disabled={disabled}
          onClick={() => onTrade(outcome, 'NO')}
          className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 text-xs h-7 px-2">
          বিক্রি {100 - pct}¢
        </Button>
      </div>
    </div>
  );
}
```

---

## 🤖 AI PROVIDER ROTATION — INTELLIGENT COMBINE MODE

The existing rotation button is extended to work in **combine mode**: both Vertex AI and Kimi run simultaneously for critical tasks; the higher-confidence result is used. For fast tasks, the faster provider wins the race.

### `store/aiProviderStore.ts`

```typescript
// NEW FILE
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProviderMode = 'vertex' | 'kimi' | 'combine' | 'race';

interface AIProviderState {
  mode: ProviderMode;
  vertexHealth: number;    // 0-100 health score
  kimiHealth: number;
  activeProvider: 'vertex' | 'kimi' | 'both';
  vertexFailureRate: number;
  kimiFailureRate: number;
  lastRotation: string | null;

  setMode: (mode: ProviderMode) => void;
  recordSuccess: (provider: 'vertex' | 'kimi') => void;
  recordFailure: (provider: 'vertex' | 'kimi') => void;
  autoRotate: () => void;
}

export const useAIProviderStore = create<AIProviderState>()(
  persist(
    (set, get) => ({
      mode: 'combine',
      vertexHealth: 100,
      kimiHealth: 100,
      activeProvider: 'both',
      vertexFailureRate: 0,
      kimiFailureRate: 0,
      lastRotation: null,

      setMode: (mode) => set({ mode }),

      recordSuccess: (provider) => {
        const key = provider === 'vertex' ? 'vertexHealth' : 'kimiHealth';
        set((s) => ({ [key]: Math.min(100, s[key] + 5) }));
      },

      recordFailure: (provider) => {
        const key = provider === 'vertex' ? 'vertexHealth' : 'kimiHealth';
        const failKey = provider === 'vertex' ? 'vertexFailureRate' : 'kimiFailureRate';
        set((s) => ({
          [key]: Math.max(0, s[key] - 20),
          [failKey]: s[failKey] + 0.1,
        }));
        get().autoRotate();
      },

      autoRotate: () => {
        const { vertexFailureRate, kimiFailureRate } = get();
        // Auto-fallback: if Vertex fails >10%, switch primary to Kimi
        if (vertexFailureRate > 0.1 && kimiFailureRate <= 0.1) {
          set({ activeProvider: 'kimi', lastRotation: new Date().toISOString() });
        } else if (kimiFailureRate > 0.1 && vertexFailureRate <= 0.1) {
          set({ activeProvider: 'vertex', lastRotation: new Date().toISOString() });
        } else {
          set({ activeProvider: 'both' });
        }
      },
    }),
    { name: 'ai-provider-store' }
  )
);
```

### `components/ai/AIRotationToggle.tsx` (EXTEND existing)

```typescript
// EXTEND — add combine mode + health bars to existing rotation button
import { useAIProviderStore } from '@/store/aiProviderStore';

const MODES = [
  { value: 'vertex', label: 'Vertex AI', icon: '🧠', color: 'text-blue-400' },
  { value: 'kimi', label: 'Kimi API', icon: '🌙', color: 'text-purple-400' },
  { value: 'combine', label: 'Combine Mode', icon: '⚡', color: 'text-yellow-400' },
  { value: 'race', label: 'Race Mode', icon: '🏁', color: 'text-green-400' },
];

// Combine mode: both AIs process the prompt; highest confidence result is returned
// Race mode: first AI to respond wins (speed optimization)
// Auto-rotation: based on health scores, degraded provider is deprioritized automatically
```

---

## 🛒 BET SLIP SYSTEM (`components/trading/BetSlip.tsx`)

A global, persistent cart for queueing multiple trades before batch submission.

```typescript
// NEW FILE
'use client';
import { useBetSlipStore } from '@/store/betSlipStore';
import { ShoppingCart, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

export function BetSlip() {
  const { items, removeItem, clearAll, totalCost } = useBetSlipStore();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) return null;

  const handleSubmitAll = async () => {
    setSubmitting(true);
    const res = await fetch('/api/orders/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: items }),
    });
    if (res.ok) {
      clearAll();
      toast.success(`✅ ${items.length}টি অর্ডার সম্পন্ন`);
    }
    setSubmitting(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <button onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full px-4 py-3
          shadow-xl flex items-center gap-2 hover:bg-blue-500 transition-colors">
        <ShoppingCart className="w-5 h-5" />
        <span className="font-bold">{items.length}</span>
        <span className="text-sm">বেট স্লিপ</span>
      </button>

      {/* Slide-in panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-80 z-50 bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-white font-bold">🛒 বেট স্লিপ</h2>
              <button onClick={() => setIsOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium truncate max-w-[180px]">{item.marketTitle}</p>
                    <p className="text-slate-400 text-xs">
                      {item.direction === 'YES' ? '✅ YES' : '❌ NO'} · {item.quantity} শেয়ার @ ৳{item.price}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.id)}><X className="w-4 h-4 text-slate-500 hover:text-red-400" /></button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-700 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">মোট খরচ:</span>
                <span className="text-white font-bold">৳{totalCost.toFixed(2)}</span>
              </div>
              <Button onClick={handleSubmitAll} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-500">
                {submitting ? '⏳ সাবমিট হচ্ছে...' : `সব অর্ডার দিন (${items.length})`}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <button onClick={clearAll} className="text-slate-500 text-xs w-full text-center hover:text-red-400">সব মুছুন</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### `store/betSlipStore.ts`

```typescript
// NEW FILE
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BetSlipItem {
  id: string;
  marketId: string;
  marketTitle: string;
  outcomeId?: string;
  direction: 'YES' | 'NO';
  price: number;
  quantity: number;
  orderType: 'limit' | 'market';
}

interface BetSlipStore {
  items: BetSlipItem[];
  totalCost: number;
  addItem: (item: Omit<BetSlipItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<BetSlipItem>) => void;
  clearAll: () => void;
}

export const useBetSlipStore = create<BetSlipStore>()(
  persist(
    (set, get) => ({
      items: [],
      get totalCost() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },
      addItem: (item) => set((s) => ({
        items: [...s.items, { ...item, id: crypto.randomUUID() }],
      })),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
      updateItem: (id, patch) => set((s) => ({
        items: s.items.map(i => i.id === id ? { ...i, ...patch } : i),
      })),
      clearAll: () => set({ items: [] }),
    }),
    { name: 'bet-slip-store' }
  )
);
```

---

## 📱 MOBILE TRADING UX

### `components/trading/MobileTradingBar.tsx`

```typescript
// NEW FILE — sticky bottom bar visible on mobile (<1024px)
'use client';
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { TradingBottomSheet } from './TradingBottomSheet';

interface MobileTradingBarProps {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  disabled?: boolean;
}

export function MobileTradingBar({ marketId, yesPrice, noPrice, disabled }: MobileTradingBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-700 p-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-slate-400 text-xs">বর্তমান মূল্য</p>
          <div className="flex gap-3">
            <span className="text-green-400 font-bold">YES {Math.round(yesPrice * 100)}¢</span>
            <span className="text-red-400 font-bold">NO {Math.round(noPrice * 100)}¢</span>
          </div>
        </div>
        <button disabled={disabled} onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
          <TrendingUp className="w-4 h-4" /> ট্রেড করুন
        </button>
      </div>
      <TradingBottomSheet open={open} onClose={() => setOpen(false)} marketId={marketId} />
      {/* Spacer to prevent content from hiding behind bar on mobile */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
```

---

## 📊 PRICE HISTORY & SPARKLINES

### `hooks/usePriceHistory.ts`

```typescript
// NEW FILE
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PricePoint { price: number; recorded_at: string; }

export function usePriceHistory(marketId: string, outcome: 'YES' | 'NO' = 'YES', hours = 24) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [delta24h, setDelta24h] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const since = new Date(Date.now() - hours * 3600000).toISOString();

    supabase
      .from('price_history')
      .select('price,recorded_at')
      .eq('market_id', marketId)
      .eq('outcome', outcome)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 1) {
          const first = data[0].price;
          const last = data[data.length - 1].price;
          setDelta24h(Number(((last - first) * 100).toFixed(2)));
          setData(data);
        }
        setLoading(false);
      });
  }, [marketId, outcome, hours]);

  return { data, delta24h, loading };
}
```

---

## 🔔 NOTIFICATION BELL (`components/layout/NotificationBell.tsx`)

```typescript
// NEW FILE — nav bell with unread badge
'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    // Fetch unread notifications
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          setNotifications(data || []);
          setUnread((data || []).length);
        });
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
        <Bell className="w-5 h-5 text-slate-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold
            w-4 h-4 rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-slate-900 border-slate-700 w-80 p-0">
        <div className="p-3 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-white font-medium">নোটিফিকেশন</h3>
          {unread > 0 && (
            <button className="text-blue-400 text-xs hover:text-blue-300"
              onClick={() => markAllRead()}>সব পড়া হয়েছে</button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/50">
          {notifications.length === 0 ? (
            <p className="text-slate-500 text-sm p-4 text-center">কোনো নোটিফিকেশন নেই</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="p-3 hover:bg-slate-800 transition-colors">
                <p className="text-white text-sm">{n.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{n.body}</p>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

async function markAllRead() {
  await fetch('/api/notifications/mark-read', { method: 'POST' });
}
```

---

## 🔍 SEO / OPEN GRAPH (`app/(dashboard)/markets/[id]/page.tsx`)

```typescript
// ADD TO EXISTING PAGE — server-side metadata generation
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServerClient();
  const { data: market } = await supabase.from('markets').select('*, events(*)').eq('id', params.id).single();

  if (!market) return { title: 'Market Not Found — Plokymarket' };

  const price = Math.round((market.yes_price ?? 0.5) * 100);
  const description = `${market.question} — বর্তমান YES মূল্য: ${price}¢. ট্রেড করুন Plokymarket-এ।`;

  return {
    title: `${market.name} — Plokymarket`,
    description,
    openGraph: {
      title: market.name,
      description,
      images: [market.image_url || '/og-default.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: market.name,
      description,
      images: [market.image_url || '/og-default.png'],
    },
  };
}
```

---

## 🔗 SYNCING MARKET SYSTEM WITH EXISTING EVENT SYSTEM

The existing event creation pipeline creates entries in both `events` and `markets` tables. The market system reads from the same tables. No duplication.

```
Event Created (Admin Panel)
         │
         ▼
   events table (id, name, question, category, etc.)
         │  ← event_id foreign key
         ▼
   markets table (id, event_id, status, yes_price, no_price, liquidity)
         │         │
         ▼         ▼
    orders      positions
    trades      price_history (NEW)
                outcomes (NEW — multi-outcome)
                user_bookmarks (NEW)
                market_followers (NEW)
```

Every new component reads from existing tables. New tables (outcomes, user_bookmarks, market_followers, price_history) are additive and do not modify existing schema columns.

---

## 📋 FRONTEND IMPLEMENTATION CHECKLIST

| Feature | Status | Files | ETA |
|---|---|---|---|
| Market Thumbnail | NEW | `MarketThumbnail.tsx` | Day 1 |
| Stats Banner | NEW | `MarketStatsBanner.tsx` | Day 1 |
| Activity Tab (wire) | EXTEND | `page.tsx` | Day 1 |
| Market Actions | NEW | `MarketActions.tsx` | Day 2-3 |
| Comment Avatars/Likes | EXTEND | `CommentSection.tsx` | Day 2-3 |
| Related Markets | NEW | `RelatedMarkets.tsx` | Day 3-4 |
| Price Change Indicators | NEW | `PriceChangeIndicator.tsx` | Day 3-4 |
| AI Combine Mode | EXTEND | `aiProviderStore.ts` | Day 2 |
| Bet Slip | NEW | `BetSlip.tsx`, `betSlipStore.ts` | Day 4-5 |
| Mobile Trading UX | NEW | `MobileTradingBar.tsx` | Day 4-5 |
| Multi-Outcome Markets | NEW | `MultiOutcomeList.tsx` | Day 5-7 |
| Notification Bell | NEW | `NotificationBell.tsx` | Day 6 |
| SEO Meta Tags | EXTEND | `page.tsx` | Day 6 |
| Real Historical Chart | EXTEND | `MarketInfoPanel.tsx` | Day 7 |

---

*See PHASE2_BACKEND_ARCHITECTURE.md for all API routes, database migrations, and server-side logic.*
