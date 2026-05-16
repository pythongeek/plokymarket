/**
 * Feature Flags — Soft Launch Control
 * Disable non-essential features for initial production launch.
 */

export const FEATURE_FLAGS = {
  // DISABLED for soft launch
  AI_EVENT_CREATION: false,
  SOCIAL_FEED: false,
  GAMIFICATION: false,
  ADVANCED_ANALYTICS: false,

  // ENABLED for soft launch
  TRADING: true,
  DEPOSIT: true,
  WITHDRAWAL: true,
  KYC: true,
  BASIC_MARKETS: true,
  ORDER_MATCHING: true,
  MARKET_RESOLUTION: true,
  ADMIN_DASHBOARD: true,
  NOTIFICATIONS: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

export function assertEnabled(flag: FeatureFlag): void {
  if (!isEnabled(flag)) {
    throw new Error(`Feature ${flag} is disabled for soft launch`);
  }
}
