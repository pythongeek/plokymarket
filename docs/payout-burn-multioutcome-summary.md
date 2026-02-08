# Payout, Token Burn & Multi-Outcome Markets - Implementation Summary

## Overview
Complete implementation of the payout system, token burn mechanics, and multi-outcome market support for Polymarket Bangladesh prediction market.

## 1. Payout Engine (`apps/web/src/lib/payout/PayoutEngine.ts`)

### Features
- **Binary Markets**: `winningShares × $1.00` (winner-take-all)
- **Categorical Markets**: `winningShares × $1.00` (single winner from 2-20 outcomes)
- **Scalar Markets**: `positionShares × $1.00 × normalized_value`
  - Long value: `(resolved - lower) / (upper - lower)`
  - Short value: `1 - longValue`

### Distribution Options
1. **Immediate**: Direct USDC/BDT transfer
2. **Reinvest**: Credit to platform balance
3. **Hold**: User-initiated redemption later

### Tax Compliance
- **Bangladesh NBR**: Reporting for >BDT 50,000, 5% VAT on fees
- **US**: Form 1099-MISC equivalent for >$600 annual
- Cost basis tracking for capital gains

### Fees
- Platform fee: 2% (capped at $100)
- Creator fee: 0.5%
- Batch processing for gas efficiency

---

## 2. Token Burn Mechanics (`apps/web/src/lib/payout/TokenBurn.ts`)

### Logical Burn
- Marks tokens invalid in contract state
- Prevents user confusion
- Reclaims storage space

### Physical Burn
- Transfers to burn address: `0x000000000000000000000000000000000000dEaD`
- Public transparency on blockchain
- Full supply tracking

### Expiration Sweep
- **Grace period**: 90 days after market resolution
- **Treasury fee**: 0.5% of unredeemed tokens
- **Burn amount**: 99.5% burned to dead address
- Automatic daily sweeps for expired markets

### Events & Transparency
- All burns recorded in database
- Blockchain transaction hashes stored
- Event emission for indexing/analytics

---

## 3. Multi-Outcome Markets (`apps/web/src/lib/markets/MultiOutcomeMarkets.ts`)

### Categorical Markets
- **Outcome range**: 2-20 discrete outcomes
- **Validation**:
  - Must be mutually exclusive (detects overlaps)
  - Should be exhaustive (warns if missing "Other")
  - Minimum liquidity: 1,000 BDT
- **Price normalization**: Arbitrage-enforced Σ = $1.00
- **Resolution**: Single winner-take-all

### Scalar Markets
- **Continuous range**: [lowerBound, upperBound]
- **Position types**: Long (bullish) / Short (bearish)
- **Value calculation**: Linear interpolation
- **Bounds management**:
  - Pre-trading: Creator adjustable
  - Post-trading: Requires 67% LP vote
- **Liquidity incentive**: Concentrated LP rewards (1.5x near current price)

---

## 4. Database Schema (`supabase/migrations/024_payout_multioutcome.sql`)

### Tables Created

| Table | Purpose |
|-------|---------|
| `payout_calculations` | All payout records with tax documentation |
| `burn_events` | Token burn tracking (logical & physical) |
| `categorical_markets` | Multi-outcome configuration (2-20 outcomes) |
| `scalar_markets` | Range bounds, resolution values |
| `lp_positions` | Liquidity provider tracking |
| `bounds_proposals` | Post-trading bounds change votes |
| `bounds_votes` | Individual votes on bounds changes |
| `treasury_transfers` | Sweep fees and platform revenue |

### Functions
- `update_bounds_votes()` - Aggregate voting on scalar bounds
- `get_market_total_shares()` - Calculate total market liquidity
- `credit_user_balance()` - Handle reinvestment credits
- `lock_creator_liquidity()` - Lock initial market liquidity

---

## 5. Bangladesh-Specific Features

### Validation
- Detects overlapping political outcomes (Awami League, BNP, Jamaat)
- Checks for media ownership conflicts (Transcom, East West Media, Impress Group)
- Ensures objective resolution criteria

### Tax Integration
- NBR reporting threshold tracking
- VAT calculation on platform fees
- BDT currency support for local payouts

---

## 6. Usage Examples

### Calculate Binary Payout
```typescript
import { PayoutEngine } from '@/lib/payout';

const engine = new PayoutEngine();
const calculation = engine.calculatePayout({
  marketType: 'binary',
  position: {
    userId: 'user-123',
    marketId: 'market-456',
    outcome: 'yes',
    shares: new Decimal(100),
    costBasis: new Decimal(60),
    acquiredAt: new Date('2026-01-01')
  },
  resolution: {
    outcome: 'yes',
    resolvedAt: new Date()
  },
  distributionOption: 'immediate',
  userCountry: 'BD'
});

// Result:
// grossPayout: 100 (100 shares × $1.00)
// platformFee: 2 (2%)
// netPayout: 98
// nbrReporting: false (under 50,000 BDT)
```

### Burn Losing Tokens
```typescript
import { getGlobalTokenBurnManager } from '@/lib/payout';

const burnManager = getGlobalTokenBurnManager();

// After market resolution
await burnManager.burnLosingTokens(
  'market-456', 
  'yes'  // winning outcome
);

// Schedule automatic sweeps
burnManager.startAutomaticSweeps();
```

### Create Categorical Market
```typescript
import { getGlobalMultiOutcomeFactory } from '@/lib/payout';

const factory = getGlobalMultiOutcomeFactory();

const result = await factory.categorical.createMarket({
  type: 'categorical',
  outcomes: ['Awami League', 'BNP', 'Jamaat', 'Other'],
  minLiquidity: 5000,
  creatorAddress: '0x...'
});
```

### Create Scalar Market
```typescript
const result = await factory.scalar.createMarket({
  type: 'scalar',
  lowerBound: 0,
  upperBound: 100,
  unit: '%',
  creatorAddress: '0x...'
});
```

---

## 7. Build Status

```
✓ Compiled successfully
✓ Generated static pages (24/24)
⚠ Expected warnings:
  - Supabase credentials not configured (static generation)
  - /activity route dynamic server usage (cookies for auth)
```

---

## 8. Integration Points

### With Oracle System
- Settlement triggers burn of losing tokens
- Resolution data feeds into payout calculations
- Dispute resolution can void payouts

### With Settlement Pipeline
- Stage 3: Redemption activation enables claims
- Stage 4: Auto-settlement processes batch payouts
- Stage 5: Confirmation tracking for blockchain

### With User Interface
- Portfolio shows redeemable positions
- Tax forms generated annually
- Notifications for bound changes

---

## Files Created/Modified

```
apps/web/src/lib/payout/
├── PayoutEngine.ts          # Core payout calculations
├── TokenBurn.ts             # Burn mechanics
├── README.md                # Documentation
└── index.ts                 # Public API exports

apps/web/src/lib/markets/
└── MultiOutcomeMarkets.ts   # Categorical & Scalar markets

supabase/migrations/
└── 024_payout_multioutcome.sql  # Database schema

docs/
└── payout-burn-multioutcome-summary.md  # This file
```

---

## Next Steps

1. **Frontend Integration**: Add redemption UI, portfolio views
2. **Blockchain Integration**: Connect physical burns to smart contracts
3. **Tax Reporting**: Generate annual tax forms (NBR + international)
4. **Analytics Dashboard**: Burn statistics, payout tracking
5. **Testing**: Unit tests for all calculation formulas
