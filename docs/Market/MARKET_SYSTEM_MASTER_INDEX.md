# 🏗️ PLOKYMARKET — COMPLETE MARKET SYSTEM ARCHITECTURE
## Master Index & Integration Guide
### Version 2.0 — Beyond Polymarket Standard

---

## 📋 DOCUMENT SET

| Document | Description |
|---|---|
| **This file** | Master index, event sync map, dependency graph |
| `PHASE1_FRONTEND_ARCHITECTURE.md` | All UI components, hooks, stores, mobile UX |
| `PHASE2_BACKEND_ARCHITECTURE.md` | DB migrations, API routes, cron jobs, AI routing |

---

## 🔗 EVENT SYSTEM → MARKET SYSTEM SYNC MAP

```
┌─────────────────────────────────────────────────────────────────┐
│              EXISTING ADMIN PANEL (DO NOT MODIFY)               │
│                                                                 │
│  EventCreationPanel.tsx  ──→  EventCreationPanelWithPreview.tsx │
│         │                             │                         │
│         ▼                             ▼                         │
│  AI Agents (Vertex + Kimi)    Live Preview Component            │
│         │                                                       │
│         ▼                                                       │
│  /api/ai/event-workflow   ←→   /api/ai/vertex-generate          │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase Database (EXISTING)                │  │
│  │  events (id, name, question, category, status, ...)     │  │
│  │  markets (id, event_id, yes_price, no_price, ...)       │  │
│  │  orders / trades / positions / wallets / transactions   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Reads from same tables
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NEW MARKET SYSTEM (ADDITIVE)                   │
│                                                                 │
│  Market Detail Page (enhanced)                                  │
│  ├── MarketThumbnail          (reads: markets.image_url)        │
│  ├── MarketStatsBanner        (reads: trades, positions)        │
│  ├── MarketActions            (reads/writes: bookmarks, follows)│
│  ├── ActivityFeed (wired)     (reads: trades, activity_feed)    │
│  ├── MultiOutcomeList         (reads: outcomes)                 │
│  ├── PriceChangeIndicator     (reads: price_history)            │
│  ├── RelatedMarkets           (reads: markets by category)      │
│  └── NotificationBell         (reads: notifications)            │
│                                                                 │
│  NEW TABLES (additive, no existing table modified):             │
│  outcomes / user_bookmarks / market_followers / comment_likes   │
│  price_history / market_daily_stats / notifications / order_batches│
│                                                                 │
│  NEW API ROUTES:                                                │
│  /api/markets/[id]/bookmark   /api/markets/[id]/follow          │
│  /api/markets/[id]/stats      /api/markets/[id]/related         │
│  /api/markets/[id]/outcomes   /api/markets/[id]/price-history   │
│  /api/orders/batch            /api/comments/[id]/like           │
│  /api/notifications           /api/cron/price-snapshot          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI ROTATION SYSTEM — INTELLIGENCE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTELLIGENT AI ROUTER                        │
│                  (Existing rotation + New logic)                │
│                                                                 │
│  Mode: AUTO (default) — selects mode based on provider health  │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐│
│  │  COMBINE MODE   │    │  RACE MODE                          ││
│  │  (High accuracy)│    │  (Speed critical)                   ││
│  │                 │    │                                     ││
│  │ Vertex ──┐      │    │ Vertex ─────────────────→ First     ││
│  │          ├──→ 🏆│    │                             wins     ││
│  │ Kimi ────┘      │    │ Kimi ───────────────────→           ││
│  │ (highest conf.) │    │                                     ││
│  └─────────────────┘    └─────────────────────────────────────┘│
│                                                                 │
│  HEALTH MONITORING:                                             │
│  ┌──────────────────────────────────────────┐                  │
│  │ Vertex: ████████░░ 80%  Latency: 1.2s   │                  │
│  │ Kimi:   █████████░ 90%  Latency: 0.8s   │                  │
│  │ Auto-degrading: Switch if health < 30%   │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                 │
│  CONFIDENCE THRESHOLD:                                          │
│  ≥ 85% → Auto-approve event creation                           │
│  60-84% → Queue for admin review                               │
│  < 60%  → Reject + retry with alternate provider               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 FEATURES vs POLYMARKET COMPARISON

| Feature | Polymarket | Plokymarket v1 | Plokymarket v2 (This Plan) |
|---|---|---|---|
| Binary YES/NO markets | ✅ | ✅ Working | ✅ Enhanced |
| Multi-outcome markets | ✅ | ❌ Missing | ✅ **Added** |
| Price chart (real-time) | ✅ | ✅ Working | ✅ Enhanced |
| Order book | ✅ | ✅ Working | ✅ Keep |
| CLOB matching engine | ✅ | ✅ Working | ✅ Keep |
| Activity/trade feed | ✅ | ✅ Built, not wired | ✅ **Wired to page** |
| Comment section | ✅ | ✅ Working | ✅ Enhanced (avatars, likes) |
| Share / Bookmark | ✅ | ❌ Missing | ✅ **Added** |
| Follow market | ✅ | ❌ Missing | ✅ **Added** |
| Volume / liquidity banner | ✅ | ❌ Missing | ✅ **Added** |
| Related markets | ✅ | ❌ Missing | ✅ **Added** |
| Market thumbnail | ✅ | ❌ Missing | ✅ **Added** |
| Price change indicators | ✅ | ❌ Missing | ✅ **Added** |
| Historical chart (real data) | ✅ | ⚠️ Static SVG | ✅ **Real data** |
| Bet slip / cart | ✅ | ❌ Missing | ✅ **Added** |
| Mobile bottom sheet | ✅ | ❌ Missing | ✅ **Added** |
| Notification system | ✅ | ⚠️ API only | ✅ **Full UI** |
| SEO / Open Graph | ✅ | ❌ Missing | ✅ **Added** |
| AI-powered event creation | ❌ | ✅ Working | ✅ Enhanced |
| Dual AI provider rotation | ❌ | ⚠️ Basic | ✅ **Intelligent** |
| Bangladesh-specific UX | ❌ | ✅ Working | ✅ Enhanced |
| BDT payments (bKash/Nagad) | ❌ | ✅ Working | ✅ Keep |
| Bangla language support | ❌ | ✅ Working | ✅ Keep |
| Hourly price snapshots | ❌ | ❌ Missing | ✅ **Added (cron)** |
| Closing-soon notifications | ❌ | ❌ Missing | ✅ **Added (cron)** |
| Batch order submission | ❌ | ❌ Missing | ✅ **Added** |
| Admin audit logging | ❌ | ✅ Working | ✅ Keep |

**Plokymarket v2 surpasses Polymarket in:** AI event creation, dual-provider AI routing, local payment methods, Bangla language, batch orders, and closing-soon notifications.

---

## ⚡ MIGRATION ORDER (SAFE — NEVER BREAKS EXISTING)

```
Step 1: Apply DB migrations (001 → 002 → 003 → 004 → 005)
        ↳ All additive. No existing column/table is dropped or modified.

