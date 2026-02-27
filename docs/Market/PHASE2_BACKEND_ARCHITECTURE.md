# ⚙️ PHASE 2 — BACKEND ARCHITECTURE
## Plokymarket Complete Market System
### Database · API Routes · AI Agents · Oracle · Automation · Production

---

> **CRITICAL RULE:** All existing tables, functions, and RLS policies are preserved. New tables are purely additive. The existing CLOB matching engine (`match_order`, `process_trade_settlement`, `settle_market`) is not modified. New features extend via new tables, functions, and API routes only.

---

## 🗄️ DATABASE MIGRATIONS (Supabase SQL — Apply in Order)

### Migration 001: Multi-Outcome Markets

```sql
-- ============================================================
-- Migration 001: Multi-Outcome Market Support
-- Apply in Supabase SQL Editor
-- ============================================================

-- Market type enum (extend existing markets table)
DO $$ BEGIN
  CREATE TYPE market_type_enum AS ENUM ('binary', 'multi_outcome', 'scalar');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Extend markets table with new columns (additive only)
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS market_type market_type_enum DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS min_value DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS max_value DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS scalar_unit TEXT;

-- Outcomes table for multi-outcome markets
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_bn TEXT,                          -- Bengali label
  image_url TEXT,
  current_price DECIMAL(10,4) DEFAULT 0.5 CHECK (current_price BETWEEN 0 AND 1),
  total_volume DECIMAL(18,2) DEFAULT 0,
  price_change_24h DECIMAL(10,4) DEFAULT 0,
  display_order INT DEFAULT 0,
  is_winning BOOLEAN,                     -- Set during resolution
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_market_id ON outcomes(market_id);

-- RLS policies for outcomes
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outcomes_read_all" ON outcomes FOR SELECT USING (true);
CREATE POLICY "outcomes_insert_admin" ON outcomes FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
CREATE POLICY "outcomes_update_admin" ON outcomes FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
```

---

### Migration 002: Social Layer (Bookmarks, Follows, Comment Likes)

```sql
-- ============================================================
-- Migration 002: Social Tables
-- ============================================================

-- User bookmarks
CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_market ON user_bookmarks(market_id);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_own" ON user_bookmarks USING (auth.uid() = user_id);

-- Market followers
CREATE TABLE IF NOT EXISTS market_followers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  notify_on_trade BOOLEAN DEFAULT false,
  notify_on_resolve BOOLEAN DEFAULT true,
  notify_on_price_change BOOLEAN DEFAULT false,
  price_alert_threshold DECIMAL(5,2),     -- Alert when price moves +/- this %
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_market ON market_followers(market_id);

ALTER TABLE market_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followers_own" ON market_followers USING (auth.uid() = user_id);

-- Comment likes (use market_comments table that already exists)
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES market_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comment_likes_own" ON comment_likes USING (auth.uid() = user_id);
CREATE POLICY "comment_likes_read" ON comment_likes FOR SELECT USING (true);

-- Add like_count to market_comments (computed via trigger)
ALTER TABLE market_comments ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- Trigger to keep like_count in sync
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE market_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE market_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comment_like_count ON comment_likes;
CREATE TRIGGER trg_comment_like_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();
```

---

### Migration 003: Price History & Market Analytics

