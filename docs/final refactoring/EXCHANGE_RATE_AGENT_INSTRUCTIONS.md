# 🤖 AI Agent Instructions: Exchange Rate API — Full Implementation Guide

> **Purpose:** This document gives a step-by-step, context-aware guide for an AI agent to implement a robust, scalable BDT/USDT exchange rate system. Read every section fully before writing a single line of code. Do NOT delete existing features. Do NOT break existing P2P rate logic if it already exists.

---

## 📋 PRE-FLIGHT CHECKLIST (Do This Before Any Code Changes)

Before writing any code, the agent MUST:

1. **Scan the entire codebase** for any existing exchange rate logic:
   ```
   Search for these patterns across ALL files:
   - "exchange-rate" (in file paths and imports)
   - "exchangeRate" or "exchange_rate" (variable names)
   - "bdt" or "BDT" (currency references)
   - "usdt" or "USDT" (currency references)
   - "coingecko" (existing API calls)
   - "p2p" or "P2P" (peer-to-peer rate logic)
   - "rate" near "fetch" or "api" (any rate-fetching logic)
   - "/api/exchange" (any existing route)
   ```

2. **Document what you find.** For each match, note:
   - File path
   - What the code does (fetches rate? displays rate? converts amount?)
   - Whether it is currently working or broken

3. **DO NOT overwrite or delete any existing rate logic** until you have confirmed the new implementation fully replaces it with equivalent or better behavior.

4. **Check `package.json`** to confirm what HTTP/fetch libraries are available (e.g., `axios`, native `fetch`, `node-fetch`).

5. **Check `.env.local` or `.env`** for any existing API keys (e.g., `EXCHANGE_RATE_API_KEY`, `COINGECKO_API_KEY`, `OPEN_EXCHANGE_RATES_KEY`).

---

## 🧠 UNDERSTANDING THE PROBLEM

### What We're Building
A **server-side Next.js API route** that returns the current BDT (Bangladeshi Taka) to USDT (Tether/USD) exchange rate. This rate is used in the app to:
- Convert user-entered BDT amounts to USDT equivalents
- Display live rates in the UI (e.g., "1 USDT = 120 BDT")
- Power any P2P transaction pricing logic

### Why Not Just Use CoinGecko Directly from the Frontend?
- CoinGecko's free tier has strict rate limits (10–50 calls/minute)
- Calling it from every user's browser would exhaust the rate limit instantly
- A server-side cached route means ALL users share ONE cached result, solving the rate limit problem
- It also hides API keys from the client

### The Scalability Problem With the Original Code
The original implementation stores `cachedRate` and `lastFetch` in **module-level variables**. This works in development but is **unreliable in production** because:
- Next.js/Vercel serverless functions spin up fresh instances — module variables are lost between cold starts
- Multiple instances run in parallel and each has its own cache — cache is not shared
- The cache can disappear at any moment, causing excessive API calls

### Better Scalable Solutions (in order of preference)

| Option | How It Works | Best For |
|--------|-------------|----------|
| **Next.js `revalidate` + static generation** | Cache built into Next.js fetch | Simple, no extra infra |
| **Upstash Redis** | Serverless Redis KV store, free tier available | Production apps on Vercel |
| **Vercel KV** | Vercel's built-in KV (backed by Upstash) | Apps already on Vercel |
| **Database row** (e.g., Prisma + Postgres) | Store last rate + timestamp in DB | Apps with existing DB |
| **In-memory + `revalidate`** | Original approach + Next.js fetch cache | Small apps, acceptable |

**For this implementation, we will use a two-layer approach:**
1. **Primary:** Next.js built-in `fetch` cache with `revalidate: 300` (5-minute server-side cache, handled by Next.js automatically — works across serverless instances)
2. **Fallback:** In-memory module variable cache (catches repeat calls within the same instance lifetime)
3. **Secondary source:** If CoinGecko fails, try `ExchangeRate-API` (free, no key needed for basic use)
4. **Final fallback:** Return hardcoded `120` BDT/USDT

---

## 🔧 TASK 3.2 — IMPLEMENTATION INSTRUCTIONS

### Step 1: Check if the file already exists

```
Check: src/app/api/exchange-rate/route.ts
```
- If it **exists**: Read its full content first. Note what it does. Only replace it if it is broken or missing features.
- If it **does not exist**: Create it with the code in Step 2.

---

### Step 2: Create/Replace `src/app/api/exchange-rate/route.ts`

Write this file **exactly** as shown below. Do not add extra imports or remove the fallback logic:

