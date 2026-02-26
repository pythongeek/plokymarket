/**
 * Risk & Compliance Agent
 * - Bangladesh Cyber Security Law compliance
 * - Platform Terms of Service verification
 * - Political sensitivity detection
 * - Gambling policy adherence
 */

import { RiskAssessmentResult, AgentContext } from './types';
import { executeWithFailover } from './provider-switcher';

// Bangladesh Cyber Security Law 2023 keywords
const CYBER_SECURITY_VIOLATIONS = [
  // Defamation
  'মানহানি', 'defamation', 'কুৎসা', 'অপপ্রচার',
  // State security
  'রাষ্ট্রদ্রোহ', 'sedition', 'বিদ্রোহ', 'সন্ত্রাসবাদ', 'terrorism',
  // Illegal content
  'অশ্লীল', 'pornography', 'যৌন', 'sexual', 'child abuse',
  // Hate speech
  'ধর্মীয় বিদ্বেষ', 'religious hatred', 'জাতিগত বিদ্বেষ', 'racism',
  // Fake news
  'গুজব', 'rumor', 'মিথ্যা সংবাদ', 'fake news',
];

// Political sensitivity keywords
const POLITICAL_SENSITIVITY_KEYWORDS = [
  'সরকার বিরোধী', 'anti-government',
  'বিদেশী হস্তক্ষেপ', 'foreign intervention',
  'সামরিক অভ্যুত্থান', 'military coup',
  'গণঅভ্যুত্থান', 'revolution',
  'সংবিধান পরিবর্তন', 'constitutional change',
];

// Gambling policy (allowed vs not allowed)
const GAMBLING_VIOLATIONS = [
  'ক্যাসিনো', 'casino',
  'লটারি', 'lottery',
  'জুয়া', 'gambling',
  'বাজি', 'betting', // Note: prediction markets are different from betting
  'পাচার', 'trafficking',
];

// Platform specific restrictions
const PLATFORM_RESTRICTIONS = {
  minTitleLength: 10,
  maxTitleLength: 200,
  minOutcomes: 2,
  maxOutcomes: 10,
  forbiddenCategories: ['Adult', 'Illegal Drugs', 'Weapons'],
};

/**
 * Check Bangladesh Cyber Security Law compliance
 */