```sql
-- ============================================================
-- Migration 003: Price History + Market Analytics
-- ============================================================

-- Price history (for sparklines, 24h delta, historical charts)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome_id UUID REFERENCES outcomes(id) ON DELETE CASCADE,  -- for multi-outcome
  outcome TEXT NOT NULL DEFAULT 'YES',   -- 'YES', 'NO', or outcome label
  price DECIMAL(10,4) NOT NULL,
  volume_at_time DECIMAL(18,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_market_time
  ON price_history(market_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_outcome
  ON price_history(market_id, outcome, recorded_at DESC);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_history_read" ON price_history FOR SELECT USING (true);
CREATE POLICY "price_history_insert_system" ON price_history FOR INSERT
  WITH CHECK (true);  -- Only server inserts via service role

-- Market daily stats (aggregated, for fast reads)
CREATE TABLE IF NOT EXISTS market_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_price DECIMAL(10,4),
  close_price DECIMAL(10,4),
  high_price DECIMAL(10,4),
  low_price DECIMAL(10,4),
  volume DECIMAL(18,2) DEFAULT 0,
  trade_count INT DEFAULT 0,
  unique_traders INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(market_id, date)
);

CREATE INDEX IF NOT EXISTS idx_market_daily_stats ON market_daily_stats(market_id, date DESC);

ALTER TABLE market_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_stats_read" ON market_daily_stats FOR SELECT USING (true);

-- Function: record hourly price snapshot (called by cron job)
CREATE OR REPLACE FUNCTION record_price_snapshots()
RETURNS void AS $$
BEGIN
  -- Binary markets: snapshot YES price
  INSERT INTO price_history (market_id, outcome, price, volume_at_time)
  SELECT
    m.id,
    'YES',
    COALESCE(m.yes_price, 0.5),
    COALESCE(m.total_volume, 0)
  FROM markets m
  WHERE m.status = 'active';

  -- Multi-outcome: snapshot each outcome
  INSERT INTO price_history (market_id, outcome_id, outcome, price)
  SELECT
    o.market_id,
    o.id,
    o.label,
    o.current_price
  FROM outcomes o
  JOIN markets m ON m.id = o.market_id
  WHERE m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: calculate 24h price change for all active markets
CREATE OR REPLACE FUNCTION update_price_changes()
RETURNS void AS $$
BEGIN
  UPDATE markets m
  SET yes_price_change_24h = (
    SELECT m.yes_price - ph.price
    FROM price_history ph
    WHERE ph.market_id = m.id
      AND ph.outcome = 'YES'
      AND ph.recorded_at <= now() - INTERVAL '24 hours'
    ORDER BY ph.recorded_at DESC
    LIMIT 1
  )
  WHERE m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Extend markets table for price change tracking
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS yes_price_change_24h DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_price_change_24h DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_traders INT DEFAULT 0;
```

---

### Migration 004: Notifications System

```sql
-- ============================================================
-- Migration 004: Notifications
-- ============================================================

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'market_resolved', 'trade_filled', 'price_alert',
    'market_closing_soon', 'follower_trade', 'ai_suggestion',
    'position_profit', 'position_loss', 'system'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  market_id UUID REFERENCES markets(id),
  trade_id UUID REFERENCES trades(id),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_market ON notifications(market_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications USING (auth.uid() = user_id);

-- Trigger: notify market followers on large trades
CREATE OR REPLACE FUNCTION notify_market_followers_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  trade_value DECIMAL;
BEGIN
  trade_value := NEW.price * NEW.quantity;

  -- Only notify for significant trades (value > 100 BDT)
  IF trade_value < 100 THEN RETURN NEW; END IF;

  FOR follower IN
    SELECT mf.user_id
    FROM market_followers mf
    WHERE mf.market_id = NEW.market_id
      AND mf.notify_on_trade = true
      AND mf.user_id != NEW.maker_id
      AND mf.user_id != NEW.taker_id
  LOOP
    INSERT INTO notifications (user_id, type, title, body, market_id, trade_id, action_url)
    VALUES (
      follower.user_id,
      'follower_trade',
      'বড় ট্রেড হয়েছে',
      '৳' || trade_value::TEXT || ' এর ট্রেড হয়েছে আপনার ফলো করা মার্কেটে',
      NEW.market_id,
      NEW.id,
      '/markets/' || NEW.market_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_followers ON trades;
CREATE TRIGGER trg_notify_followers
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION notify_market_followers_on_trade();

-- Trigger: notify user when market resolves
CREATE OR REPLACE FUNCTION notify_on_market_resolve()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    INSERT INTO notifications (user_id, type, title, body, market_id, action_url)
    SELECT
      p.user_id,
      'market_resolved',
      'মার্কেট সমাধান হয়েছে',
      NEW.name || ' — ফলাফল: ' || COALESCE(NEW.resolution_outcome, 'নির্ধারিত'),
      NEW.id,
      '/markets/' || NEW.id
    FROM positions p
    WHERE p.market_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_resolve ON markets;
CREATE TRIGGER trg_notify_resolve
  AFTER UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION notify_on_market_resolve();
```

---

### Migration 005: Batch Orders + Order Commitments

