# Fix Instructions — 3 Bugs Fixed

## Bug 1 · "column 'outcomes' of relation 'markets' does not exist"

**Root cause:** The `create_event_with_markets` RPC function (migration 123) tried to
`INSERT INTO markets (... outcomes ...)` but `outcomes` is a **separate table**, not a
column on `markets`.

**Fix:** Run the SQL migration, then deploy the updated API route.

---

## Step-by-step instructions

### 1. Run the SQL migration in Supabase SQL Editor

> Supabase Dashboard → SQL Editor → New query → paste the file below → Run

```
migrations/125_fix_event_creation_and_markets_fetch.sql
```

This migration does 4 things:
- ✅ Replaces `create_event_with_markets` function (removes the bad `outcomes` column reference)
- ✅ Creates `custom_categories` table + pre-populates 25 Bangladesh-specific categories
- ✅ Removes RLS status filter so ALL markets/events are visible
- ✅ Adds `get_all_categories()` helper function

---

### 2. Replace the event creation API route

Copy:
```
app/api/admin/events/create/route.ts  →  your-project/app/api/admin/events/create/route.ts
```

---

### 3. Add the shared categories config

Copy:
```
lib/config/categories.ts  →  your-project/lib/config/categories.ts
```

---

### 4. Replace the event creation page

Copy:
```
app/(dashboard)/sys-cmd-7x9k2/events/create/page.tsx
→  your-project/app/(dashboard)/sys-cmd-7x9k2/events/create/page.tsx
```

The new page includes:
- All 25 categories (Sports, Cricket, BPL, Politics, Economy, Crypto, etc.)
- **"+ Custom" button** next to the category dropdown — lets you type a brand new category
- Custom categories are saved to the `custom_categories` table and appear in the dropdown on next load
- AI Oracle config section (keywords, sources, confidence threshold) only shows when AI Oracle method is selected

---

### 5. Replace the useMarkets hook

Copy:
```
hooks/useMarkets.ts  →  your-project/hooks/useMarkets.ts   (or hooks/useMarkets.tsx)
```

The new hook:
- Fetches from `events` table first, falls back to `markets` table
- **No status filter** — all events returned regardless of `active/pending/draft/resolved`
- Exports `useAdminMarkets()` for admin pages that need everything including cancelled events

---

## What you should see after applying

| Issue | Before | After |
|-------|--------|-------|
| Event creation error | `Transaction failed: column "outcomes"…` | ✅ Creates event successfully |
| Market listing | Only shows `active` status events | ✅ Shows all events |
| Category dropdown | ~5 categories | ✅ 25 categories |
| Custom category | No way to add new one | ✅ "+ Custom" button + saved to DB |

---

## Categories added

Sports · Cricket · Football · BPL · Politics · Bangladesh Politics · Election ·
Economy · Stock Market · Crypto · Technology · Entertainment · Bollywood ·
Dhallywood · World Events · Science · Culture · Business · Education ·
Health · Environment · Infrastructure · Dhaka City · International · General
