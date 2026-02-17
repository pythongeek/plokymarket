/**
 * Enhanced Market Resolution Service
 * Multi-step verification with confidence-based decision tree
 * Optimized for Vercel Edge (10s execution limit)
 */

import { createClient } from '@supabase/supabase-js';
import { setLock, checkLock, setex, get } from '@/lib/upstash/redis';

interface ResolutionResult {
  outcome: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number;
  reasoning: string;
  sources: Array<{ url: string; title: string; relevance: number }>;
  verificationSteps: string[];
  needsHumanReview: boolean;
}

interface GeminiResponse {
  outcome: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number;
  reasoning: string;
  sources: Array<{ url: string; title: string }>;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Main resolution function with multi-step verification
 */
export async function resolveMarketWithVerification(
  marketId: string,
  question: string,
  category: string
): Promise<ResolutionResult> {
  const steps: string[] = [];
  const startTime = Date.now();
  
  // Step 1: Check rate limit / lock
  steps.push('Checking rate limit...');
  const lockKey = `resolution:lock:${marketId}`;
  const existingLock = await checkLock(lockKey);
  
  if (existingLock) {
    throw new Error('Resolution already in progress for this market');
  }
  
  // Set lock for 5 minutes
  await setLock(lockKey, 'processing', 300);
  steps.push('Lock acquired');

  try {
    // Step 2: Initial AI Research (Primary Search)
    steps.push('Performing primary AI research...');
    const primaryResult = await performAIResearch(question, category, 'primary');
    
    // Decision Tree Based on Confidence
    if (primaryResult.confidence >= 90) {
      // High confidence - Auto settle
      steps.push(`High confidence (${primaryResult.confidence}%) - Auto settling`);
      
      return {
        outcome: primaryResult.outcome,
        confidence: primaryResult.confidence,
        reasoning: primaryResult.reasoning,
        sources: primaryResult.sources.map(s => ({ ...s, relevance: 0.9 })),
        verificationSteps: steps,
        needsHumanReview: false
      };
      
    } else if (primaryResult.confidence >= 70) {
      // Medium confidence - Secondary verification
      steps.push(`Medium confidence (${primaryResult.confidence}%) - Secondary verification needed`);
      
      const secondaryResult = await performAIResearch(question, category, 'secondary');
      
      // Compare results
      if (primaryResult.outcome === secondaryResult.outcome) {
        const avgConfidence = (primaryResult.confidence + secondaryResult.confidence) / 2;
        
        if (avgConfidence >= 85) {
          steps.push(`Secondary verification confirms outcome (${avgConfidence}%)`);
          
          return {
            outcome: primaryResult.outcome,
            confidence: avgConfidence,
            reasoning: `Primary: ${primaryResult.reasoning}\n\nSecondary: ${secondaryResult.reasoning}`,
            sources: [...primaryResult.sources, ...secondaryResult.sources].map(s => ({ ...s, relevance: 0.8 })),
            verificationSteps: steps,
            needsHumanReview: false
          };
        }
      }
      
      // Conflicting or still low confidence
      steps.push('Secondary verification inconclusive - Human review required');
      
      return {
        outcome: 'UNCERTAIN',
        confidence: Math.max(primaryResult.confidence, secondaryResult.confidence),
        reasoning: `Conflicting evidence found. Primary: ${primaryResult.reasoning}\n\nSecondary: ${secondaryResult.reasoning}`,
        sources: [...primaryResult.sources, ...secondaryResult.sources].map(s => ({ ...s, relevance: 0.6 })),
        verificationSteps: steps,
        needsHumanReview: true
      };
      
    } else {
      // Low confidence - Direct to human review
      steps.push(`Low confidence (${primaryResult.confidence}%) - Human review required`);
      
      return {
        outcome: 'UNCERTAIN',
        confidence: primaryResult.confidence,
        reasoning: `Insufficient confidence: ${primaryResult.reasoning}`,
        sources: primaryResult.sources.map(s => ({ ...s, relevance: 0.5 })),
        verificationSteps: steps,
        needsHumanReview: true
      };
    }
    
  } finally {
    // Clear lock after 1 minute (keep for deduplication)
    await setex(lockKey, 60, 'completed');
  }
}

/**
 * Perform AI research with Gemini
 */
async function performAIResearch(
  question: string,
  category: string,
  searchType: 'primary' | 'secondary'
): Promise<GeminiResponse> {
  
  const searchFocus = searchType === 'primary' 
    ? 'recent news and official sources'
    : 'alternative sources and fact-checking sites';

  const prompt = `You are a prediction market resolution oracle. Research this question and provide a definitive answer.

Question: "${question}"
Category: ${category}
Search Focus: ${searchFocus}

Instructions:
1. Search for ${searchFocus} related to this question
2. Analyze the evidence objectively
3. Provide a confidence score (0-100)
4. Cite specific sources

Response must be in this JSON format:
{
  "outcome": "YES" | "NO" | "UNCERTAIN",
  "confidence": number (0-100),
  "reasoning": "detailed explanation with evidence",
  "sources": [
    {"url": "source url", "title": "source title"}
  ]
}

Rules:
- Only return the JSON, no other text
- Confidence > 90 only if evidence is definitive
- Confidence < 70 if evidence is unclear
- Include at least 2 sources`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse Gemini response:', text);
  }
  