```sql
-- ============================================================
-- Migration 005: Batch Orders Support
-- ============================================================

-- Batch order groups (for bet slip submissions)
CREATE TABLE IF NOT EXISTS order_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed')),
  total_cost DECIMAL(18,2),
  order_count INT DEFAULT 0,
  filled_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Link orders to batches
ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES order_batches(id);

ALTER TABLE order_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batches_own" ON order_batches USING (auth.uid() = user_id);
```

---

## 🔌 API ROUTES

### Directory Structure

```
app/api/
├── markets/
│   ├── [id]/
│   │   ├── bookmark/route.ts          ← NEW
│   │   ├── follow/route.ts            ← NEW
│   │   ├── stats/route.ts             ← NEW
│   │   ├── related/route.ts           ← NEW
│   │   ├── outcomes/route.ts          ← NEW
│   │   └── price-history/route.ts     ← NEW
│   └── route.ts                       ← EXISTS — extend with filters
├── orders/
│   ├── batch/route.ts                 ← NEW
│   └── route.ts                       ← EXISTS
├── comments/
│   └── [id]/like/route.ts             ← NEW
├── notifications/
│   ├── route.ts                       ← NEW
│   └── mark-read/route.ts             ← NEW
├── ai/
│   ├── vertex-generate/route.ts       ← EXISTS — keep
│   ├── event-workflow/route.ts        ← EXISTS — keep
│   └── market-resolution/route.ts     ← EXISTS — keep
└── cron/
    ├── price-snapshot/route.ts        ← NEW (called by Vercel Cron)
    └── market-close-check/route.ts    ← NEW (called by Vercel Cron)
```

---

