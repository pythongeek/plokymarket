# Plokymarket vs Polymarket — Event Page Feature Gap Analysis

> **Purpose**: Production-ready documentation identifying all missing or incomplete features on the Plokymarket event/market detail page compared to Polymarket.com. Based on screenshot comparison and full codebase audit.

---

## Current State Summary

### ✅ What Plokymarket Already Has

| Component | File | Status |
|:---|:---|:---|
| **Price Chart** | `components/trading/PriceChart.tsx` (246 loc) | ✅ Working — AreaChart with real-time trades |
| **Order Book** | `components/trading/OrderBook.tsx` (224 loc) | ✅ Working — YES/NO sides, spread indicator |
| **Trading Panel** | `components/trading/TradingPanel.tsx` (661 loc) | ✅ Working — Buy/Sell, Market/Limit, slippage |
| **My Positions** | `components/trading/MyPositions.tsx` (79 loc) | ✅ Working — P&L display |
| **Depth Chart** | `components/clob/DepthChart.tsx` | ✅ Working — Bid/Ask visualization |
| **Liquidity Heatmap** | `components/clob/LiquidityHeatMap.tsx` | ✅ Working — Volume heatmap |
| **Market Status** | `components/market/MarketStatusDisplay.tsx` (660 loc) | ✅ Working — Status badges, oracle confidence |
| **Market Info** | `components/market/MarketInfoPanel.tsx` (132 loc) | ⚠️ Partial — Resolution criteria, oracle, creator, **but historical chart is a static SVG placeholder** |
| **Comments** | `components/social/CommentSection.tsx` (290 loc) | ✅ Working — CRUD, threading, replies |
| **Activity Feed** | `components/social/ActivityFeed.tsx` (847 loc) | ✅ Built — **But NOT used on the market detail page** |
| **Pause Banner** | `components/trading/PauseBanner.tsx` | ✅ Working — Emergency/category/market pause |
| **Breadcrumbs** | Inline in page | ✅ Working — Markets > Category |

---

## 🔴 Missing Features (Critical Gaps)

### Gap 1: Multi-Outcome Markets
**Priority: 🔴 Critical** | **Polymarket has it: Yes**

Polymarket supports markets with 10+ outcomes (e.g., "Who will win MVP?" with individual players listed). Plokymarket only supports binary YES/NO markets.

**What's needed:**
- **Database**: Add `market_type` ENUM (`binary`, `multi_outcome`) to `markets` table. Add `outcomes` table with columns: `id`, `market_id`, `label`, `image_url`, `current_price`, `total_volume`.
- **Backend**: Modify `MarketService.createMarketWithLiquidity()` to accept N outcomes. Each outcome gets its own order book.
- **Frontend**: New `MultiOutcomeList` component showing each outcome as a row with: label, percentage, Buy Yes/Buy No buttons, and sparkline price movement indicator.
- **Trading Panel**: Refactor `TradingPanel.tsx` to accept a selected outcome instead of just YES/NO.

**Files to modify:**
- `types/index.ts` — Add `MarketOutcome` interface
- `lib/services/MarketService.ts` — Multi-outcome creation logic
- `app/(dashboard)/markets/[id]/page.tsx` — Conditional rendering for multi vs binary
- New: `components/market/MultiOutcomeList.tsx`
- New: `components/market/OutcomeRow.tsx`

---

### Gap 2: Share/Bookmark/Social Actions Bar
**Priority: 🔴 Critical** | **Polymarket has it: Yes**

Polymarket has a floating action bar below the title with: **Share**, **Bookmark**, **Follow**, and **notification bell** icons. Plokymarket has no social action bar on the market detail page.

**What's needed:**
- **Database**: Add `user_bookmarks` table (`user_id`, `market_id`, `created_at`). Add `market_followers` table (`user_id`, `market_id`, `notify_on_trade`, `notify_on_resolve`).
- **Frontend**: New `MarketActions` component with:
  - 📤 Share button (copy link, Web Share API, Twitter/Facebook)
  - 🔖 Bookmark toggle (saves to user profile)
  - 👥 Follower count display
  - 🔔 Notification preferences per market