  // Fallback
  return {
    outcome: 'UNCERTAIN',
    confidence: 0,
    reasoning: 'Failed to parse AI response',
    sources: []
  };
}

/**
 * Process resolution result and update database
 */
export async function processResolutionResult(
  marketId: string,
  result: ResolutionResult
): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const now = new Date().toISOString();

  if (result.needsHumanReview) {
    // Send to human review queue
    await supabase.from('human_review_queue').insert({
      market_id: marketId,
      ai_proposed_outcome: result.outcome === 'UNCERTAIN' ? null : result.outcome,
      ai_confidence: result.confidence,
      ai_reasoning: result.reasoning,
      evidence_summary: result.sources,
      status: 'pending',
      priority: result.confidence < 50 ? 8 : 5 // Higher priority for very low confidence
    });

    // Update resolution system status
    await supabase.from('resolution_systems').update({
      resolution_status: 'in_progress',
      proposed_outcome: result.outcome === 'UNCERTAIN' ? null : (result.outcome === 'YES' ? 1 : 2),
      confidence_level: result.confidence,
      evidence: [{
        type: 'ai_analysis',
        outcome: result.outcome,
        confidence: result.confidence,
        reasoning: result.reasoning,
        sources: result.sources,
        verification_steps: result.verificationSteps,
        timestamp: now
      }],
      updated_at: now
    }).eq('event_id', marketId);

  } else {
    // Auto-resolve
    await supabase.from('markets').update({
      status: 'resolved',
      winning_outcome: result.outcome,
      resolved_at: now,
      resolution_details: {
        source: 'AI_ORACLE_AUTO',
        confidence: result.confidence,
        reasoning: result.reasoning,
        sources: result.sources.map(s => s.url),
        auto_resolved: true,
        verification_steps: result.verificationSteps
      }
    }).eq('id', marketId);

    // Update resolution system
    await supabase.from('resolution_systems').update({
      resolution_status: 'resolved',
      proposed_outcome: result.outcome === 'YES' ? 1 : 2,
      confidence_level: result.confidence,
      resolved_at: now,
      evidence: [{
        type: 'ai_analysis_auto',
        outcome: result.outcome,
        confidence: result.confidence,
        reasoning: result.reasoning,
        sources: result.sources,
        verification_steps: result.verificationSteps,
        timestamp: now
      }]
    }).eq('event_id', marketId);

    // Trigger settlement
    await supabase.rpc('settle_market', {
      p_market_id: marketId,
      p_outcome: result.outcome === 'YES' ? 1 : 2
    });
  }
}

/**
 * Check if market is ready for resolution
 */
export async function isMarketReadyForResolution(marketId: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: market } = await supabase
    .from('markets')
    .select('status, trading_closes_at')
    .eq('id', marketId)
    .single();

  if (!market) return false;
  
  // Check if trading has closed
  const now = new Date();
  const closesAt = new Date(market.trading_closes_at);
  
  return market.status === 'active' && now >= closesAt;
}
