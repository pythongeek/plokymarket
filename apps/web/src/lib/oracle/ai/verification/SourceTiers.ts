/**
 * Multi-Source Verification Architecture
 * Defense-in-depth through independent source aggregation
 * Bangladesh-context aware with dynamic weighting
 */

export type SourceTier = 'primary' | 'secondary' | 'tertiary';

export interface SourceTierConfig {
  tier: SourceTier;
  minRequired: number;
  defaultWeight: number;
  maxWeight: number;
  minWeight: number;
  description: string;
}

export const SOURCE_TIER_CONFIGS: Record<SourceTier, SourceTierConfig> = {
  primary: {
    tier: 'primary',
    minRequired: 1,
    defaultWeight: 0.40,
    maxWeight: 0.50,
    minWeight: 0.30,
    description: 'Official statements, legal documents, direct measurements'
  },
  secondary: {
    tier: 'secondary',
    minRequired: 2,
    defaultWeight: 0.35,
    maxWeight: 0.40,
    minWeight: 0.25,
    description: 'Established news organizations'
  },
  tertiary: {
    tier: 'tertiary',
    minRequired: 2,
    defaultWeight: 0.25,
    maxWeight: 0.30,
    minWeight: 0.15,
    description: 'Social media consensus, expert panels, prediction markets'
  }
};

// Bangladesh-specific source tier mappings
export const BANGLADESH_SOURCE_TIERS: Record<string, SourceTier> = {
  // Primary - Government Official
  'eci.gov.bd': 'primary',
  'bb.org.bd': 'primary',
  'sec.gov.bd': 'primary',
  'dse.com.bd': 'primary',
  'cse.com.bd': 'primary',
  'bmd.gov.bd': 'primary',
  'tigercricket.com.bd': 'primary',
  'bff.com.bd': 'primary',
  'bangladesh.gov.bd': 'primary',
  'mof.gov.bd': 'primary',
  'mofa.gov.bd': 'primary',
  'cabinet.gov.bd': 'primary',
  'btrc.gov.bd': 'primary',
  'dmp.gov.bd': 'primary',
  'rab.gov.bd': 'primary',
  
  // Secondary - Established News
  'reuters.com': 'secondary',
  'bloomberg.com': 'secondary',
  'apnews.com': 'secondary',
  'afp.com': 'secondary',
  'thedailystar.net': 'secondary',
  'bdnews24.com': 'secondary',
  'dhakatribune.com': 'secondary',
  'prothomalo.com': 'secondary',
  'jugantor.com': 'secondary',
  'kalerkantho.com': 'secondary',
  'ittefaq.com.bd': 'secondary',
  'newagebd.net': 'secondary',
  'observerbd.com': 'secondary',
  'thefinancialexpress.com.bd': 'secondary',
  'theindependentbd.com': 'secondary',
  'daily-sun.com': 'secondary',
  'bbc.com': 'secondary',
  'bbc.co.uk': 'secondary',
  'aljazeera.com': 'secondary',
  
  // Tertiary - Online/Social
  'banglanews24.com': 'tertiary',
  'banglatribune.com': 'tertiary',
  'jagonews24.com': 'tertiary',
  'risingbd.com': 'tertiary',
  'somoynews.tv': 'tertiary',
  'channelionline.com': 'tertiary',
  'ekattor.tv': 'tertiary',
  'independent24.com': 'tertiary',
  'rtvonline.com': 'tertiary',
  'twitter.com': 'tertiary',
  'x.com': 'tertiary',
  'facebook.com': 'tertiary',
  'reddit.com': 'tertiary',
  'youtube.com': 'tertiary'
};

export function getSourceTier(domain: string): SourceTier {
  // Direct match
  if (BANGLADESH_SOURCE_TIERS[domain]) {
    return BANGLADESH_SOURCE_TIERS[domain];
  }
  
  // Check for subdomain matches
  for (const [sourceDomain, tier] of Object.entries(BANGLADESH_SOURCE_TIERS)) {
    if (domain.endsWith('.' + sourceDomain) || domain === sourceDomain) {
      return tier;
    }
  }
  
  // Default based on TLD and patterns
  if (domain.endsWith('.gov.bd')) return 'primary';
  if (domain.endsWith('.bd') && !domain.includes('blog') && !domain.includes('forum')) return 'secondary';
  if (domain.endsWith('.com') || domain.endsWith('.net')) return 'tertiary';
  
  return 'tertiary';
}

export interface SourceRequirementCheck {
  tier: SourceTier;
  required: number;
  actual: number;
  satisfied: boolean;
  weight: number;
}

export function checkSourceRequirements(
  sourcesByTier: Record<SourceTier, number>
): SourceRequirementCheck[] {
  return Object.entries(SOURCE_TIER_CONFIGS).map(([tier, config]) => ({
    tier: tier as SourceTier,
    required: config.minRequired,
    actual: sourcesByTier[tier as SourceTier] || 0,
    satisfied: (sourcesByTier[tier as SourceTier] || 0) >= config.minRequired,
    weight: config.defaultWeight
  }));
}

export function canAutoResolve(requirements: SourceRequirementCheck[]): boolean {
  // Need at least primary source OR 2+ secondary sources
  const primary = requirements.find(r => r.tier === 'primary');
  const secondary = requirements.find(r => r.tier === 'secondary');
  
  // Minimum requirement: 1 primary OR 2+ secondary
  const hasPrimary = primary && primary.actual >= 1;
  const hasSecondary = secondary && secondary.actual >= 2;
  
  return hasPrimary || hasSecondary;
}