```typescript
import { NextResponse } from 'next/server';

// ─── Module-level in-memory cache (secondary cache layer) ────────────────────
// NOTE: This is intentionally a secondary layer. The primary cache is handled
// by Next.js fetch() revalidation (see fetchWithCache below). This module-level
// cache catches repeat requests within the same serverless function instance.
let instanceCachedRate: number | null = null;
let instanceLastFetch: number = 0;
const INSTANCE_CACHE_TTL = 60 * 1000; // 1 minute for instance-level cache

// ─── Fetch rate from CoinGecko ────────────────────────────────────────────────
// Uses Next.js built-in fetch cache (revalidate: 300 = 5 minutes).
// This cache is shared across serverless instances by the Next.js runtime.
async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=bdt',
      {
        next: { revalidate: 300 }, // Next.js caches this for 5 minutes across instances
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[exchange-rate] CoinGecko responded with status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Validate the response shape before trusting it
    const rate = data?.tether?.bdt;
    if (typeof rate !== 'number' || rate <= 0 || rate > 99999) {
      console.warn('[exchange-rate] CoinGecko returned unexpected rate value:', rate);
      return null;
    }

    return rate;
  } catch (err) {
    console.error('[exchange-rate] CoinGecko fetch failed:', err);
    return null;
  }
}

// ─── Fallback: Fetch rate from ExchangeRate-API (free, no key required) ───────
// Uses USD as proxy for USDT. Not perfectly accurate for USDT specifically,
// but serves as a reliable fallback when CoinGecko is unavailable.
async function fetchFromExchangeRateAPI(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      {
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const rate = data?.rates?.BDT;

    if (typeof rate !== 'number' || rate <= 0) return null;

    return rate;
  } catch (err) {
    console.error('[exchange-rate] ExchangeRate-API fetch failed:', err);
    return null;
  }
}

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    // Layer 1: Check instance-level memory cache
    if (
      instanceCachedRate !== null &&
      (now - instanceLastFetch) < INSTANCE_CACHE_TTL
    ) {
      return NextResponse.json({
        rate: instanceCachedRate,
        source: 'instance_cache',
        updated_at: new Date(instanceLastFetch).toISOString(),
      });
    }

    // Layer 2: Try CoinGecko (Next.js fetch cache handles 5-min server caching)
    let rate = await fetchFromCoinGecko();
    let source = 'coingecko';

    // Layer 3: Try ExchangeRate-API if CoinGecko failed
    if (rate === null) {
      rate = await fetchFromExchangeRateAPI();
      source = 'exchangerate_api';
    }

    // Layer 4: Hard fallback
    if (rate === null) {
      rate = 120;
      source = 'fallback';
    }

    // Update instance cache
    instanceCachedRate = rate;
    instanceLastFetch = now;

    return NextResponse.json({
      rate,
      source,
      updated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[exchange-rate] Unexpected error in GET handler:', error);

    // Always return something — never let a rate API crash the user experience
    return NextResponse.json(
      {
        rate: instanceCachedRate ?? 120,
        source: 'error_fallback',
        updated_at: new Date().toISOString(),
      },
      { status: 200 } // Return 200 even on error so client-side doesn't crash
    );
  }
}
```

---

### Step 3: Create/Update the Client-Side Rate Hook

**Check if this file exists:** `src/hooks/useExchangeRate.ts` (or similar path like `hooks/useExchangeRate.tsx`)

If it doesn't exist, create it. If it does exist, read it first — only update it if it is broken or missing the functionality below:

```typescript
// src/hooks/useExchangeRate.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rate: number;
  source: string;
  updated_at: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
const FALLBACK_RATE = 120;

export function useExchangeRate(): ExchangeRateData {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [source, setSource] = useState<string>('initializing');
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchRate = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (typeof data.rate === 'number' && data.rate > 0) {
        setRate(data.rate);
        setSource(data.source ?? 'unknown');
        setUpdatedAt(data.updated_at ?? new Date().toISOString());
      } else {
        throw new Error('Invalid rate in response');
      }
    } catch (err) {
      console.error('[useExchangeRate] Failed to fetch rate:', err);
      setIsError(true);
      // Keep whatever rate we had before (or fallback) — don't reset to 0
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return {
    rate,
    source,
    updated_at: updatedAt,
    isLoading,
    isError,
    refetch: fetchRate,
  };
}
```

---

### Step 4: Create a Rate Display UI Component

**Check if a rate display component already exists** (search for components containing "BDT", "USDT", "rate" in their JSX). If one exists and works, add the live rate data to it. If none exists, create:

```typescript
// src/components/ExchangeRateBadge.tsx
'use client';

import { useExchangeRate } from '@/hooks/useExchangeRate';

export function ExchangeRateBadge() {
  const { rate, isLoading, isError, source } = useExchangeRate();

  if (isLoading) {
    return (
      <span className="text-xs text-gray-400 animate-pulse">
        Loading rate...
      </span>
    );
  }

  return (
    <span
      className={`text-xs font-medium ${isError ? 'text-yellow-500' : 'text-green-500'}`}
      title={`Source: ${source}`}
    >
      1 USDT ≈ {rate.toFixed(2)} BDT
      {isError && ' (estimated)'}
    </span>
  );
}
```

