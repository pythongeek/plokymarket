/**
 * Synthesis Agent - Bangladesh Context
 * Evaluates source credibility, detects contradictions
 * Specialized for Bangladesh political, economic, and social context
 */

import { 
  EvidenceCorpus, 
  EvidenceSource,
  SynthesisAgentOutput,
  AgentAPIResponse 
} from '../types';

interface ContradictionDetection {
  sourceA: string;
  sourceB: string;
  contradiction: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

interface SourceCredibilityAnalysis {
  sourceId: string;
  originalScore: number;
  adjustedScore: number;
  factors: string[];
  warnings: string[];
}

// Bangladesh political context
const BANGLADESH_POLITICAL_CONTEXT = {
  majorParties: ['awami league', 'bnp', 'bangladesh nationalist party', 'jamaat'],
  keyFigures: ['sheikh hasina', 'tarique rahman', 'mirza fakhrul', 'obaedul quader'],
  sensitiveTopics: ['1971', 'war crimes', 'genocide', 'independence', 'pakistan'],
  electionTerms: ['votes', 'seats', 'majority', 'coalition', 'jatiya oikya front']
};

// Bangladesh economic indicators
const BANGLADESH_ECONOMIC_INDICATORS = [
  'gdp', 'growth rate', 'inflation', 'cpi', 'foreign reserve', 'remittance',
  'export', 'import', 'trade deficit', 'budget deficit', 'fiscal year'
];

export class SynthesisAgent {
  private name = 'SynthesisAgent';
  private version = '2.0.0-bd';
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Main execution: Synthesize evidence into probabilistic assessment
   */
  async execute(
    marketQuestion: string,
    corpus: EvidenceCorpus,
    context?: any
  ): Promise<AgentAPIResponse<SynthesisAgentOutput>> {
    const startTime = Date.now();
    
    try {
      // 1. Analyze each source's credibility with Bangladesh context
      const credibilityAnalysis = this.analyzeSourceCredibility(corpus.sources, marketQuestion);
      
      // 2. Detect contradictions with Bangladesh-specific patterns
      const contradictions = this.detectContradictions(corpus.sources, marketQuestion);
      
      // 3. Check for Bangladesh political bias indicators
      const biasIndicators = this.detectPoliticalBias(corpus.sources, marketQuestion);
      
      // 4. Generate probabilistic assessment
      const assessment = await this.generateProbabilisticAssessment(
        marketQuestion,
        corpus,
        credibilityAnalysis,
        contradictions,
        biasIndicators
      );
      
      const output: SynthesisAgentOutput = {
        agentType: 'synthesis',
        probabilisticAssessment: assessment,
        contradictions,
        credibilityAnalysis: credibilityAnalysis.map(a => ({
          sourceId: a.sourceId,
          factors: a.factors,
          adjustedScore: a.adjustedScore
        })),
        modelVersion: this.version,
        executionTimeMs: Date.now() - startTime
      };
      
      return {
        success: true,
        data: output,
        latencyMs: Date.now() - startTime,
        modelVersion: this.version
      };
      
    } catch (error) {
      console.error(`[${this.name}] Execution failed:`, error);
      return {
        success: false,
        error: {
          code: 'SYNTHESIS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
        },
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze source credibility with Bangladesh-specific factors
   */
  private analyzeSourceCredibility(sources: EvidenceSource[], question: string): SourceCredibilityAnalysis[] {
    const questionLower = question.toLowerCase();
    const isPolitical = BANGLADESH_POLITICAL_CONTEXT.majorParties.some(p => 
      questionLower.includes(p.toLowerCase())
    );
    
    return sources.map(source => {
      const factors: string[] = [];
      const warnings: string[] = [];
      let adjustedScore = source.credibilityScore;
      const domain = source.url.toLowerCase();
      
      // Factor 1: Bangladesh Government sources (highest for official matters)
      if (domain.includes('.gov.bd')) {
        factors.push('Official Bangladesh Government source');
        adjustedScore += 0.08;
        
        // Extra boost for Election Commission on election topics
        if (domain.includes('eci.gov.bd') && questionLower.includes('election')) {
          factors.push('Primary authority for election results');
          adjustedScore += 0.05;
        }
        
        // Extra boost for Bangladesh Bank on financial topics
        if (domain.includes('bb.org.bd') && questionLower.includes('taka')) {
          factors.push('Primary authority for monetary policy');
          adjustedScore += 0.05;
        }
      }
      
      // Factor 2: Major Bangladesh news outlets credibility
      if (domain.includes('prothomalo.com') || domain.includes('thedailystar.net') || 
          domain.includes('bdnews24.com')) {
        factors.push('Tier-1 Bangladesh media outlet');
        adjustedScore += 0.03;
      }
      
      // Factor 3: Political bias detection for political questions
      if (isPolitical) {
        const contentLower = source.content.toLowerCase();
        
        // Check for partisan language
        const hasPartisanLanguage = this.detectPartisanLanguage(contentLower);
        if (hasPartisanLanguage) {
          warnings.push('Potential partisan language detected');
          adjustedScore -= 0.1;
        }
        
        // Check for balance in reporting
        const mentionsMultipleParties = 
          BANGLADESH_POLITICAL_CONTEXT.majorParties.filter(p => 
            contentLower.includes(p.toLowerCase())
          ).length >= 2;
        
        if (mentionsMultipleParties) {
          factors.push('Mentions multiple political parties (balanced reporting)');
          adjustedScore += 0.03;
        }
      }
      
      // Factor 4: Content freshness (critical for Bangladesh breaking news)
      const published = new Date(source.publishedAt);
      const hoursAgo = (Date.now() - published.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) {
        factors.push('Breaking news (within 6h)');
        adjustedScore += 0.03;
      } else if (hoursAgo > 72) { // 3 days
        warnings.push('Content older than 3 days');
        adjustedScore -= 0.03;
      }
      
      // Factor 5: Bengali language content for local context
      if (/[\u0980-\u09FF]/.test(source.content)) {
        factors.push('Original Bengali language content');
        adjustedScore += 0.02;
      }
      
      // Factor 6: Content quality signals
      if (source.content.length > 500) {
        factors.push('Detailed reporting');
        adjustedScore += 0.02;
      }
      
      // Factor 7: Cross-reference with other sources
      const similarSources = sources.filter(s => 
        s.id !== source.id && 
        this.calculateContentSimilarity(s.content, source.content) > 0.5
      );
      if (similarSources.length > 0) {
        factors.push(`Corroborated by ${similarSources.length} similar sources`);
        adjustedScore += 0.03 * Math.min(similarSources.length, 3);
      }
      
      return {
        sourceId: source.id,
        originalScore: source.credibilityScore,
        adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
        factors,
        warnings
      };
    });
  }

  /**
   * Detect partisan language in content
   */
  private detectPartisanLanguage(content: string): boolean {
    const partisanTerms = [
      'dictator', 'fascist', 'corrupt', 'thief', 'murderer',
      'হত্যাকারী', 'দুর্নীতিবাজ', 'স্বৈরাচার', 'জালিয়াত'
    ];
    
    return partisanTerms.some(term => content.includes(term));
  }

  /**
   * Detect political bias across sources
   */
  private detectPoliticalBias(sources: EvidenceSource[], question: string): {
    hasBiasIndicators: boolean;
    dominantNarrative?: string;
    conflictingNarratives: boolean;
  } {
    const questionLower = question.toLowerCase();
    
    // Check if political question
    const isPolitical = BANGLADESH_POLITICAL_CONTEXT.majorParties.some(p => 
      questionLower.includes(p.toLowerCase())
    ) || BANGLADESH_POLITICAL_CONTEXT.keyFigures.some(f => 
      questionLower.includes(f.toLowerCase())
    );
    
    if (!isPolitical) {
      return { hasBiasIndicators: false, conflictingNarratives: false };
    }
    
    // Analyze source alignment
    const sourceAlignments = sources.map(source => {
      const content = source.content.toLowerCase();
      const proAwami = content.includes('development') && content.includes('sheikh hasina');
      const proBnp = content.includes('democracy') && content.includes('khaleda zia');
      
      if (proAwami) return 'awami';
      if (proBnp) return 'bnp';
      return 'neutral';
    });
    
    const hasAwami = sourceAlignments.includes('awami');
    const hasBnp = sourceAlignments.includes('bnp');
    
    return {
      hasBiasIndicators: hasAwami || hasBnp,
      conflictingNarratives: hasAwami && hasBnp
    };
  }

  /**
   * Detect contradictions between sources
   */
  private detectContradictions(
    sources: EvidenceSource[],
    question: string
  ): ContradictionDetection[] {
    const contradictions: ContradictionDetection[] = [];
    const questionLower = question.toLowerCase();
    
    // Only check high-credibility sources
    const highCredSources = sources.filter(s => s.credibilityScore > 0.7);
    
    for (let i = 0; i < highCredSources.length; i++) {
      for (let j = i + 1; j < highCredSources.length; j++) {
        const sourceA = highCredSources[i];
        const sourceB = highCredSources[j];
        
        const contradiction = this.findContradiction(sourceA, sourceB, questionLower);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }
    
    return contradictions;
  }

  /**
   * Find specific contradiction between two sources
   */
  private findContradiction(
    sourceA: EvidenceSource,
    sourceB: EvidenceSource,
    question: string
  ): ContradictionDetection | null {
    const contentA = sourceA.content.toLowerCase();
    const contentB = sourceB.content.toLowerCase();
    
    // Pattern 1: Opposite binary outcomes
    const yesPattern = /\b(yes|confirmed|approved|won|victory|success|হবে|জিতবে)\b/;
    const noPattern = /\b(no|denied|rejected|lost|defeat|failed|হবে না|হারবে)\b/;
    
    const aSaysYes = yesPattern.test(contentA) && !noPattern.test(contentA);
    const aSaysNo = noPattern.test(contentA) && !yesPattern.test(contentA);
    const bSaysYes = yesPattern.test(contentB) && !noPattern.test(contentB);
    const bSaysNo = noPattern.test(contentB) && !yesPattern.test(contentB);
    
    if ((aSaysYes && bSaysNo) || (aSaysNo && bSaysYes)) {
      return {
        sourceA: sourceA.id,
        sourceB: sourceB.id,
        contradiction: `Opposite outcomes: "${aSaysYes ? 'Yes/Win' : 'No/Loss'}" vs "${bSaysYes ? 'Yes/Win' : 'No/Loss'}"`,
        severity: 'high',
        confidence: 0.85
      };
    }
    
    // Pattern 2: Election result contradictions
    if (question.includes('election') || question.includes('seat')) {
      const seatPattern = /(\d+)\s+seats?/;
      const seatsA = contentA.match(seatPattern);
      const seatsB = contentB.match(seatPattern);
      
      if (seatsA && seatsB) {
        const numA = parseInt(seatsA[1]);
        const numB = parseInt(seatsB[1]);
        
        if (Math.abs(numA - numB) > 5) {
          return {
            sourceA: sourceA.id,
            sourceB: sourceB.id,
            contradiction: `Seat count discrepancy: ${numA} vs ${numB}`,
            severity: 'high',
            confidence: 0.8
          };
        }
      }
    }
    
    // Pattern 3: Economic data contradictions
    if (BANGLADESH_ECONOMIC_INDICATORS.some(ind => question.includes(ind))) {
      const percentPattern = /(\d+\.?\d*)%?\s*(percent|percentage|%)/;
      const pctA = contentA.match(percentPattern);
      const pctB = contentB.match(percentPattern);
      
      if (pctA && pctB) {
        const numA = parseFloat(pctA[1]);
        const numB = parseFloat(pctB[1]);
        
        if (Math.abs(numA - numB) > 1) {
          return {
            sourceA: sourceA.id,
            sourceB: sourceB.id,
            contradiction: `Economic indicator discrepancy: ${numA}% vs ${numB}%`,
            severity: 'medium',
            confidence: 0.75
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Generate probabilistic assessment using LLM with Bangladesh context
   */
  private async generateProbabilisticAssessment(
    question: string,
    corpus: EvidenceCorpus,
    credibilityAnalysis: SourceCredibilityAnalysis[],
    contradictions: ContradictionDetection[],
    biasIndicators: { hasBiasIndicators: boolean; conflictingNarratives: boolean }
  ): Promise<{
    outcome: string;
    probability: number;
    confidenceInterval: [number, number];
  }> {
    const topSources = corpus.sources
      .slice(0, 5)
      .map(s => {
        const analysis = credibilityAnalysis.find(a => a.sourceId === s.id);
        return {
          title: s.title,
          content: s.content.substring(0, 300),
          credibility: analysis?.adjustedScore || s.credibilityScore,
          type: s.sourceType,
          isGovernment: s.url.includes('.gov.bd')
        };
      });
    
    const prompt = this.buildAssessmentPrompt(question, topSources, contradictions, biasIndicators);
    
    if (!this.apiKey) {
      return this.ruleBasedAssessment(corpus, contradictions);
    }
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          outcome: result.outcome || 'UNCERTAIN',
          probability: Math.max(0, Math.min(1, result.probability || 0.5)),
          confidenceInterval: result.confidenceInterval || [0.3, 0.7]
        };
      }
      
      throw new Error('Could not parse LLM response');
      
    } catch (error) {
      console.warn('[SynthesisAgent] LLM call failed, using rule-based fallback:', error);
      return this.ruleBasedAssessment(corpus, contradictions);
    }
  }

  /**
   * Build assessment prompt with Bangladesh context
   */
  private buildAssessmentPrompt(
    question: string,
    sources: any[],
    contradictions: ContradictionDetection[],
    biasIndicators: { hasBiasIndicators: boolean; conflictingNarratives: boolean }
  ): string {
    return `
You are an expert fact-checking AI specializing in Bangladesh affairs. Analyze the following evidence carefully.

MARKET QUESTION: "${question}"

EVIDENCE SOURCES:
${sources.map((s, i) => `
[Source ${i + 1}] ${s.isGovernment ? '🏛️ GOVERNMENT' : ''} Credibility: ${(s.credibility * 100).toFixed(0)}%
Title: ${s.title}
Content: ${s.content}
`).join('\n')}

${contradictions.length > 0 ? `
CONTRADICTIONS DETECTED:
${contradictions.map(c => `- ${c.severity.toUpperCase()}: ${c.contradiction}`).join('\n')}
` : ''}

${biasIndicators.conflictingNarratives ? '⚠️ WARNING: Conflicting political narratives detected across sources' : ''}

TASK:
1. Determine the most likely outcome (YES, NO, or UNCERTAIN)
2. Consider Bangladesh government sources as authoritative for official matters
3. Account for potential political bias in media reporting
4. Assign a probability (0.0 to 1.0)
5. Provide confidence interval [lower, upper]

Respond in JSON format:
{
  "outcome": "YES|NO|UNCERTAIN",
  "probability": 0.85,
  "confidenceInterval": [0.75, 0.95],
  "reasoning": "brief explanation in English"
}
`;
  }

  /**
   * Rule-based fallback assessment
   */
  private ruleBasedAssessment(
    corpus: EvidenceCorpus,
    contradictions: ContradictionDetection[]
  ): { outcome: string; probability: number; confidenceInterval: [number, number] } {
    let yesWeight = 0;
    let noWeight = 0;
    let totalWeight = 0;
    
    for (const source of corpus.sources.slice(0, 10)) {
      const content = source.content.toLowerCase();
      const weight = source.credibilityScore;
      
      // Bengali keywords
      if (content.includes('yes') || content.includes('হবে') || content.includes('জিতবে')) {
        yesWeight += weight;
      }
      if (content.includes('no') || content.includes('হবে না') || content.includes('হারবে')) {
        noWeight += weight;
      }
      totalWeight += weight;
    }
    
    const contradictionPenalty = contradictions.filter(c => c.severity === 'high').length * 0.15;
    
    if (totalWeight === 0) {
      return { outcome: 'UNCERTAIN', probability: 0.5, confidenceInterval: [0.3, 0.7] };
    }
    
    const yesProbability = yesWeight / (yesWeight + noWeight || 1);
    const confidence = Math.max(0.3, corpus.crossVerificationScore - contradictionPenalty);
    
    const margin = (1 - confidence) / 2;
    const probability = yesProbability > 0.6 ? yesProbability : (yesProbability < 0.4 ? yesProbability : 0.5);
    
    let outcome = 'UNCERTAIN';
    if (yesProbability > 0.7) outcome = 'YES';
    else if (yesProbability < 0.3) outcome = 'NO';
    
    return {
      outcome,
      probability: Math.max(0, Math.min(1, probability)),
      confidenceInterval: [Math.max(0, probability - margin), Math.min(1, probability + margin)]
    };
  }

  /**
   * Calculate content similarity
   */
  private calculateContentSimilarity(textA: string, textB: string): number {
    const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.length / union.size;
  }
}