- **API Routes**: `POST /api/markets/[id]/bookmark`, `POST /api/markets/[id]/follow`

**Files to create:**
- `components/market/MarketActions.tsx`
- `app/api/markets/[id]/bookmark/route.ts`
- `app/api/markets/[id]/follow/route.ts`

---

### Gap 3: Trade Activity Tab (Recent Trades Feed)
**Priority: 🔴 Critical** | **Polymarket has it: Yes**

Polymarket shows a **tabbed interface** below the chart with "Activity" and "Comments" tabs. The Activity tab shows recent trades with: user avatar, username, trade direction (Bought Yes/No), amount, price, and timestamp. Plokymarket has the `ActivityFeed` component (847 loc) but it is **NOT rendered** on the market detail page.

**What's needed:**
- **Page integration**: Add a tab system to the market detail page with "Activity" and "Comments" tabs.
- **Activity Feed per Market**: Filter `ActivityFeed` component by `marketId` to show only trades for this market.
- **Trade display format**: Each trade should show:
  - User avatar + username
  - "Bought **Yes** 50 shares at ৳0.52" or "Sold **No** 20 shares at ৳0.48"
  - Timestamp (relative: "2 min ago")

**Files to modify:**
- `app/(dashboard)/markets/[id]/page.tsx` — Add Tabs component wrapping Activity + Comments
- Wire existing `ActivityFeed` with `filterTypes={['trader_activity']}` and market filter

---

### Gap 4: Volume & Liquidity Banner
**Priority: 🟡 High** | **Polymarket has it: Yes**

Polymarket shows total volume and liquidity prominently near the top (e.g., "$50"). Our market stats section is at the bottom. Needs to be more prominent.

**What's needed:**
- **Redesign**: Move total volume, total liquidity, and unique traders count into a prominent horizontal banner just below the title.
- **Format**: `৳1.2 লাখ Vol  ·  ৳50K Liquidity  ·  24 Traders`
- **Realtime updates**: Subscribe to trade completions to update volume live.

**Files to modify:**
- `app/(dashboard)/markets/[id]/page.tsx` — Add stats banner between header and chart

---

### Gap 5: Related Markets / "You Might Also Like"
**Priority: 🟡 High** | **Polymarket has it: Yes (bottom section)**

Polymarket shows "Related markets" at the bottom of the page. Plokymarket has nothing below comments.

**What's needed:**
- **Backend**: Query markets in the same category, excluding the current one, ordered by volume/recency.
- **Frontend**: New `RelatedMarkets` component showing 3-4 `PolymarketCard` cards in a horizontal row.
- **API**: `GET /api/markets?category=X&exclude=CURRENT_ID&limit=4`

**Files to create:**
- `components/market/RelatedMarkets.tsx`

**Files to modify:**
- `app/(dashboard)/markets/[id]/page.tsx` — Add RelatedMarkets at the bottom

---

### Gap 6: User Avatars & Profile Links in Comments
**Priority: 🟡 High** | **Polymarket has it: Yes**

Polymarket comments show: user avatar, username (clickable to profile), timestamp, and like/reply counts. Plokymarket's `CommentSection` has threading but is **missing**:
- User avatar display (round thumbnail)
- Clickable username linking to `/profile/[userId]`
- Like/upvote button with count
- "Top" / "Newest" sort tabs

**What's needed:**
- **Database**: Add `comment_likes` table (`user_id`, `comment_id`, `created_at`). Add `like_count` column to `comments` table (or compute via query).
- **Frontend**: Enhance `CommentItem` in `CommentSection.tsx` to include avatar, profile link, like button, and sort controls.
- **API**: `POST /api/comments/[id]/like`

**Files to modify:**
- `components/social/CommentSection.tsx` — Add avatar, like button, sort
- `hooks/social/useComments.ts` — Add like/sort functionality

---

### Gap 7: Market Thumbnail / Cover Image
**Priority: 🟡 High** | **Polymarket has it: Yes**

Polymarket shows a round event thumbnail next to the title (visible in both the header and the event card). Plokymarket's market detail page has **no image** displayed, even though `image_url` is stored in the database.

