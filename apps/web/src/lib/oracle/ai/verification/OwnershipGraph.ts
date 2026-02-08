/**
 * Source Ownership Graph
 * Detects common-source failures through ownership analysis
 * Prevents verification collapse when sources share common parent
 */

export interface OwnershipNode {
  id: string;
  name: string;
  type: 'parent_company' | 'media_group' | 'government' | 'independent';
  country?: string;
  subsidiaries: string[];
  parentId?: string;
}

export interface SourceIndependenceResult {
  sourceA: string;
  sourceB: string;
  areIndependent: boolean;
  commonOwner?: string;
  independenceScore: number; // 0-1, 1 = fully independent
  relationshipPath: string[];
}

// Bangladesh Media Ownership Structure
const OWNERSHIP_GRAPH: Record<string, OwnershipNode> = {
  // Government entities
  'gov_bangladesh': {
    id: 'gov_bangladesh',
    name: 'Government of Bangladesh',
    type: 'government',
    country: 'Bangladesh',
    subsidiaries: [
      'eci.gov.bd', 'bb.org.bd', 'sec.gov.bd', 'dse.com.bd', 'cse.com.bd',
      'bmd.gov.bd', 'tigercricket.com.bd', 'bff.com.bd', 'bangladesh.gov.bd',
      'mof.gov.bd', 'mofa.gov.bd', 'cabinet.gov.bd', 'btrc.gov.bd'
    ]
  },
  
  // Transcom Group
  'transcom_group': {
    id: 'transcom_group',
    name: 'Transcom Group',
    type: 'parent_company',
    country: 'Bangladesh',
    subsidiaries: ['prothomalo.com', 'abcradio.fm']
  },
  
  // East West Media Group
  'ewmg': {
    id: 'ewmg',
    name: 'East West Media Group',
    type: 'media_group',
    country: 'Bangladesh',
    subsidiaries: ['banglatribune.com', 'banglanews24.com', 'news24bd.tv']
  },
  
  // Impress Group
  'impress_group': {
    id: 'impress_group',
    name: 'Impress Group',
    type: 'media_group',
    country: 'Bangladesh',
    subsidiaries: ['thedailystar.net', 'channeli.tv']
  },
  
  // BEXIMCO
  'beximco': {
    id: 'beximco',
    name: 'BEXIMCO Group',
    type: 'parent_company',
    country: 'Bangladesh',
    subsidiaries: ['independent24.com', 'independenttv.com']
  },
  
  // IPDC
  'ipdc': {
    id: 'ipdc',
    name: 'IPDC Finance',
    type: 'parent_company',
    country: 'Bangladesh',
    subsidiaries: ['somoynews.tv']
  },
  
  // International
  'reuters': {
    id: 'reuters',
    name: 'Thomson Reuters',
    type: 'parent_company',
    country: 'Canada/UK',
    subsidiaries: ['reuters.com']
  },
  
  'bloomberg': {
    id: 'bloomberg',
    name: 'Bloomberg LP',
    type: 'parent_company',
    country: 'USA',
    subsidiaries: ['bloomberg.com']
  },
  
  'bbc': {
    id: 'bbc',
    name: 'British Broadcasting Corporation',
    type: 'parent_company',
    country: 'UK',
    subsidiaries: ['bbc.com', 'bbc.co.uk']
  },
  
  'al_jazeera': {
    id: 'al_jazeera',
    name: 'Al Jazeera Media Network',
    type: 'parent_company',
    country: 'Qatar',
    subsidiaries: ['aljazeera.com']
  },
  
  'ap': {
    id: 'ap',
    name: 'Associated Press',
    type: 'parent_company',
    country: 'USA',
    subsidiaries: ['apnews.com']
  },
  
  'afp': {
    id: 'afp',
    name: 'Agence France-Presse',
    type: 'parent_company',
    country: 'France',
    subsidiaries: ['afp.com']
  }
};

// Reverse mapping from domain to owner
function buildDomainToOwnerMap(): Map<string, string> {
  const map = new Map<string, string>();
  
  for (const [ownerId, node] of Object.entries(OWNERSHIP_GRAPH)) {
    for (const domain of node.subsidiaries) {
      map.set(domain, ownerId);
      // Also add www. variant
      map.set('www.' + domain, ownerId);
    }
  }
  
  return map;
}

const DOMAIN_TO_OWNER = buildDomainToOwnerMap();

export class OwnershipAnalyzer {
  private domainToOwner: Map<string, string>;
  
  constructor() {
    this.domainToOwner = buildDomainToOwnerMap();
  }

  /**
   * Find the ultimate parent company of a domain
   */
  findOwner(domain: string): string | undefined {
    // Normalize domain
    const normalized = domain.toLowerCase().replace(/^www\./, '');
    
    // Direct lookup
    if (this.domainToOwner.has(normalized)) {
      return this.domainToOwner.get(normalized);
    }
    
    // Check for parent domain
    const parts = normalized.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      if (this.domainToOwner.has(parentDomain)) {
        return this.domainToOwner.get(parentDomain);
      }
    }
    
