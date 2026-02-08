/**
 * Payout, Burn & Multi-Outcome Markets - Public API
 */

// Payout Engine
export {
  PayoutEngine,
  getGlobalPayoutEngine,
  type MarketType,
  type DistributionOption,
  type Position,
  type ResolutionData,
  type PayoutCalculation
} from './PayoutEngine';

// Token Burn
export {
  TokenBurnManager,
  getGlobalTokenBurnManager,
  type BurnType,
  type BurnStatus,
  type BurnEvent,
  type ExpirationSweepConfig,
  DEFAULT_SWEEP_CONFIG
} from './TokenBurn';

// Multi-Outcome Markets
export {
  CategoricalMarketManager,
  ScalarMarketManager,
  MultiOutcomeMarketFactory,
  getGlobalMultiOutcomeFactory,
  type CategoricalMarketConfig,
  type CategoricalMarketValidation,
  type ScalarMarketConfig,
  type ScalarPosition
} from '../markets/MultiOutcomeMarkets';