**What's needed:**
- Display the event/market `image_url` as a round thumbnail next to the title in the header area (matching the `PolymarketCard` design).
- Fallback to a gradient icon if no image is set.

**Files to modify:**
- `app/(dashboard)/markets/[id]/page.tsx` — Add thumbnail to header section

---

## 🟡 Missing Features (Important Gaps)

### Gap 8: Price Change Indicators (Sparklines & Deltas)
**Priority: 🟡 Medium**

Polymarket shows price change arrows and percentages (e.g., "+3¢" or "↑2%") next to each outcome. Plokymarket shows static prices with no change context.

**What's needed:**
- **Backend**: Store hourly price snapshots in a `price_history` table (`market_id`, `outcome`, `price`, `recorded_at`).
- **Frontend**: Calculate 24h price change. Show green/red arrow + delta next to price. Optional: mini sparkline (7-day) using Recharts `<Sparkline>`.

**Files to create:**
- `components/market/PriceChange.tsx`
- `app/api/markets/[id]/price-history/route.ts`

---

### Gap 9: Real Historical Price Chart (Replace Placeholder)
**Priority: 🟡 Medium**

The `MarketInfoPanel.tsx` has a "Historical Price (7-Day)" section that is currently **a static SVG mockup** with hardcoded fake paths and "Chart Data Loading..." text. This needs to be replaced with real data.

**What's needed:**
- Connect the historical chart to actual trade data from the `trades` table.
- Support timeframe switching (1D / 7D / 1M / ALL) which currently renders as non-functional badges.
- Use Recharts `<AreaChart>` consistent with `PriceChart.tsx`.

**Files to modify:**
- `components/market/MarketInfoPanel.tsx` lines 105-131 — Replace static SVG with Recharts

---

### Gap 10: Market Creator Profile Badge
**Priority: 🟢 Low-Medium**

Polymarket shows the market creator with a verified badge. Plokymarket hardcodes "Plokymarket BD" with a static "Verified" badge. This should be dynamic based on the actual `created_by` user.

**What's needed:**
- Fetch `user_profiles` data for `market.created_by` to get the creator's display name and verification status.
- Display dynamically in `MarketInfoPanel.tsx`.

**Files to modify:**
- `components/market/MarketInfoPanel.tsx` — Dynamic creator lookup

---

### Gap 11: Bet Slip / Cart System
**Priority: 🟢 Low-Medium** | **Polymarket has it: Yes**

Polymarket has a persistent "bet slip" sidebar where users can add multiple bets and submit them together. Plokymarket's `TradingPanel` handles one trade at a time.

**What's needed:**
- **State**: Global `betSlipStore` (Zustand) to hold pending bets across markets.
- **Frontend**: `BetSlip` component that slides out from the right, showing all pending bets with amounts and potential payout.
- **Batch API**: `POST /api/orders/batch` to submit multiple orders atomically.

**Files to create:**
- `store/betSlipStore.ts`
- `components/trading/BetSlip.tsx`

---

### Gap 12: Notification Badge & Bell Icon
**Priority: 🟢 Low**

Polymarket has a notification bell in the nav with unread count badges. Plokymarket has notification API routes but no visual bell/badge on the market page or navbar.

**What's needed:**
- Add bell icon to the top navigation bar with unread count badge.
- Wire to existing `GET /api/notifications` endpoint.
- Show dropdown with recent notifications on click.

**Files to create:**
- `components/layout/NotificationBell.tsx`

---

### Gap 13: SEO & Open Graph Meta Tags
**Priority: 🟢 Low**

Each market page should have dynamic Open Graph meta tags so shared links show rich previews on social media (title, description, image, price).

**What's needed:**
- Convert `app/(dashboard)/markets/[id]/page.tsx` to use `generateMetadata()` for server-side meta tags.
- Include: `og:title`, `og:description`, `og:image` (market thumbnail or auto-generated card image), `twitter:card`.

**Files to modify:**
- `app/(dashboard)/markets/[id]/page.tsx` — Add `generateMetadata()`

