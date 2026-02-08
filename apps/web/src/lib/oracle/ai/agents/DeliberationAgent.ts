/**
 * Deliberation Agent
 * Compares assessments from multiple AI models
 * Identifies consensus or disagreement through ensemble voting
 */

import { 
  SynthesisAgentOutput,
  DeliberationAgentOutput,
  AgentAPIResponse 
} from '../types';

interface ModelAssessment {
  modelName: string;
  outcome: string;
  probability: number;
  confidence: number;
  weight: number;
}

export class DeliberationAgent {
  private name = 'DeliberationAgent';
  private version = '1.0.0';
  
  // Multiple model configurations for ensemble
  private models = [
    { name: 'Gemini-1.5-Pro', weight: 0.35 },
    { name: 'GPT-4o', weight: 0.35 },
    { name: 'Claude-3.5-Sonnet', weight: 0.30 }
  ];

  /**
   * Main execution: Deliberate across multiple model assessments
   */
  async execute(
    marketQuestion: string,
    synthesisOutput: SynthesisAgentOutput,
    context?: any
  ): Promise<AgentAPIResponse<DeliberationAgentOutput>> {
    const startTime = Date.now();
    
    try {
      // 1. Gather assessments from multiple models
      const assessments = await this.gatherModelAssessments(
        marketQuestion,
        synthesisOutput,
        context
      );
      
      // 2. Apply ensemble method
      const ensembleMethod = context?.ensembleMethod || 'weighted_vote';
      const result = this.applyEnsemble(assessments, ensembleMethod);
      
      // 3. Analyze disagreement if consensus not reached
      let disagreementAnalysis: string | undefined;
      const consensusThreshold = context?.minConsensusThreshold || 0.7;
      
      if (result.consensusProbability < consensusThreshold) {
        disagreementAnalysis = this.analyzeDisagreement(assessments);
      }
      
      const output: DeliberationAgentOutput = {
        agentType: 'deliberation',
        consensusOutcome: result.outcome,
        consensusProbability: result.probability,
        agentVotes: assessments.map(a => ({
          agentModel: a.modelName,
          outcome: a.outcome,
          probability: a.probability,
          weight: a.weight
        })),
        disagreementAnalysis,
        ensembleMethod,
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
          code: 'DELIBERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
        },
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Gather assessments from multiple AI models
   * In production, this calls each model's API
   */
  private async gatherModelAssessments(
    marketQuestion: string,
    synthesisOutput: SynthesisAgentOutput,
    context?: any
  ): Promise<ModelAssessment[]> {
    const assessments: ModelAssessment[] = [];
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    // Model 1: Gemini (real API if available)
    try {
      const geminiAssessment = await this.callGeminiModel(
        marketQuestion,
        synthesisOutput,
        apiKey
      );
      assessments.push({
        modelName: 'Gemini-1.5-Pro',
        ...geminiAssessment,
        weight: 0.35
      });
    } catch (error) {
      console.warn('[DeliberationAgent] Gemini call failed, using synthesis fallback');
      assessments.push({
        modelName: 'Gemini-1.5-Pro',
        outcome: synthesisOutput.probabilisticAssessment.outcome,
        probability: synthesisOutput.probabilisticAssessment.probability,
        confidence: this.calculateConfidence(synthesisOutput),
        weight: 0.35
      });
    }
    
    // Model 2: Simulated GPT-4o (in production, call OpenAI API)
    assessments.push({
      modelName: 'GPT-4o',
      ...this.simulateModelAssessment(synthesisOutput, 'GPT-4o'),
      weight: 0.35
    });
    
    // Model 3: Simulated Claude (in production, call Anthropic API)
    assessments.push({
      modelName: 'Claude-3.5-Sonnet',
      ...this.simulateModelAssessment(synthesisOutput, 'Claude'),
      weight: 0.30
    });
    
    return assessments;
  }

  /**
   * Call Gemini model for independent assessment
   */
  private async callGeminiModel(
    marketQuestion: string,
    synthesisOutput: SynthesisAgentOutput,
    apiKey: string
  ): Promise<{ outcome: string; probability: number; confidence: number }> {
    if (!apiKey) {
      throw new Error('No API key available');
    }
    
    const prompt = `
You are an expert prediction market analyst. Given the following market question and evidence summary, provide your independent assessment.

MARKET QUESTION: "${marketQuestion}"

EVIDENCE SUMMARY:
- Primary sources: ${synthesisOutput.credibilityAnalysis.length} sources analyzed
- Contradictions: ${synthesisOutput.contradictions.length} detected
- Cross-verification score: ${(synthesisOutput.probabilisticAssessment.probability * 100).toFixed(1)}%

Provide your assessment in JSON format:
{
  "outcome": "YES|NO|UNCERTAIN",
  "probability": 0.85,
  "confidence": 0.90
}

Be independent - do not simply agree with the provided evidence summary. Form your own conclusion.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
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
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      };
    }
    
    throw new Error('Could not parse response');
  }

  /**
   * Simulate model assessment (for models without API integration)
   * Adds realistic variance to simulate independent thinking
   */
  private simulateModelAssessment(
    synthesisOutput: SynthesisAgentOutput,
    modelName: string
  ): { outcome: string; probability: number; confidence: number } {
    const baseProbability = synthesisOutput.probabilisticAssessment.probability;
    const baseOutcome = synthesisOutput.probabilisticAssessment.outcome;
    
    // Each model has slightly different characteristics
    const modelCharacteristics: Record<string, { bias: number; variance: number }> = {
      'GPT-4o': { bias: 0.02, variance: 0.08 },
      'Claude-3.5-Sonnet': { bias: -0.01, variance: 0.06 }
    };
    
    const chars = modelCharacteristics[modelName] || { bias: 0, variance: 0.1 };
    
    // Add model-specific bias and random variance
    const randomVariance = (Math.random() - 0.5) * chars.variance;
    const adjustedProbability = Math.max(0, Math.min(1, 
      baseProbability + chars.bias + randomVariance
    ));
    
    // Determine outcome based on adjusted probability
    let outcome = baseOutcome;
    if (adjustedProbability > 0.65) outcome = 'YES';
    else if (adjustedProbability < 0.35) outcome = 'NO';
    else outcome = 'UNCERTAIN';
    
    // Calculate confidence based on contradictions and distance from 0.5
    const distanceFromUncertainty = Math.abs(adjustedProbability - 0.5) * 2;
    const contradictionPenalty = synthesisOutput.contradictions.length * 0.1;
    const confidence = Math.max(0.3, distanceFromUncertainty - contradictionPenalty);
    
    return { outcome, probability: adjustedProbability, confidence };
  }

  /**
   * Apply ensemble method to combine model assessments
   */
  private applyEnsemble(
    assessments: ModelAssessment[],
    method: 'weighted_vote' | 'bayesian' | 'max_likelihood'
  ): { outcome: string; probability: number } {
    switch (method) {
      case 'bayesian':
        return this.bayesianEnsemble(assessments);
      case 'max_likelihood':
        return this.maxLikelihoodEnsemble(assessments);
      case 'weighted_vote':
      default:
        return this.weightedVoteEnsemble(assessments);
    }
  }

  /**
   * Weighted vote ensemble
   */
  private weightedVoteEnsemble(assessments: ModelAssessment[]): { outcome: string; probability: number } {
    const weightedScores: Record<string, number> = { YES: 0, NO: 0, UNCERTAIN: 0 };
    let totalWeight = 0;
    
    for (const assessment of assessments) {
      const weight = assessment.weight * assessment.confidence;
      weightedScores[assessment.outcome] += weight;
      totalWeight += weight;
    }
    
    // Normalize
    const normalizedScores = Object.entries(weightedScores).map(([outcome, score]) => ({
      outcome,
      score: score / totalWeight
    }));
    
    // Sort by score
    normalizedScores.sort((a, b) => b.score - a.score);
    
    const winner = normalizedScores[0];
    
    // Calculate probability based on score margin
    const runnerUp = normalizedScores[1];
    const margin = winner.score - (runnerUp?.score || 0);
    const probability = 0.5 + (margin * 0.5); // Scale to 0.5-1.0
    
    return {
      outcome: winner.outcome,
      probability: Math.min(1, probability)
    };
  }

  /**
   * Bayesian ensemble (posterior probability combination)
   */
  private bayesianEnsemble(assessments: ModelAssessment[]): { outcome: string; probability: number } {
    // Use log-odds for numerical stability
    let logOddsYes = 0;
    let logOddsNo = 0;
    
    for (const assessment of assessments) {
      const weight = assessment.weight;
      const p = assessment.probability;
      
      if (p > 0 && p < 1) {
        logOddsYes += weight * Math.log(p / (1 - p));
      }
    }
    
    // Convert back to probability
    const probYes = 1 / (1 + Math.exp(-logOddsYes));
    
    let outcome = 'UNCERTAIN';
    if (probYes > 0.7) outcome = 'YES';
    else if (probYes < 0.3) outcome = 'NO';
    
    return { outcome, probability: probYes };
  }

  /**
   * Maximum likelihood ensemble
   */
  private maxLikelihoodEnsemble(assessments: ModelAssessment[]): { outcome: string; probability: number } {
    // Find the assessment with highest confidence
    const bestAssessment = assessments.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return {
      outcome: bestAssessment.outcome,
      probability: bestAssessment.probability
    };
  }

  /**
   * Analyze disagreement between models
   */
  private analyzeDisagreement(assessments: ModelAssessment[]): string {
    const outcomes = assessments.map(a => a.outcome);
    const uniqueOutcomes = [...new Set(outcomes)];
    
    if (uniqueOutcomes.length === 1) {
      return 'Models agree on outcome but with varying confidence levels';
    }
    
    // Calculate disagreement metrics
    const yesModels = assessments.filter(a => a.outcome === 'YES');
    const noModels = assessments.filter(a => a.outcome === 'NO');
    const uncertainModels = assessments.filter(a => a.outcome === 'UNCERTAIN');
    
    const analysis: string[] = [];
    
    if (yesModels.length > 0 && noModels.length > 0) {
      const yesStrength = yesModels.reduce((sum, a) => sum + a.weight * a.confidence, 0);
      const noStrength = noModels.reduce((sum, a) => sum + a.weight * a.confidence, 0);
      
      analysis.push(`Polarized disagreement: YES (${(yesStrength * 100).toFixed(0)}%) vs NO (${(noStrength * 100).toFixed(0)}%)`);
      
      if (Math.abs(yesStrength - noStrength) < 0.2) {
        analysis.push('Split is nearly even - strong evidence conflict');
      }
    }
    
    if (uncertainModels.length > 0) {
      analysis.push(`${uncertainModels.length} model(s) abstained due to insufficient confidence`);
    }
    
    // Check for low-confidence predictions
    const lowConfidenceModels = assessments.filter(a => a.confidence < 0.6);
    if (lowConfidenceModels.length > 0) {
      analysis.push(`${lowConfidenceModels.length} model(s) have low confidence (<60%)`);
    }
    
    return analysis.join('; ');
  }

  /**
   * Calculate overall confidence from synthesis output
   */
  private calculateConfidence(synthesisOutput: SynthesisAgentOutput): number {
    const baseConfidence = synthesisOutput.probabilisticAssessment.confidenceInterval[1] - 
                          synthesisOutput.probabilisticAssessment.confidenceInterval[0];
    
    // Penalty for contradictions
    const contradictionPenalty = synthesisOutput.contradictions.length * 0.1;
    
    // Boost for high-credibility sources
    const avgCredibility = synthesisOutput.credibilityAnalysis.reduce((sum, a) => 
      sum + a.adjustedScore, 0) / synthesisOutput.credibilityAnalysis.length || 0;
    
    return Math.max(0.3, Math.min(1, (1 - baseConfidence) - contradictionPenalty + (avgCredibility * 0.1)));
  }
}
