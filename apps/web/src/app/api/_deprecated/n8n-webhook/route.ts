/**
 * N8N Webhook Handler
 * Receives AI resolution results from n8n workflow
 * Updates database with AI analysis results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Verify n8n API key
function verifyN8NAuth(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-n8n-api-key');
    const expectedKey = process.env.N8N_API_KEY;

    if (!expectedKey) {
        console.warn('[n8n Webhook] N8N_API_KEY not configured');
        return true; // Allow in development
    }

    return apiKey === expectedKey;
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        if (!verifyN8NAuth(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse webhook payload
        const payload = await request.json();

        // Validate required fields
        if (!payload.market_id || !payload.result) {
            return NextResponse.json(
                { error: 'Missing required fields: market_id, result' },
                { status: 400 }
            );
        }

        const {
            market_id,
            result,
            evidence = [],
            sources = [],
            execution_time_ms = 0
        } = payload;

        const supabase = await createServiceClient();

        // Validate market exists
        const { data: market, error: marketError } = await supabase
            .from('markets')
            .select('id, question, status')
            .eq('id', market_id)
            .single();

        if (marketError || !market) {
            return NextResponse.json(
                { error: 'Market not found' },
                { status: 404 }
            );
        }

        // Determine outcome and confidence
        const outcome = result.outcome?.toUpperCase(); // YES, NO, or UNKNOWN
        const confidence = parseFloat(result.confidence) || 0;
        const reasoning = result.reasoning || '';

        // Determine confidence level
        let confidenceLevel: string;
        let recommendedAction: string;

        if (confidence >= 90) {
            confidenceLevel = 'HIGH';
            recommendedAction = outcome !== 'UNKNOWN' ? 'AUTO_RESOLVE' : 'HUMAN_REVIEW';
        } else if (confidence >= 70) {
            confidenceLevel = 'MEDIUM';
            recommendedAction = 'HUMAN_REVIEW';
        } else if (confidence >= 50) {
            confidenceLevel = 'LOW';
            recommendedAction = 'HUMAN_REVIEW';
        } else {
            confidenceLevel = 'INSUFFICIENT';
            recommendedAction = 'GATHER_MORE_EVIDENCE';
        }

        // Generate pipeline ID
        const pipelineId = `ai-${market_id}-${Date.now()}`;

        // Insert AI pipeline result
        const { data: pipeline, error: pipelineError } = await supabase
            .from('ai_resolution_pipelines')
            .insert({
                pipeline_id: pipelineId,
                market_id: market_id,
                query: {
                    question: market.question,
                    sources: sources
                },
                retrieval_output: {
                    sources: sources,
                    evidence: evidence
                },
                synthesis_output: {
                    outcome: outcome,
                    confidence: confidence,
                    reasoning: reasoning
                },
                deliberation_output: {
                    confidenceLevel: confidenceLevel,
                    recommendedAction: recommendedAction
                },
                explanation_output: {
                    naturalLanguageReasoning: reasoning,
                    keyEvidenceCitations: evidence
                },
                final_outcome: outcome !== 'UNKNOWN' ? outcome : null,
                final_confidence: confidence,
                confidence_level: confidenceLevel,
                recommended_action: recommendedAction,
                status: 'completed',
                completed_at: new Date().toISOString(),
                total_execution_time_ms: execution_time_ms,
                synthesis_model_version: result.model_version || 'gemini-pro',
                deliberation_model_version: result.model_version || 'gemini-pro',
                explanation_model_version: result.model_version || 'gemini-pro'
            })
            .select()
            .single();

        if (pipelineError) {
            console.error('[n8n Webhook] Failed to insert pipeline:', pipelineError);
            return NextResponse.json(
                { error: 'Failed to store AI result' },
                { status: 500 }
            );
        }

        // Update resolution_systems
        const { error: resolutionError } = await supabase
            .from('resolution_systems')
            .update({
                resolution_status: recommendedAction === 'AUTO_RESOLVE' ? 'resolved' : 'in_progress',
                proposed_outcome: outcome === 'YES' ? 1 : outcome === 'NO' ? 2 : null,
                confidence_level: confidence,
                evidence: evidence,
                updated_at: new Date().toISOString()
            })
            .eq('event_id', market_id);

        if (resolutionError) {
            console.error('[n8n Webhook] Failed to update resolution system:', resolutionError);
        }

        // Log the webhook receipt
        console.log(`[n8n Webhook] Processed market ${market_id}: ${outcome} (${confidence}%) - ${recommendedAction}`);

        return NextResponse.json({
            success: true,
            pipeline_id: pipelineId,
            outcome: outcome,
            confidence: confidence,
            confidence_level: confidenceLevel,
            recommended_action: recommendedAction,
            auto_resolved: recommendedAction === 'AUTO_RESOLVE'
        });

    } catch (error: any) {
        console.error('[n8n Webhook] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET: Health check endpoint
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        service: 'n8n-webhook-handler',
        timestamp: new Date().toISOString()
    });
}
