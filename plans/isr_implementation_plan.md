# ISR Implementation Plan for Homepage

## Current Architecture

The homepage (`apps/web/src/app/page.tsx`) currently uses:
- `'use client'` directive - fully client-side rendering
- `useEffect` for data fetching on mount
- Every page load triggers Supabase database calls
- No caching layer

**Problem**: High TTFB (Time To First Byte), unnecessary database load for cached content

## Proposed Architecture

### Strategy: Hybrid ISR with Client Hydration

```
┌─────────────────────────────────────────────────────────┐
│                    Server-Side                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  page.tsx (Server Component)                     │   │
│  │  - Fetches initial market data (ISR: 60s)        │   │
│  │  - Passes data to client component               │   │
│  │  - Returns cached HTML immediately                │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Suspense Boundary                               │   │
│  │  - Streaming UI with skeleton                    │   │
│  │  - Hydrates client interactivity                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Create Server Component for Data Fetching

Create `apps/web/src/app/page-server.tsx`:
```typescript
// Server Component with ISR
import { createClient } from '@/lib/supabase/server';
import { MarketGridClient } from './MarketGridClient';

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function HomePageServer() {
  const supabase = createClient();
  
  // Fetch initial markets (no auth required for public data)
  const { data: markets } = await supabase
    .from('events')
    .select(`
      id, title, question, category, tags,
      yes_price, no_price, total_volume,
      trading_closes_at, created_at, status
    `)
    .eq('status', 'active')
    .order('total_volume', { ascending: false })
    .limit(12);

  return <MarketGridClient initialMarkets={markets || []} />;
}
```

### 2. Create Client Component for Interactivity

Create `apps/web/src/app/market-grid-client.tsx`:
```typescript
'use client';

// Client-side interactivity: filtering, sorting, search, pagination
// Receives initialMarkets from server component
// Uses SWR or React Query for client-side caching
```

### 3. Configure Revalidation

Options for revalidation:
- **60 seconds** for most markets
- **30 seconds** for trending/high-volume markets
- **On-demand** via `revalidatePath()` after market updates

### 4. API Route Enhancement

Enhance `/api/events/route.ts` to support caching:
```typescript
export const dynamic = 'force-static';
export const revalidate = 60;

export async function GET(request: Request) {
  // Cache-friendly response headers
  // Cache-Control: public, s-maxage=60, stale-while-revalidate=300
}
```

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| TTFB | ~500-1000ms | ~50-100ms |
| Database calls/page load | 1-2 | 0 (cached) |
| Cache hit ratio | 0% | ~90% |

## Files to Create/Modify

1. **Create**: `apps/web/src/app/page-server.tsx` (Server component)
2. **Modify**: `apps/web/src/app/page.tsx` → `MarketGridClient` (Client component)
3. **Create**: `apps/web/src/app/market-grid-client.tsx`
4. **Modify**: `/api/events/route.ts` (Add caching headers)
5. **Modify**: `layout.tsx` (Add Suspense boundary if needed)

## Risk Assessment

- **Personalized content**: "For You" recommendations require user auth
  - **Solution**: Show public trending first, then hydrate personalized content client-side
- **Real-time updates**: Stock prices change frequently
  - **Solution**: Use WebSocket/SSE for live updates, ISR for base data
- **Filter/sort state**: Lost on server render
  - **Solution**: URL params for shareable filter state

## Next Steps

1. ✅ Create architecture plan
2. ⬜ Implement server component
3. ⬜ Implement client component
4. ⬜ Add API caching
5. ⬜ Test locally
6. ⬜ Deploy to Vercel
7. ⬜ Monitor cache performance