function checkCyberSecurityLaw(title: string, description: string): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const combinedText = `${title} ${description}`.toLowerCase();
  
  for (const keyword of CYBER_SECURITY_VIOLATIONS) {
    if (combinedText.includes(keyword.toLowerCase())) {
      violations.push(`Potential violation: ${keyword}`);
    }
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Check political sensitivity
 */
function checkPoliticalSensitivity(title: string): {
  isSensitive: boolean;
  level: 'low' | 'medium' | 'high';
  keywords: string[];
} {
  const foundKeywords: string[] = [];
  const normalizedTitle = title.toLowerCase();
  
  for (const keyword of POLITICAL_SENSITIVITY_KEYWORDS) {
    if (normalizedTitle.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }
  
  const isSensitive = foundKeywords.length > 0;
  let level: 'low' | 'medium' | 'high' = 'low';
  
  if (foundKeywords.length >= 3) {
    level = 'high';
  } else if (foundKeywords.length >= 1) {
    level = 'medium';
  }
  
  return { isSensitive, level, keywords: foundKeywords };
}

/**
 * Check gambling policy
 */
function checkGamblingPolicy(title: string, category: string): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const normalizedTitle = title.toLowerCase();
  
  // Check for explicit gambling terms
  for (const keyword of GAMBLING_VIOLATIONS) {
    if (normalizedTitle.includes(keyword.toLowerCase())) {
      issues.push(`Contains gambling term: ${keyword}`);
    }
  }
  
  // Check if it's a pure luck-based game (not skill-based prediction)
  const luckBasedTerms = ['লটারি', 'lottery', 'random', 'randomly', 'দৈব'];
  for (const term of luckBasedTerms) {
    if (normalizedTitle.includes(term.toLowerCase())) {
      issues.push(`Appears to be luck-based: ${term}`);
    }
  }
  
  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Check Terms of Service compliance
 */
function checkTermsOfService(
  title: string,
  description: string,
  outcomes: string[]
): {
  compliant: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Title length check
  if (title.length < PLATFORM_RESTRICTIONS.minTitleLength) {
    violations.push(`Title too short (min ${PLATFORM_RESTRICTIONS.minTitleLength} chars)`);
  }
  if (title.length > PLATFORM_RESTRICTIONS.maxTitleLength) {
    violations.push(`Title too long (max ${PLATFORM_RESTRICTIONS.maxTitleLength} chars)`);
  }
  
  // Outcomes check
  if (!outcomes || outcomes.length < PLATFORM_RESTRICTIONS.minOutcomes) {
    violations.push(`Need at least ${PLATFORM_RESTRICTIONS.minOutcomes} outcomes`);
  }
  if (outcomes && outcomes.length > PLATFORM_RESTRICTIONS.maxOutcomes) {
    violations.push(`Too many outcomes (max ${PLATFORM_RESTRICTIONS.maxOutcomes})`);
  }
  
  // Duplicate outcomes check
  if (outcomes) {
    const uniqueOutcomes = new Set(outcomes.map(o => o.toLowerCase().trim()));
    if (uniqueOutcomes.size !== outcomes.length) {
      violations.push('Duplicate outcomes detected');
    }
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  };
}

/**
 * Calculate risk score (0-100, higher = riskier)
 */
function calculateRiskScore(
  cyberSecurity: { passed: boolean; violations: string[] },
  political: { isSensitive: boolean; level: string },
  gambling: { compliant: boolean; issues: string[] },
  tos: { compliant: boolean; violations: string[] }
): number {
  let score = 0;
  
  // Cyber security violations (highest weight)
  score += cyberSecurity.violations.length * 25;
  
  // Political sensitivity
  if (political.level === 'high') score += 30;
  else if (political.level === 'medium') score += 15;
  
  // Gambling issues
  score += gambling.issues.length * 20;
  
  // ToS violations
  score += tos.violations.length * 10;
  
  return Math.min(100, score);
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  cyberSecurity: { violations: string[] },
  political: { isSensitive: boolean; level: string },
  gambling: { issues: string[] },
  tos: { violations: string[] }
): string[] {
  const recommendations: string[] = [];
  
  if (cyberSecurity.violations.length > 0) {
    recommendations.push('Review content for potential legal violations');
    recommendations.push('Ensure no defamatory or harmful content');
  }
  
  if (political.isSensitive) {
    recommendations.push('Consider adding disclaimer for political sensitivity');
    recommendations.push('Ensure balanced representation of viewpoints');
  }
  
  if (gambling.issues.length > 0) {
    recommendations.push('Clarify this is a prediction market, not gambling');
    recommendations.push('Emphasize skill-based analysis');
  }
  
  if (tos.violations.length > 0) {
    recommendations.push('Fix Terms of Service violations before publishing');
  }
  
  return recommendations;
}

/**
 * Rule-based risk assessment
 */
function assessRiskRuleBased(context: AgentContext): RiskAssessmentResult {
  const title = context.title || '';
  const description = context.description || '';
  const category = context.category || 'Other';
  const outcomes = context.outcomes || [];
  
  // Run all checks
  const cyberSecurity = checkCyberSecurityLaw(title, description);
  const political = checkPoliticalSensitivity(title);
  const gambling = checkGamblingPolicy(title, category);
  const tos = checkTermsOfService(title, description, outcomes);
  
  // Calculate overall risk
  const riskScore = calculateRiskScore(cyberSecurity, political, gambling, tos);
  
  // Determine if safe (score < 30 is considered safe)
  const isSafe = riskScore < 30;
  
  // Collect all violations
  const violations = [
    ...cyberSecurity.violations,
    ...gambling.issues,
    ...tos.violations,
  ];
  
  return {
    isSafe,
    riskScore,
    violations,
    recommendations: generateRecommendations(cyberSecurity, political, gambling, tos),
    policyChecks: {
      cyberSecurityLaw: cyberSecurity.passed,
      termsOfService: tos.compliant,
      gamblingPolicy: gambling.compliant,
      politicalSensitivity: !political.isSensitive,
    },
    confidence: 0.75,
  };
}

/**
 * Vertex AI risk assessment (SERVER-SIDE ONLY)
 */
async function assessWithVertexAI(context: AgentContext): Promise<RiskAssessmentResult> {
  const response = await fetch('/api/ai/vertex-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'risk',
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Vertex AI API call failed');
  }

  const data = await response.json();
  return {
    ...data.result,
    confidence: 0.9,
  };
}

/**
 * Kimi API risk assessment
 */
async function assessWithKimi(context: AgentContext): Promise<RiskAssessmentResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        {
          role: 'system',
          content: 'You assess compliance risk for Bangladesh prediction markets.',
        },
        {
          role: 'user',
          content: `Assess this event:
Title: "${context.title}"
Description: "${context.description || ''}"

Return JSON:
{
  "isSafe": true,
  "riskScore": 10,
  "violations": [],
  "recommendations": [],
  "policyChecks": {
    "cyberSecurityLaw": true,
    "termsOfService": true,
    "gamblingPolicy": true,
    "politicalSensitivity": true
  }
}`,
        },
      ],
      temperature: 0.1,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    isSafe: parsed.isSafe,
    riskScore: parsed.riskScore,
    violations: parsed.violations,
    recommendations: parsed.recommendations,
    policyChecks: parsed.policyChecks,
    confidence: 0.85,
  };
}

/**
 * Main Risk Agent
 */
export async function runRiskAgent(
  context: AgentContext
): Promise<RiskAssessmentResult> {
  console.log('[RiskAgent] Assessing risk for:', context.title);
  
  const { result, provider } = await executeWithFailover(
    () => assessWithVertexAI(context),
    () => assessWithKimi(context),
    () => assessRiskRuleBased(context)
  );
  
  console.log(`[RiskAgent] Completed using ${provider}, Risk Score: ${result.riskScore}`);
  
  return result;
}

/**
 * Quick risk check (for real-time feedback)
 */
export function quickRiskCheck(title: string): {
  isSafe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const normalized = title.toLowerCase();
  
  // Check for high-risk keywords
  const highRiskKeywords = [
    ...CYBER_SECURITY_VIOLATIONS.slice(0, 5), // First 5 are highest risk
    ...POLITICAL_SENSITIVITY_KEYWORDS.slice(0, 3),
  ];
  
  const mediumRiskKeywords = [
    ...CYBER_SECURITY_VIOLATIONS.slice(5),
    ...POLITICAL_SENSITIVITY_KEYWORDS.slice(3),
  ];
  
  for (const keyword of highRiskKeywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { isSafe: false, riskLevel: 'high' };
    }
  }
  
  for (const keyword of mediumRiskKeywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { isSafe: true, riskLevel: 'medium' };
    }
  }
  
  return { isSafe: true, riskLevel: 'low' };
}

/**
 * Get safety badge color
 */
export function getSafetyBadgeColor(riskScore: number): string {
  if (riskScore < 20) return 'green';
  if (riskScore < 50) return 'yellow';
  if (riskScore < 75) return 'orange';
  return 'red';
}