---

### Gap 14: Mobile-Optimized Trading Experience
**Priority: 🟢 Low**

Polymarket has a bottom sheet / sticky footer for mobile trading. Plokymarket's `TradingPanel` is in a right column that stacks below on mobile, requiring long scrolls.

**What's needed:**
- Add a mobile sticky footer bar showing current price + "Trade" button.
- On tap, open a bottom sheet / modal with the full `TradingPanel`.
- Use `@media (max-width: 1024px)` breakpoint.

**Files to create:**
- `components/trading/MobileTradingBar.tsx`
- `components/trading/TradingBottomSheet.tsx`

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Impact |
|:---|:---|:---|:---|
| 🔴 P0 | Gap 3: Activity Tab (wire existing) | 🟢 Low | 🔴 High |
| 🔴 P0 | Gap 7: Market Thumbnail | 🟢 Low | 🔴 High |
| 🔴 P0 | Gap 4: Volume Banner | 🟢 Low | 🔴 High |
| 🔴 P1 | Gap 2: Share/Bookmark Bar | 🟡 Medium | 🔴 High |
| 🔴 P1 | Gap 6: Comment Avatars/Likes | 🟡 Medium | 🟡 High |
| 🟡 P2 | Gap 5: Related Markets | 🟡 Medium | 🟡 Medium |
| 🟡 P2 | Gap 9: Real Historical Chart | 🟡 Medium | 🟡 Medium |
| 🟡 P2 | Gap 8: Price Change Indicators | 🟡 Medium | 🟡 Medium |
| 🟡 P3 | Gap 10: Dynamic Creator Badge | 🟢 Low | 🟢 Low |
| 🟡 P3 | Gap 13: SEO Meta Tags | 🟢 Low | 🟡 Medium |
| 🟠 P4 | Gap 1: Multi-Outcome Markets | 🔴 High | 🔴 High |
| 🟠 P4 | Gap 11: Bet Slip System | 🔴 High | 🟡 Medium |
| 🟠 P5 | Gap 12: Notification Bell | 🟡 Medium | 🟢 Low |
| 🟠 P5 | Gap 14: Mobile Trading UX | 🟡 Medium | 🟡 Medium |

---

## Database Schema Changes Summary

```sql
-- Gap 1: Multi-outcome markets
CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  label TEXT NOT NULL,
  image_url TEXT,
  current_price DECIMAL(10,4) DEFAULT 0.5,
  total_volume DECIMAL(18,2) DEFAULT 0,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gap 2: Bookmarks & Follows
CREATE TABLE user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE TABLE market_followers (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  notify_on_trade BOOLEAN DEFAULT false,
  notify_on_resolve BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

-- Gap 6: Comment Likes
CREATE TABLE comment_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment_id UUID NOT NULL REFERENCES comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

-- Gap 8: Price History
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  outcome TEXT NOT NULL DEFAULT 'YES',
  price DECIMAL(10,4) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_price_history_market ON price_history(market_id, recorded_at DESC);
```

---

## Recommended Implementation Order

### Phase 1 — Quick Wins (1-2 days)
1. **Gap 7**: Add market thumbnail to detail header
2. **Gap 4**: Move volume/liquidity stats to a prominent banner
3. **Gap 3**: Wire ActivityFeed into market detail page with tabs
4. **Gap 10**: Dynamic creator badge from `user_profiles`

### Phase 2 — Social Layer (3-4 days)
5. **Gap 2**: Share/Bookmark action bar + DB tables
6. **Gap 6**: Comment avatars, likes, sort tabs + DB table
7. **Gap 5**: Related Markets section

### Phase 3 — Data & Polish (3-4 days)
8. **Gap 9**: Replace fake historical chart with real data
9. **Gap 8**: Price change indicators + price_history table
10. **Gap 13**: SEO/OpenGraph meta tags

### Phase 4 — Advanced (5-7 days)
11. **Gap 1**: Multi-outcome market support
12. **Gap 11**: Bet slip/cart system
13. **Gap 14**: Mobile trading bottom sheet
14. **Gap 12**: Notification bell in navbar