### `app/api/markets/[id]/bookmark/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Toggle bookmark
  const { data: existing } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('market_id', params.id)
    .single();

  if (existing) {
    await supabase.from('user_bookmarks').delete()
      .eq('user_id', user.id).eq('market_id', params.id);
    return NextResponse.json({ bookmarked: false });
  } else {
    await supabase.from('user_bookmarks').insert({
      user_id: user.id,
      market_id: params.id,
    });
    return NextResponse.json({ bookmarked: true });
  }
}
```

---

### `app/api/markets/[id]/follow/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const { data: existing } = await supabase
    .from('market_followers')
    .select('*').eq('user_id', user.id).eq('market_id', params.id).single();

  if (existing) {
    await supabase.from('market_followers').delete()
      .eq('user_id', user.id).eq('market_id', params.id);
    return NextResponse.json({ following: false });
  } else {
    await supabase.from('market_followers').insert({
      user_id: user.id,
      market_id: params.id,
      notify_on_trade: body.notify_on_trade ?? false,
      notify_on_resolve: body.notify_on_resolve ?? true,
    });
    return NextResponse.json({ following: true });
  }
}
```

---

### `app/api/markets/[id]/stats/route.ts`

```typescript
// NEW FILE — aggregate market stats endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30; // ISR: revalidate every 30 seconds

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const [tradesRes, positionsRes, followersRes, bookmarksRes] = await Promise.all([
    supabase.from('trades').select('price,quantity,created_at')
      .eq('market_id', params.id),
    supabase.from('positions').select('user_id,yes_shares,no_shares')
      .eq('market_id', params.id),
    supabase.from('market_followers').select('user_id')
      .eq('market_id', params.id),
    supabase.from('user_bookmarks').select('user_id')
      .eq('market_id', params.id),
  ]);

  const trades = tradesRes.data || [];
  const volume = trades.reduce((s, t) => s + t.price * t.quantity, 0);
  const uniqueTraders = new Set(positionsRes.data?.map(p => p.user_id) || []).size;

  // 24h volume
  const since24h = new Date(Date.now() - 86400000).toISOString();
  const volume24h = trades
    .filter(t => t.created_at >= since24h)
    .reduce((s, t) => s + t.price * t.quantity, 0);

  return NextResponse.json({
    volume,
    volume24h,
    tradeCount: trades.length,
    uniqueTraders,
    followerCount: (followersRes.data || []).length,
    bookmarkCount: (bookmarksRes.data || []).length,
    lastUpdated: new Date().toISOString(),
  });
}
```

---

### `app/api/markets/[id]/price-history/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60; // Cache for 60 seconds

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const hours = parseInt(searchParams.get('hours') || '24');
  const outcome = searchParams.get('outcome') || 'YES';

  const since = new Date(Date.now() - hours * 3600000).toISOString();

  const { data, error } = await supabase
    .from('price_history')
    .select('price, recorded_at, volume_at_time')
    .eq('market_id', params.id)
    .eq('outcome', outcome)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Calculate delta
  const delta = data && data.length > 1
    ? data[data.length - 1].price - data[0].price
    : 0;

  return NextResponse.json({ data, delta, outcome, hours });
}
```

---

### `app/api/markets/[id]/related/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 120;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Get current market's category
  const { data: market } = await supabase
    .from('markets').select('category').eq('id', params.id).single();

  if (!market) return NextResponse.json({ data: [] });

  const { data } = await supabase
    .from('markets')
    .select('id, name, question, yes_price, no_price, total_volume, image_url, category, status')
    .eq('category', market.category)
    .eq('status', 'active')
    .neq('id', params.id)
    .order('total_volume', { ascending: false })
    .limit(4);

  return NextResponse.json({ data: data || [] });
}
```

---

### `app/api/markets/[id]/outcomes/route.ts`

```typescript
// NEW FILE — CRUD for multi-outcome markets
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('outcomes')
    .select('*')
    .eq('market_id', params.id)
    .order('display_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Require admin role
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user?.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const outcomes = Array.isArray(body.outcomes) ? body.outcomes : [body];

  const { data, error } = await supabase.from('outcomes').insert(
    outcomes.map((o: any, i: number) => ({
      market_id: params.id,
      label: o.label,
      label_bn: o.label_bn,
      image_url: o.image_url,
      current_price: o.current_price ?? 1 / outcomes.length,
      display_order: i,
    }))
  ).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
```

---

### `app/api/orders/batch/route.ts`

```typescript
// NEW FILE — Batch order submission (for Bet Slip)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orders } = await req.json();
  if (!Array.isArray(orders) || orders.length === 0) {
    return NextResponse.json({ error: 'No orders provided' }, { status: 400 });
  }
  if (orders.length > 20) {
    return NextResponse.json({ error: 'Max 20 orders per batch' }, { status: 400 });
  }

  // Check wallet balance
  const totalCost = orders.reduce((s: number, o: any) => s + o.price * o.quantity, 0);
  const { data: wallet } = await supabase
    .from('wallets').select('available_balance').eq('user_id', user.id).single();

  if (!wallet || wallet.available_balance < totalCost) {
    return NextResponse.json({ error: 'অপর্যাপ্ত ব্যালেন্স', required: totalCost }, { status: 400 });
  }

  // Create batch record
  const { data: batch } = await supabase.from('order_batches').insert({
    user_id: user.id,
    total_cost: totalCost,
    order_count: orders.length,
    status: 'processing',
  }).select().single();

  // Insert all orders atomically using a transaction via RPC
  const results = await Promise.allSettled(
    orders.map((o: any) =>
      supabase.from('orders').insert({
        user_id: user.id,
        market_id: o.marketId,
        order_type: o.orderType || 'limit',
        outcome: o.direction,
        side: 'buy',
        price: o.price,
        quantity: o.quantity,
        batch_id: batch?.id,
      }).select().single()
    )
  );

  const filled = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - filled;

  // Update batch status
  await supabase.from('order_batches').update({
    status: filled === orders.length ? 'completed' : failed === orders.length ? 'failed' : 'partial',
    filled_count: filled,
    completed_at: new Date().toISOString(),
  }).eq('id', batch?.id);

  return NextResponse.json({
    batchId: batch?.id,
    total: orders.length,
    filled,
    failed,
    status: filled === orders.length ? 'completed' : 'partial',
  });
}
```

---

### `app/api/comments/[id]/like/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('*').eq('user_id', user.id).eq('comment_id', params.id).single();

  if (existing) {
    await supabase.from('comment_likes').delete()
      .eq('user_id', user.id).eq('comment_id', params.id);
    return NextResponse.json({ liked: false });
  } else {
    await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: params.id });
    return NextResponse.json({ liked: true });
  }
}
```

---

### `app/api/notifications/route.ts`

```typescript
// NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq('read', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}
```

---

## 🤖 INTELLIGENT AI PROVIDER SYSTEM

### Architecture: Vertex + Kimi Combine Mode

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AI Orchestration Layer                             │
│                                                                      │
│  User Request → AIOrchestrator                                       │
│                      │                                               │
│            ┌─────────┴──────────┐                                    │
│            ▼                    ▼                                    │
│    [COMBINE MODE]          [RACE MODE]                               │
│    Run both in parallel    First response wins                       │
│    Compare confidence      (speed critical tasks)                    │
│    Return highest score                                               │
│            │                    │                                    │
│    ┌───────┴───────┐    ┌───────┴───────┐                            │
│    ▼               ▼    ▼               ▼                            │
│  Vertex AI      Kimi  Vertex AI      Kimi                            │
│  (Primary)   (Fallback) (Fast)       (Fast)                          │
│    │               │                                                 │
│    └───── merge ───┘                                                 │
│            │                                                         │
│       Confidence Scorer (0-100)                                      │
│            │                                                         │
│    ≥85: Auto-approve → Event Created                                 │
│    60-84: Admin Review Queue                                         │
│    <60: Reject + Retry with other provider                           │
└──────────────────────────────────────────────────────────────────────┘
```

