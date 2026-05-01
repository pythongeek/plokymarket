# API Rate Limiting and Abuse Protection

This document describes the rate limiting and abuse protection system implemented for Plokymarket.

## Overview

The system uses **Upstash Redis** for distributed rate limiting across all serverless instances. It provides:

- **Sliding window rate limiting** - More accurate than fixed windows
- **Multiple rate limit tiers** - Different limits for different endpoint sensitivity
- **IP-based and user-based limiting** - Both anonymous and authenticated
- **Abuse detection** - Automatic IP blocking for suspicious patterns
- **Standard headers** - RFC-compliant rate limit headers

## Architecture

### Core Files

- `src/lib/upstash/rateLimit.ts` - Core rate limiting implementation
- `src/lib/api-protection.ts` - Route protection utilities
- `src/middleware.ts` - Edge middleware with auth rate limiting

### Rate Limit Tiers

| Tier | Requests | Window | Use Case |
|------|----------|--------|----------|
| `STRICT` | 5 | 60s | Login, auth, sensitive ops |
| `STANDARD` | 30 | 60s | General API endpoints |
| `LENIENT` | 100 | 60s | Read-heavy endpoints |
| `CRITICAL` | 3 | 60s | Withdrawals, high-risk ops |

### Special Rate Limits

| Type | Limit | Window | Description |
|------|-------|--------|-------------|
| Trading | 5 | 10s | Per market per user |
| Withdrawal | 3 | 1 hour | Per user |
| Auth attempts | 5 | 15 min | Per IP |

## Usage

### 1. Middleware (Automatic)

The `middleware.ts` automatically applies rate limiting to:
- Auth portal (`/auth-portal-3m5n8`) - 5 attempts per 15 minutes per IP

### 2. API Routes (Manual)

Add rate limiting to API routes by importing the rate limit functions:

```typescript
import { checkTradingRateLimit, addRateLimitHeaders } from '@/lib/upstash/rateLimit';

// In your route handler:
const tradingResult = await checkTradingRateLimit(user.id, market_id);

if (!tradingResult.allowed) {
  return addRateLimitHeaders(
    NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
    tradingResult
  );
}
```

### 3. Route Protection Wrappers

Use the protection utilities for cleaner code:

```typescript
import { withTradingProtection, withWithdrawalProtection } from '@/lib/api-protection';

// Trading routes
const result = await withTradingProtection(request, userId, marketId, async () => {
  // Your handler code
  return NextResponse.json({ success: true });
});

// Withdrawal routes
const result = await withWithdrawalProtection(request, userId, async () => {
  // Your handler code
  return NextResponse.json({ success: true });
});
```

## Response Headers

All rate-limited responses include:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests allowed |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |
| `Retry-After` | Seconds to wait (only on 429) |

## Abuse Detection

The system automatically tracks:

1. **Failed attempts** - Records failed attempts per IP
2. **Abuse scoring** - Increments score on failures, decrements on success
3. **Auto-blocking** - Blocks IP for 1 hour if score exceeds 50

### Blocked Response

```json
{
  "error": "Access denied. Please try again later.",
  "code": "IP_BLOCKED"
}
```

## Redis Keys

| Pattern | Description | TTL |
|---------|-------------|-----|
| `ratelimit:auth:{ip}` | Auth attempts | 15 min |
| `ratelimit:strict:{identifier}` | Strict tier | 60 sec |
| `ratelimit:std:{identifier}` | Standard tier | 60 sec |
| `ratelimit:trading:{userId}:{marketId}` | Trading | 10 sec |
| `ratelimit:withdrawal:{userId}` | Withdrawals | 1 hour |
| `abuse:failed:{ip}` | Failed attempts | 1 hour |
| `abuse:score:{ip}` | Abuse score | 24 hours |
| `abuse:blocked:{ip}` | Blocked IPs | 1 hour |

## Protected Routes

The following routes have rate limiting implemented:

- `POST /api/orders` - Trading (5 trades/market/10s)
- `POST /api/withdrawals/request` - Withdrawals (3/hour)
- `POST /api/deposits/request` - Deposits (5/hour)
- Auth portal - Login attempts (5/15min)

## Configuration

Environment variables required:
- `UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL`
- `UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN`

## Fail-Open Design

If Redis is unavailable, the system **fails open** (allows requests) to maintain availability. This is intentional for a trading platform where downtime could cause financial loss.

## Future Enhancements

1. Add rate limiting to more API endpoints
2. Implement per-user global rate limits
3. Add admin dashboard for abuse monitoring
4. Implement distributed circuit breaker pattern
5. Add webhook notifications for abuse events
