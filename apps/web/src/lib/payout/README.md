# Payout, Burn & Multi-Outcome System

Complete implementation of winner payouts, loser token burns, and multi-outcome market support for Polymarket Bangladesh.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYOUT ENGINE                               │
├─────────────────────────────────────────────────────────────────┤
│  Binary: shares × $1.00 (winner-take-all)                      │
│  Categorical: shares × $1.00 (single winner from 2-20)         │
│  Scalar: shares × $1.00 × normalized_value                     │
│          where normalized = (resolved - lower) / (upper - lower)│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │  FEES    │   │   TAX    │   │DISTRIBUTE│
        │  2% cap  │   │  NBR/VAT │   │imm/reinvest
        │  $100    │   │  BDT 50K │   │   /hold  │
        └──────────┘   └──────────┘   └──────────┘
```

## Token Burn Mechanics

### Logical Burn
- Marks tokens invalid in contract state
- Prevents confusion for users
- Reclaims storage space

### Physical Burn  
- Transfers to burn address: `0x0000...dEaD`
- Public transparency on blockchain
- Total supply tracking

### Expiration Sweep
- 90-day grace period before sweep
- 0.5% fee to treasury
- 99.5% burned to dead address

## Multi-Outcome Markets

### Categorical Markets
- 2-20 discrete outcomes
- Must be mutually exclusive
- Should be exhaustive ("Other" option)
- Price normalization: Σ prices = $1.00

### Scalar Markets
- Continuous range [lower, upper]
- Long position: (resolved - lower) / range
- Short position: 1 - longValue
- Bounds adjustable pre-trading
- Post-trading changes require 67% vote

## Tax Compliance

### Bangladesh (NBR)
- Reporting required for >BDT 50,000 annual
- 5% VAT on platform fees
- Cost basis tracking for capital gains

### International
- US: Form 1099-MISC equivalent for >$600
- Withholding per tax treaties
- Multi-currency support

## Database Schema

See `supabase/migrations/024_payout_multioutcome.sql`

Key tables:
- `payout_calculations` - Payout records with tax data
- `burn_events` - Token burn tracking
- `categorical_markets` - Multi-outcome configuration
- `scalar_markets` - Range bounds and resolution
- `lp_positions` - Liquidity provider tracking