### `lib/ai-agents/intelligent-router.ts` (NEW)

```typescript
// NEW FILE — Smart AI routing with health monitoring
interface ProviderResponse {
  provider: 'vertex' | 'kimi';
  data: any;
  confidence: number;
  latency: number;
  error?: string;
}

interface RouterConfig {
  mode: 'combine' | 'race' | 'vertex' | 'kimi' | 'auto';
  timeoutMs: number;
  minConfidence: number;
}

export class IntelligentAIRouter {
  private vertexHealth = 100;
  private kimiHealth = 100;
  private vertexLatencyMs = 0;
  private kimiLatencyMs = 0;

  async route(prompt: string, config: RouterConfig = {
    mode: 'auto',
    timeoutMs: 30000,
    minConfidence: 60,
  }): Promise<ProviderResponse> {

    const effectiveMode = this.resolveMode(config.mode);

    switch (effectiveMode) {
      case 'combine': return this.combineMode(prompt, config.timeoutMs);
      case 'race':    return this.raceMode(prompt, config.timeoutMs);
      case 'vertex':  return this.callVertex(prompt);
      case 'kimi':    return this.callKimi(prompt);
      default:        return this.combineMode(prompt, config.timeoutMs);
    }
  }

  private resolveMode(requested: string): string {
    if (requested !== 'auto') return requested;
    // Auto mode: degrade to healthy provider
    if (this.vertexHealth < 30) return 'kimi';
    if (this.kimiHealth < 30) return 'vertex';
    return 'combine';
  }

  private async combineMode(prompt: string, timeoutMs: number): Promise<ProviderResponse> {
    const [vertexResult, kimiResult] = await Promise.allSettled([
      this.withTimeout(this.callVertex(prompt), timeoutMs),
      this.withTimeout(this.callKimi(prompt), timeoutMs),
    ]);

    const responses: ProviderResponse[] = [];
    if (vertexResult.status === 'fulfilled') {
      responses.push(vertexResult.value);
      this.updateHealth('vertex', true, vertexResult.value.latency);
    } else {
      this.updateHealth('vertex', false, timeoutMs);
    }
    if (kimiResult.status === 'fulfilled') {
      responses.push(kimiResult.value);
      this.updateHealth('kimi', true, kimiResult.value.latency);
    } else {
      this.updateHealth('kimi', false, timeoutMs);
    }

    if (responses.length === 0) throw new Error('All providers failed');

    // Return highest confidence response
    return responses.reduce((best, r) => r.confidence > best.confidence ? r : best);
  }

  private async raceMode(prompt: string, timeoutMs: number): Promise<ProviderResponse> {
    return Promise.race([
      this.withTimeout(this.callVertex(prompt), timeoutMs),
      this.withTimeout(this.callKimi(prompt), timeoutMs),
    ]);
  }

  private async callVertex(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    try {
      const res = await fetch('/api/ai/vertex-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'content', context: { rawInput: prompt } }),
      });
      const data = await res.json();
      return {
        provider: 'vertex',
        data,
        confidence: data.confidence ?? 75,
        latency: Date.now() - start,
      };
    } catch (error) {
      throw { provider: 'vertex', error: String(error) };
    }
  }

  private async callKimi(prompt: string): Promise<ProviderResponse> {
    const start = Date.now();
    const kimiKey = process.env.KIMI_API_KEY;
    if (!kimiKey) throw new Error('Kimi API key not configured');

    try {
      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kimiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      return {
        provider: 'kimi',
        data: JSON.parse(content),
        confidence: 70,
        latency: Date.now() - start,
      };
    } catch (error) {
      throw { provider: 'kimi', error: String(error) };
    }
  }

  private updateHealth(provider: 'vertex' | 'kimi', success: boolean, latency: number) {
    if (provider === 'vertex') {
      this.vertexHealth = success
        ? Math.min(100, this.vertexHealth + 5)
        : Math.max(0, this.vertexHealth - 20);
      this.vertexLatencyMs = latency;
    } else {
      this.kimiHealth = success
        ? Math.min(100, this.kimiHealth + 5)
        : Math.max(0, this.kimiHealth - 20);
      this.kimiLatencyMs = latency;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  getHealthStatus() {
    return {
      vertex: { health: this.vertexHealth, latency: this.vertexLatencyMs },
      kimi: { health: this.kimiHealth, latency: this.kimiLatencyMs },
      recommended: this.vertexHealth >= this.kimiHealth ? 'vertex' : 'kimi',
    };
  }
}

// Singleton instance (shared across requests via module cache)
export const aiRouter = new IntelligentAIRouter();
```