    return undefined;
  }

  /**
   * Check if two sources are independent
   */
  checkIndependence(sourceA: string, sourceB: string): SourceIndependenceResult {
    const ownerA = this.findOwner(sourceA);
    const ownerB = this.findOwner(sourceB);
    
    // If either has no known owner, assume independent (conservative)
    if (!ownerA || !ownerB) {
      return {
        sourceA,
        sourceB,
        areIndependent: true,
        independenceScore: 0.8,
        relationshipPath: []
      };
    }
    
    // Same owner - not independent
    if (ownerA === ownerB) {
      const owner = OWNERSHIP_GRAPH[ownerA];
      return {
        sourceA,
        sourceB,
        areIndependent: false,
        commonOwner: owner?.name || ownerA,
        independenceScore: 0.0,
        relationshipPath: [sourceA, ownerA, sourceB]
      };
    }
    
    // Check for government group
    const isGovA = ownerA === 'gov_bangladesh';
    const isGovB = ownerB === 'gov_bangladesh';
    
    // Government sources are independent from each other for different ministries
    // but share common government context
    if (isGovA && isGovB) {
      return {
        sourceA,
        sourceB,
        areIndependent: true, // Different ministries = independent
        independenceScore: 0.85,
        relationshipPath: [sourceA, 'gov_bangladesh', sourceB]
      };
    }
    
    // Completely independent
    return {
      sourceA,
      sourceB,
      areIndependent: true,
      independenceScore: 1.0,
      relationshipPath: []
    };
  }

  /**
   * Find all sources sharing common ownership with given domain
   */
  findRelatedSources(domain: string): string[] {
    const owner = this.findOwner(domain);
    if (!owner) return [];
    
    const ownerNode = OWNERSHIP_GRAPH[owner];
    if (!ownerNode) return [];
    
    return ownerNode.subsidiaries.filter(d => d !== domain);
  }

  /**
   * Get independence score for a set of sources
   * Returns 1.0 if all sources are independent
   */
  calculateSetIndependence(domains: string[]): {
    independenceScore: number;
    independentPairs: number;
    totalPairs: number;
    conflicts: Array<{ sources: [string, string]; commonOwner: string }>;
  } {
    const conflicts: Array<{ sources: [string, string]; commonOwner: string }> = [];
    let independentPairs = 0;
    let totalPairs = 0;
    
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        totalPairs++;
        const result = this.checkIndependence(domains[i], domains[j]);
        
        if (result.areIndependent) {
          independentPairs++;
        } else {
          conflicts.push({
            sources: [domains[i], domains[j]],
            commonOwner: result.commonOwner!
          });
        }
      }
    }
    
    const independenceScore = totalPairs > 0 ? independentPairs / totalPairs : 1.0;
    
    return {
      independenceScore,
      independentPairs,
      totalPairs,
      conflicts
    };
  }

  /**
   * Filter sources to ensure minimum independence
   * Returns subset of sources that are maximally independent
   */
  selectIndependentSources(
    domains: string[],
    minIndependenceScore: number = 0.8
  ): {
    selected: string[];
    excluded: string[];
    independenceScore: number;
  } {
    if (domains.length <= 1) {
      return { selected: domains, excluded: [], independenceScore: 1.0 };
    }
    
    // Group by owner
    const ownerGroups = new Map<string, string[]>();
    for (const domain of domains) {
      const owner = this.findOwner(domain) || 'independent_' + domain;
      if (!ownerGroups.has(owner)) {
        ownerGroups.set(owner, []);
      }
      ownerGroups.get(owner)!.push(domain);
    }
    
    // Select one from each group (prefer higher authority within group)
    const selected: string[] = [];
    const excluded: string[] = [];
    
    for (const [owner, groupDomains] of ownerGroups) {
      // Select first (assumed highest authority from ranking)
      selected.push(groupDomains[0]);
      // Exclude others
      excluded.push(...groupDomains.slice(1));
    }
    
    const result = this.calculateSetIndependence(selected);
    
    return {
      selected,
      excluded,
      independenceScore: result.independenceScore
    };
  }

  /**
   * Check if sources meet independence requirements for auto-resolution
   */
  meetsIndependenceRequirements(
    domains: string[],
    minIndependentSources: number = 2
  ): {
    meets: boolean;
    independentCount: number;
    reason?: string;
  } {
    const analysis = this.calculateSetIndependence(domains);
    
    // Count unique owners (independent sources)
    const owners = new Set<string>();
    for (const domain of domains) {
      const owner = this.findOwner(domain) || domain;
      owners.add(owner);
    }
    
    if (owners.size >= minIndependentSources && analysis.independenceScore >= 0.8) {
      return {
        meets: true,
        independentCount: owners.size
      };
    }
    
    return {
      meets: false,
      independentCount: owners.size,
      reason: `Only ${owners.size} independent source(s) found (need ${minIndependentSources})`
    };
  }
}

// Singleton instance
let globalOwnershipAnalyzer: OwnershipAnalyzer | null = null;

export function getGlobalOwnershipAnalyzer(): OwnershipAnalyzer {
  if (!globalOwnershipAnalyzer) {
    globalOwnershipAnalyzer = new OwnershipAnalyzer();
  }
  return globalOwnershipAnalyzer;
}