**Where to use this component:** Search the codebase for any of these and add `<ExchangeRateBadge />` near them:
- P2P transaction forms
- Buy/Sell pages
- Dashboard/wallet pages showing BDT or USDT balances
- Any input where user enters BDT or USDT amount

---

### Step 5: Create a Conversion Utility (if it doesn't exist)

**Check:** Search for any existing `convertBDT`, `toUSDT`, `toTaka` utility functions. If they exist, do not duplicate them — just ensure they use the rate from the API. If none exist, create:

```typescript
// src/lib/currency.ts

/**
 * Convert BDT amount to USDT using the current exchange rate.
 * @param bdt - Amount in Bangladeshi Taka
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in USDT, rounded to 6 decimal places
 */
export function bdtToUsdt(bdt: number, rate: number): number {
  if (rate <= 0) throw new Error('Exchange rate must be positive');
  return parseFloat((bdt / rate).toFixed(6));
}

/**
 * Convert USDT amount to BDT using the current exchange rate.
 * @param usdt - Amount in USDT
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in BDT, rounded to 2 decimal places
 */
export function usdtToBdt(usdt: number, rate: number): number {
  if (rate <= 0) throw new Error('Exchange rate must be positive');
  return parseFloat((usdt * rate).toFixed(2));
}
```

---

## ⚠️ CRITICAL RULES FOR THE AGENT

1. **DO NOT delete the P2P rate logic** if it already exists. The P2P rate is a user-negotiated or platform-set rate for peer-to-peer trades — it is DIFFERENT from the market rate this API provides. Both can coexist: the market rate provides a reference/display price, while the P2P rate governs actual transaction pricing.

2. **DO NOT add `'use client'` to the API route file** (`route.ts`). API routes are always server-side.

3. **DO NOT call the external APIs (CoinGecko, ExchangeRate-API) directly from client components.** Always go through `/api/exchange-rate`.

4. **DO NOT remove the fallback rate of `120`.** It ensures the app doesn't crash when external APIs are down.

5. **If the file `src/app/api/exchange-rate/route.ts` already exists and works correctly**, do not replace it — only add the missing fallback source and validate that both cache layers are present.

6. **Test the API route** by running `curl http://localhost:3000/api/exchange-rate` after implementation and confirm you receive a JSON response with `rate`, `source`, and `updated_at` fields.

7. **If TypeScript errors appear**, do not suppress them with `// @ts-ignore`. Fix them properly.

8. **If ESLint errors appear** about unused variables (e.g., `error` in catch block), rename to `_error` or use `void error` — do not disable the lint rule globally.

---

## 🧪 VERIFICATION STEPS

After implementation, verify all of the following:

- [ ] `GET /api/exchange-rate` returns `{ rate: number, source: string, updated_at: string }` with HTTP 200
- [ ] Calling the endpoint twice within 1 minute returns `source: "instance_cache"` on second call
- [ ] If CoinGecko is unreachable (test by temporarily pointing to a bad URL), the fallback source kicks in
- [ ] The `useExchangeRate` hook renders without console errors
- [ ] `ExchangeRateBadge` shows a non-zero rate in the UI
- [ ] Existing P2P rate functionality still works as before
- [ ] No TypeScript compilation errors (`npx tsc --noEmit`)
- [ ] No new ESLint errors (`npx eslint src/`)

---

## 📁 FILES MODIFIED/CREATED BY THIS TASK

| File | Action | Notes |
|------|--------|-------|
| `src/app/api/exchange-rate/route.ts` | Create or Replace | Core API route |
| `src/hooks/useExchangeRate.ts` | Create or Update | Client hook |
| `src/components/ExchangeRateBadge.tsx` | Create (if missing) | Display component |
| `src/lib/currency.ts` | Create (if missing) | Utility functions |

---

## 🔗 WHERE TO DISPLAY THE RATE IN THE UI

Search for these page/component patterns and add the `<ExchangeRateBadge />` or inline rate display:

1. **P2P Trade Pages** — Show "Market Rate: 1 USDT ≈ {rate} BDT" near the price input so users can see if a P2P offer is above or below market
2. **Wallet/Dashboard** — Show conversion for any BDT or USDT balance displayed
3. **Buy/Sell Forms** — Show live rate next to amount inputs so users can understand conversion before submitting
4. **Transaction History** — If historical rates are stored, display the rate at time of transaction

---

*End of instructions. Agent should now have full context to implement without guessing.*
