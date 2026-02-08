/**
 * Explanation Agent - Bangladesh Context
 * Generates human-interpretable reasoning for AI resolutions
 * Culturally and politically aware explanations for Bangladesh markets
 */

import { 
  AIResolutionPipeline,
  ExplanationAgentOutput,
  AgentAPIResponse,
  EvidenceSource
} from '../types';

export class ExplanationAgent {
  private name = 'ExplanationAgent';
  private version = '2.0.0-bd';
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * Main execution: Generate explanation for resolution
   */
  async execute(
    marketQuestion: string,
    pipeline: AIResolutionPipeline,
    context?: any
  ): Promise<AgentAPIResponse<ExplanationAgentOutput>> {
    const startTime = Date.now();
    
    try {
      // 1. Build explanation context from pipeline
      const explanationContext = this.buildExplanationContext(pipeline);
      
      // 2. Generate natural language reasoning with Bangladesh context
      const reasoning = await this.generateReasoning(marketQuestion, explanationContext, pipeline);
      
      // 3. Extract key evidence citations
      const citations = this.extractCitations(pipeline);
      
      // 4. Generate confidence explanation
      const confidenceExplanation = this.explainConfidence(pipeline);
      
      // 5. Identify uncertainty if applicable
      const uncertaintyAcknowledgment = this.identifyUncertainty(pipeline);
      
      const output: ExplanationAgentOutput = {
        agentType: 'explanation',
        naturalLanguageReasoning: reasoning,
        keyEvidenceCitations: citations,
        confidenceExplanation,
        uncertaintyAcknowledgment,
        modelUsed: this.version,
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
          code: 'EXPLANATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
        },
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Build structured context for explanation generation
   */
  private buildExplanationContext(pipeline: AIResolutionPipeline): {
    outcome: string;
    confidence: number;
    sources: EvidenceSource[];
    contradictions: any[];
    modelVotes: any[];
    crossVerification: number;
    isBangladeshContext: boolean;
  } {
    const sources = pipeline.retrieval?.corpus.sources || [];
    const isBangladeshContext = sources.some(s => 
      s.url.includes('.bd') || s.rawMetadata?.country === 'Bangladesh'
    );
    
    return {
      outcome: pipeline.finalOutcome || 'UNCERTAIN',
      confidence: pipeline.finalConfidence,
      sources: sources.slice(0, 5),
      contradictions: pipeline.synthesis?.contradictions || [],
      modelVotes: pipeline.deliberation?.agentVotes || [],
      crossVerification: pipeline.retrieval?.corpus.crossVerificationScore || 0,
      isBangladeshContext
    };
  }

  /**
   * Generate natural language reasoning
   */
  private async generateReasoning(
    marketQuestion: string,
    context: ReturnType<typeof this.buildExplanationContext>,
    pipeline: AIResolutionPipeline
  ): Promise<string> {
    if (this.apiKey) {
      try {
        return await this.generateLLMReasoning(marketQuestion, context, pipeline);
      } catch (error) {
        console.warn('[ExplanationAgent] LLM generation failed, using template fallback');
      }
    }
    
    return this.generateTemplateReasoning(marketQuestion, context);
  }

  /**
   * Generate reasoning using Gemini LLM with Bangladesh context
   */
  private async generateLLMReasoning(
    marketQuestion: string,
    context: ReturnType<typeof this.buildExplanationContext>,
    pipeline: AIResolutionPipeline
  ): Promise<string> {
    const hasGovSource = context.sources.some(s => s.url.includes('.gov.bd'));
    const hasBdMedia = context.sources.some(s => 
      s.url.includes('.bd') || ['prothomalo.com', 'thedailystar.net', 'bdnews24.com'].some(domain => 
        s.url.includes(domain)
      )
    );
    
    const prompt = `
You are an AI Oracle for Polymarket Bangladesh explaining a prediction market resolution. Write a clear explanation for Bangladeshi traders.

MARKET QUESTION: "${marketQuestion}"

RESOLUTION OUTCOME: ${context.outcome}
CONFIDENCE: ${(context.confidence * 100).toFixed(1)}%

${context.isBangladeshContext ? 'This is a Bangladesh-focused market.' : ''}

EVIDENCE SOURCES:
${context.sources.map((s, i) => `${i + 1}. ${s.title} ${s.url.includes('.gov.bd') ? '(Official Government)' : ''} ${s.url.includes('prothomalo.com') || s.url.includes('thedailystar.net') ? '(Major Bangladesh News)' : ''}`).join('\n')}

${context.contradictions.length > 0 ? `
CONTRADICTIONS NOTED:
${context.contradictions.map(c => `- ${c.severity}: ${c.contradiction}`).join('\n')}
` : ''}

Write a 2-3 paragraph explanation in English that:
1. States the final outcome clearly
2. Highlights Bangladesh government sources if applicable (they are authoritative)
3. Mentions major Bangladesh news outlets as corroborating evidence
4. Acknowledges any uncertainties or contradictions
5. Uses professional but accessible language for Bangladesh traders

Be objective and factual. If government sources confirm the outcome, emphasize their authority.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Generate reasoning using templates (fallback)
   */
  private generateTemplateReasoning(
    marketQuestion: string,
    context: ReturnType<typeof this.buildExplanationContext>
  ): string {
    const paragraphs: string[] = [];
    
    const outcomeText = context.outcome === 'YES' ? 'Yes' : 
                       context.outcome === 'NO' ? 'No' : 'Uncertain';
    
    // Opening with Bangladesh context if applicable
    if (context.isBangladeshContext) {
      paragraphs.push(
        `Based on comprehensive analysis of Bangladesh-based sources, the market "${marketQuestion}" has been resolved as **${outcomeText}** with ${(context.confidence * 100).toFixed(1)}% confidence.`
      );
    } else {
      paragraphs.push(
        `Based on comprehensive analysis of multiple evidence sources, the market "${marketQuestion}" has been resolved as **${outcomeText}** with ${(context.confidence * 100).toFixed(1)}% confidence.`
      );
    }
    
    // Evidence paragraph with Bangladesh focus
    if (context.sources.length > 0) {
      const govSource = context.sources.find(s => s.url.includes('.gov.bd'));
      const bdMediaSource = context.sources.find(s => 
        s.url.includes('prothomalo.com') || 
        s.url.includes('thedailystar.net') || 
        s.url.includes('bdnews24.com')
      );
      
      let evidenceText = '';
      
      if (govSource) {
        evidenceText += `Key confirmation comes from ${govSource.title}, an official Bangladesh government source. `;
      }
      
      if (bdMediaSource) {
        evidenceText += `This is corroborated by ${bdMediaSource.title}, a leading Bangladesh media outlet. `;
      }
      
      if (!govSource && !bdMediaSource && context.sources[0]) {
        evidenceText += `The resolution is supported by evidence from ${context.sources[0].title}. `;
      }
      
      paragraphs.push(evidenceText);
    }
    
    // Cross-verification
    if (context.crossVerification > 0.8) {
      paragraphs.push(
        `Multiple independent Bangladesh sources confirm this outcome, with a cross-verification score of ${(context.crossVerification * 100).toFixed(0)}%.`
      );
    }
    
    // Model consensus
    if (context.modelVotes.length > 1) {
      const consensusModels = context.modelVotes.filter(v => v.outcome === context.outcome);
      if (consensusModels.length >= 2) {
        paragraphs.push(
          `This conclusion represents consensus among ${consensusModels.length} of ${context.modelVotes.length} independent AI models.`
        );
      }
    }
    
    // Contradictions/uncertainty
    if (context.contradictions.length > 0) {
      const highSeverity = context.contradictions.filter(c => c.severity === 'high');
      if (highSeverity.length > 0) {
        paragraphs.push(
          `Note: Some conflicting reports were identified during analysis. The final resolution prioritizes higher-authority Bangladesh government sources and cross-verified information.`
        );
      }
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * Extract key evidence citations
   */
  private extractCitations(pipeline: AIResolutionPipeline): string[] {
    const citations: string[] = [];
    
    if (!pipeline.retrieval?.corpus.sources) return citations;
    
    // Get top 3 most credible sources
    const topSources = pipeline.retrieval.corpus.sources
      .sort((a, b) => b.credibilityScore - a.credibilityScore)
      .slice(0, 3);
    
    for (const source of topSources) {
      let citation = `[${source.sourceType.toUpperCase()}] ${source.title}`;
      
      // Bangladesh government badge
      if (source.url.includes('.gov.bd')) {
        citation += ' 🇧🇩 Government Official';
      } else if (source.credibilityScore > 0.9) {
        citation += ' (Tier-1 Authority)';
      } else if (['prothomalo.com', 'thedailystar.net', 'bdnews24.com'].some(d => source.url.includes(d))) {
        citation += ' (Bangladesh Tier-1 Media)';
      }
      
      citation += ` - ${source.url}`;
      citations.push(citation);
    }
    
    // Add model consensus citation
    if (pipeline.deliberation?.agentVotes) {
      const consensusModels = pipeline.deliberation.agentVotes
        .filter(v => v.outcome === pipeline.finalOutcome)
        .map(v => v.agentModel);
      
      if (consensusModels.length > 0) {
        citations.push(`[AI CONSENSUS] ${consensusModels.join(', ')}`);
      }
    }
    
    return citations;
  }

  /**
   * Generate confidence explanation
   */
  private explainConfidence(pipeline: AIResolutionPipeline): string {
    const factors: string[] = [];
    
    // Confidence level
    if (pipeline.finalConfidence >= 0.95) {
      factors.push('Very high confidence (≥95%): Multiple authoritative Bangladesh sources confirm this outcome');
    } else if (pipeline.finalConfidence >= 0.85) {
      factors.push('High confidence (85-95%): Strong evidence from Bangladesh media and official sources');
    } else if (pipeline.finalConfidence >= 0.7) {
      factors.push('Moderate confidence (70-85%): Evidence supports outcome but with some gaps');
    } else {
      factors.push('Lower confidence (<70%): Limited or conflicting evidence from Bangladesh sources');
    }
    
    // Source quality
    const govSources = pipeline.retrieval?.corpus.sources.filter(s => s.url.includes('.gov.bd')) || [];
    const highCredSources = pipeline.retrieval?.corpus.sources.filter(s => s.credibilityScore > 0.85) || [];
    
    if (govSources.length > 0) {
      factors.push(`${govSources.length} Bangladesh government source(s) provide authoritative confirmation`);
    }
    
    if (highCredSources.length >= 3) {
      factors.push(`${highCredSources.length} high-credibility Bangladesh media sources`);
    }
    
    // Cross-verification
    if (pipeline.retrieval?.corpus.crossVerificationScore) {
      const cv = pipeline.retrieval.corpus.crossVerificationScore;
      if (cv > 0.8) {
        factors.push('Strong cross-verification between independent Bangladesh sources');
      }
    }
    
    // Model agreement
    if (pipeline.deliberation?.agentVotes) {
      const agreeingModels = pipeline.deliberation.agentVotes
        .filter(v => v.outcome === pipeline.finalOutcome).length;
      const totalModels = pipeline.deliberation.agentVotes.length;
      
      if (agreeingModels === totalModels) {
        factors.push(`Unanimous agreement across ${totalModels} independent AI models`);
      }
    }
    
    // Contradiction impact
    const contradictions = pipeline.synthesis?.contradictions || [];
    if (contradictions.length > 0) {
      const highSev = contradictions.filter(c => c.severity === 'high').length;
      if (highSev > 0) {
        factors.push(`${highSev} conflicting reports were identified and resolved`);
      }
    }
    
    return factors.join('. ');
  }

  /**
   * Identify and explain uncertainties
   */
  private identifyUncertainty(pipeline: AIResolutionPipeline): string | undefined {
    const uncertainties: string[] = [];
    
    // Check for contradictions
    const contradictions = pipeline.synthesis?.contradictions || [];
    const highSeverityContradictions = contradictions.filter(c => c.severity === 'high');
    
    if (highSeverityContradictions.length > 0) {
      uncertainties.push(`${highSeverityContradictions.length} significant contradictory reports were found among Bangladesh sources`);
    }
    
    // Check confidence level
    if (pipeline.finalConfidence < 0.85) {
      uncertainties.push(`Confidence level (${(pipeline.finalConfidence * 100).toFixed(1)}%) below automated threshold`);
    }
    
    // Check model disagreement
    if (pipeline.deliberation?.disagreementAnalysis) {
      uncertainties.push('Independent AI models showed disagreement on outcome');
    }
    
    // Check source freshness
    const oldSources = pipeline.retrieval?.corpus.sources.filter(s => {
      const published = new Date(s.publishedAt);
      const daysAgo = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 3; // Bangladesh news moves fast
    }) || [];
    
    if (oldSources.length > 0 && oldSources.length === pipeline.retrieval?.corpus.sources.length) {
      uncertainties.push('All evidence sources are older than 3 days');
    }
    
    if (uncertainties.length === 0) return undefined;
    
    return uncertainties.join('. ');
  }
}
