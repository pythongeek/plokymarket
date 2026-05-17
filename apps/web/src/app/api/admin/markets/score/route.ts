/**
 * Unified AI Market Quality Scorer API
 * POST /api/admin/markets/score
 * Orchestrates validation, risk, and market logic agents concurrently
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { validateEvent, validateEventFallback } from '@/lib/ai/agents';
import { runRiskAgent } from '@/lib/ai-agents/risk-agent';
import { runMarketLogicAgent } from '@/lib/ai-agents/market-logic-agent';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ScorePayload {
  title: string;
  question?: string;
  slug?: string;
  category?: string;
  description?: string;
  outcomes?: string[];
  resolution_date?: string;
  trading_closes_at?: string;
  resolution_criteria?: { yes?: string; no?: string; edgeCases?: string };
  resolution_source?: { name?: string; url?: string };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;

    const body: ScorePayload = await req.json();
    const title = body.title || body.question || '';
    const slug = body.slug || title.toLowerCase().replace(/\s+/g, '-').slice(0, 60);
    const category = body.category || 'Other';
    const description = body.description || '';
    const outcomes = body.outcomes || [];
    const resolutionDate = body.resolution_date || body.trading_closes_at;

    // Run all 3 agents concurrently
    const [validationResult, riskResult, logicResult] = await Promise.all([
      // Agent 1: Quality Validation
      (async () => {
        try {
          return await validateEvent({
            title,
            slug,
            category,
            description,
            resolutionCriteria: body.resolution_criteria,
            resolutionSource: body.resolution_source,
            resolutionDate,
          });
        } catch (err) {
          console.warn('[Score API] Validation agent failed, fallback:', err);
          return validateEventFallback({
            title, slug, category, description,
            resolutionCriteria: body.resolution_criteria,
            resolutionSource: body.resolution_source,
            resolutionDate,
          });
        }
      })(),

      // Agent 2: Risk & Compliance
      (async () => {
        try {
          return await runRiskAgent({
            title,
            description,
            category,
            outcomes,
            resolutionDate,
          });
        } catch (err) {
          console.warn('[Score API] Risk agent failed:', err);
          return {
            isSafe: true,
            riskScore: 0,
            violations: [],
            warnings: ['Risk assessment unavailable'],
            recommendations: [],
            policyChecks: {
              cyberSecurityLaw: true,
              termsOfService: true,
              gamblingPolicy: true,
              politicalSensitivity: true,
            },
            confidence: 0,
          };
        }
      })(),

      // Agent 3: Market Logic
      (async () => {
        try {
          return await runMarketLogicAgent({
            title,
            category,
            outcomes,
            resolutionDate,
          });
        } catch (err) {
          console.warn('[Score API] Market logic agent failed:', err);
          return {
            marketType: outcomes.length > 2 ? 'categorical' : 'binary',
            outcomes: outcomes.length >= 2 ? outcomes : ['হ্যাঁ (Yes)', 'না (No)'],
            outcomeCount: outcomes.length || 2,
            liquidityRecommendation: 1000,
            tradingFee: 0.02,
            minTradeAmount: 10,
            maxTradeAmount: 1000,
            bParameter: 500,
            confidence: 0,
          };
        }
      })(),
    ]);

    // Aggregate unified score (0-100)
    // Validation score: 0-1 → 0-40 points
    // Risk score: 0-100 risk → inverted to 0-40 safety points
    // Logic confidence: 0-1 → 0-20 points
    const validationPoints = Math.round((validationResult.score || 0) * 40);
    const safetyPoints = Math.round(Math.max(0, 1 - (riskResult.riskScore || 0) / 100) * 40);
    const logicPoints = Math.round((logicResult.confidence || 0) * 20);
    const aiQualityScore = Math.min(100, Math.max(0, validationPoints + safetyPoints + logicPoints));

    // Determine aggregated recommendation
    let recommendation: 'approve' | 'review' | 'revise' | 'reject' = 'review';
    if (aiQualityScore >= 85 && riskResult.isSafe) {
      recommendation = 'approve';
    } else if (aiQualityScore >= 60 && riskResult.riskScore < 50) {
      recommendation = 'review';
    } else if (riskResult.riskScore >= 75) {
      recommendation = 'reject';
    } else {
      recommendation = 'revise';
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      aiQualityScore,
      recommendation,
      risk: {
        isSafe: riskResult.isSafe,
        riskScore: riskResult.riskScore,
        violations: riskResult.violations,
        warnings: riskResult.warnings,
        policyChecks: riskResult.policyChecks,
      },
      quality: {
        score: validationResult.score,
        breakdown: validationResult.breakdown,
        improvements: validationResult.improvements,
      },
      marketLogic: {
        marketType: logicResult.marketType,
        liquidityRecommendation: logicResult.liquidityRecommendation,
        tradingFee: logicResult.tradingFee,
        minTradeAmount: logicResult.minTradeAmount,
        maxTradeAmount: logicResult.maxTradeAmount,
        bParameter: logicResult.bParameter,
      },
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('[Score API] Error:', error);
    return NextResponse.json(
      { error: 'Scoring failed', message: error.message },
      { status: 500 }
    );
  }
}