Step 2: Deploy new API routes (no routes replaced, only added)
        ↳ /api/markets/[id]/bookmark, follow, stats, related, outcomes, price-history
        ↳ /api/orders/batch
        ↳ /api/comments/[id]/like
        ↳ /api/notifications, /api/notifications/mark-read

Step 3: Add vercel.json cron entries
        ↳ /api/cron/price-snapshot (hourly)
        ↳ /api/cron/market-close-check (every 15 min)

Step 4: Deploy Phase 1 frontend components (additive)
        ↳ New components only. Existing EventCreationPanel etc. untouched.

Step 5: EXTEND (not replace) existing pages:
        ↳ market [id]/page.tsx — add thumbnail, stats banner, tabs, actions
        ↳ Navbar.tsx — add NotificationBell

Step 6: Add new Zustand stores (betSlipStore, notificationStore, aiProviderStore)

Step 7: Deploy to Vercel
```

---

## 🔐 SAFETY GUARANTEES

- **Zero file deletions** without user approval
- **Zero breaking schema changes** — all SQL is additive (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`)
- **Zero API route replacements** — new routes only, existing routes untouched
- **Existing event creation pipeline fully preserved** — EventCreationPanel, AI agents, Vertex/Kimi rotation all kept exactly as-is
- **RLS on all new tables** — no data leaks between users
- **Admin-only mutations** — outcomes, market resolution protected

---

*Generated: February 26, 2026 — Plokymarket v2 Market System Architecture*