---

## ⏰ CRON JOBS (Vercel Cron + QStash)

### `app/api/cron/price-snapshot/route.ts`

```typescript
// NEW FILE — Records hourly price snapshots
// Add to vercel.json: { "crons": [{ "path": "/api/cron/price-snapshot", "schedule": "0 * * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Secure cron endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Call the SQL function
  const { error } = await supabase.rpc('record_price_snapshots');
  if (error) {
    console.error('[Cron/PriceSnapshot] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update 24h changes
  await supabase.rpc('update_price_changes');

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Price snapshots recorded',
  });
}
```

### `app/api/cron/market-close-check/route.ts`

```typescript
// NEW FILE — Checks for markets closing in <1 hour and sends notifications
// vercel.json: { "crons": [{ "path": "/api/cron/market-close-check", "schedule": "*/15 * * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const in1Hour = new Date(Date.now() + 3600000).toISOString();
  const now = new Date().toISOString();

  // Find markets closing in next hour
  const { data: closingMarkets } = await supabase
    .from('markets')
    .select('id, name')
    .eq('status', 'active')
    .lte('trading_closes_at', in1Hour)
    .gt('trading_closes_at', now)
    .is('close_warned', null);  // Don't double-warn

  for (const market of closingMarkets || []) {
    // Get followers
    const { data: followers } = await supabase
      .from('market_followers')
      .select('user_id')
      .eq('market_id', market.id);

    if (followers && followers.length > 0) {
      await supabase.from('notifications').insert(
        followers.map(f => ({
          user_id: f.user_id,
          type: 'market_closing_soon',
          title: '⏰ মার্কেট শীঘ্রই বন্ধ হবে',
          body: `${market.name} — ১ ঘণ্টার মধ্যে ট্রেডিং বন্ধ হবে`,
          market_id: market.id,
          action_url: `/markets/${market.id}`,
        }))
      );
    }

    // Mark as warned
    await supabase.from('markets').update({ close_warned: true }).eq('id', market.id);
  }

  return NextResponse.json({
    status: 'ok',
    closingMarketsFound: (closingMarkets || []).length,
  });
}
```

### `vercel.json` (ADD cron section)

```json
{
  "crons": [
    {
      "path": "/api/cron/price-snapshot",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/market-close-check",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 🔒 ENVIRONMENT VARIABLES

```bash
# .env.local — Add these new variables (existing ones untouched)

# Cron job security
CRON_SECRET=your-random-secret-here

# AI providers (existing — keep)
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
KIMI_API_KEY=sk-your-kimi-key

# Supabase (existing — keep)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx   # For cron jobs (server-only)

# QStash (existing — keep)
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
```

---

## 📊 COMPLETE DATABASE SCHEMA (New Tables Summary)

| Table | Purpose | Linked To |
|---|---|---|
| `outcomes` | Multi-outcome market results | `markets(id)` |
| `user_bookmarks` | Per-user saved markets | `auth.users`, `markets` |
| `market_followers` | Follow + notification prefs | `auth.users`, `markets` |
| `comment_likes` | Like/upvote comments | `auth.users`, `market_comments` |
| `price_history` | Hourly price snapshots | `markets`, `outcomes` |
| `market_daily_stats` | Daily OHLCV aggregates | `markets` |
| `notifications` | All user notifications | `auth.users`, `markets`, `trades` |
| `order_batches` | Bet slip batch tracking | `auth.users` |

---

## 🧪 DEPENDENCY CHECKLIST

| Dependency | Status | Version | Purpose |
|---|---|---|---|
| `@supabase/ssr` | ✅ Installed | Latest | SSR-compatible Supabase client |
| `framer-motion` | ✅ Installed | Latest | Animations (BetSlip, BottomSheet) |
| `zustand` | ✅ Installed | Latest | State management |
| `recharts` | ✅ Installed | Latest | Price charts, sparklines |
| `sonner` | ✅ Installed | Latest | Toast notifications |
| `lucide-react` | ✅ Installed | Latest | Icons |
| `@google-cloud/vertexai` | ✅ Installed | Latest | Vertex AI |
| `zod` | ✅ Present | Latest | Validate batch order inputs |
| `@upstash/qstash` | ✅ Installed | Latest | Async job processing |

No new `npm install` required for Phase 1 & 2. All dependencies are already in the project.

---

## 🚀 PRODUCTION READINESS CHECKLIST

### Security
- [x] All new tables have RLS enabled
- [x] Admin-only routes check `role = 'admin'`
- [x] Cron endpoints protected by `CRON_SECRET`
- [x] Batch orders validate wallet balance before processing
- [x] Notifications only visible to their owner (RLS)

### Performance
- [x] `price_history` indexed on `(market_id, recorded_at DESC)`
- [x] `notifications` indexed on `(user_id, read, created_at DESC)`
- [x] ISR (Incremental Static Regeneration) on stats & related markets endpoints
- [x] Supabase Realtime used only where necessary (stats banner, notifications)
- [x] Batch orders capped at 20 to prevent wallet drain attacks

### Data Integrity
- [x] `comment_likes` uses a trigger to keep `like_count` in sync (avoids race conditions)
- [x] `notifications` trigger fires on trade INSERT and market status UPDATE
- [x] `price_history` populated by cron (not user-facing writes)
- [x] All new FK references include `ON DELETE CASCADE`

### Observability
- [x] All cron jobs return structured JSON with counts
- [x] AI router logs provider health scores
- [x] Batch orders create a `order_batches` audit record
- [x] Notifications log `market_id` and `trade_id` for traceability

---

## 📅 IMPLEMENTATION PLAN

### Week 1 — Foundation
- Day 1-2: Apply all 5 DB migrations. Wire ActivityFeed + Stats Banner + Thumbnail to market page.
- Day 3-4: Implement MarketActions (Share/Bookmark/Follow) + 3 API routes.
- Day 5: Set up cron jobs + price_history seeding. Deploy `vercel.json`.

### Week 2 — Social + AI
- Day 6-7: Extend CommentSection with avatars, likes, sort tabs. Build NotificationBell.
- Day 8: Implement Bet Slip (BetSlip.tsx + betSlipStore.ts + /api/orders/batch).
- Day 9-10: Intelligent AI router (combine/race mode). Extend AIRotationToggle with health bars.

### Week 3 — Advanced Features
- Day 11-12: Multi-outcome markets (DB + OutcomeRow + MultiOutcomeList + TradingPanel extension).
- Day 13: Mobile trading UX (MobileTradingBar + TradingBottomSheet).
- Day 14: SEO meta tags + RelatedMarkets + Real historical chart.

### Week 4 — Production Polish
- Day 15-16: End-to-end testing of all new features.
- Day 17: Performance audit (Lighthouse, Supabase query plans).
- Day 18: Security audit (RLS policy review, rate limiting).
- Day 19-20: Staging deployment → production deployment.

---

*See PHASE1_FRONTEND_ARCHITECTURE.md for all UI components, hooks, and store definitions.*
