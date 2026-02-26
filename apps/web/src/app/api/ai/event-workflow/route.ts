/**
 * AI Event Workflow API
 * 5-Stage AI-powered event creation with Vertex + Kimi rotation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeEventCreationWorkflow, batchExecuteWorkflow } from "@/lib/ai/workflows/event-creation-workflow";
import { getProviderStatus, getRotationStats } from "@/lib/ai/rotation-system";

export const maxDuration = 180; // 3 minutes for complex workflow
export const dynamic = "force-dynamic";

/**
 * POST: Execute 5-stage event creation workflow
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to create events" },
        { status: 401 }
      );
    }

    // Check permissions
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin, can_create_events")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin && !userData?.can_create_events) {
      return NextResponse.json(
        { error: "Forbidden", message: "No permission to create events" },
        { status: 403 }
      );
    }

    // Parse request
    const body = await req.json();
    const { title, description, context, batch } = body;

    // Batch processing
    if (batch && Array.isArray(batch)) {
      const inputs = batch.map((item: any) => ({
        title: item.title,
        description: item.description,
        context: { ...item.context, creatorId: user.id },
      }));

      console.log(`[Event Workflow] Batch processing ${inputs.length} events`);
      
      const results = await batchExecuteWorkflow(inputs, {
        concurrency: 3,
        onProgress: (completed, total) => {
          console.log(`[Event Workflow] Progress: ${completed}/${total}`);
        },
      });

      // Store results in database
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.success) {
          await supabase.from("ai_event_pipelines").insert({
            user_id: user.id,
            stage: "workflow_batch",
            provider: result.metadata.providersUsed[0],
            input_payload: inputs[i],
            output_payload: result,
            latency_ms: result.metadata.totalLatencyMs,
            status: "success",
          });
        }
      }

      return NextResponse.json({
        success: true,
        batch: true,
        count: results.length,
        results: results.map(r => ({
          success: r.success,
          title: r.finalOutput.title,
          recommendation: r.finalOutput.recommendation,
          confidence: r.finalOutput.confidence,
        })),
        metadata: {
          totalLatencyMs: Date.now() - startTime,
        },
      });
    }

    // Single event processing
    if (!title || title.trim().length < 10) {
      return NextResponse.json(
        { error: "Bad Request", message: "Title must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Execute 5-stage workflow
    console.log(`[Event Workflow] Starting workflow for: "${title}"`);
    
    const result = await executeEventCreationWorkflow({
      title,
      description,
      context: { ...context, creatorId: user.id },
    });

    // Store in database
    await supabase.from("ai_event_pipelines").insert({
      user_id: user.id,
      stage: "workflow_single",
      provider: result.metadata.providersUsed[0],
      input_payload: { title, description, context },
      output_payload: result,
      latency_ms: result.metadata.totalLatencyMs,
      status: result.success ? "success" : "partial_success",
    });

    return NextResponse.json({
      success: result.success,
      workflow: {
        stages: {
          slug: {
            name: result.stages.slug.name,
            status: result.stages.slug.status,
            provider: result.stages.slug.provider,
            latencyMs: result.stages.slug.latencyMs,
          },
          category: {
            name: result.stages.category.name,
            status: result.stages.category.status,
            provider: result.stages.category.provider,
            latencyMs: result.stages.category.latencyMs,
          },
          content: {
            name: result.stages.content.name,
            status: result.stages.content.status,
            provider: result.stages.content.provider,
            latencyMs: result.stages.content.latencyMs,
          },
          validation: {
            name: result.stages.validation.name,
            status: result.stages.validation.status,
            provider: result.stages.validation.provider,
            latencyMs: result.stages.validation.latencyMs,
          },
        },
        finalOutput: result.finalOutput,
      },
      metadata: {
        totalLatencyMs: result.metadata.totalLatencyMs,
        providersUsed: result.metadata.providersUsed,
        timestamp: result.metadata.timestamp,
      },
    });

  } catch (error) {
    console.error("[Event Workflow] Error:", error);
    return NextResponse.json(
      {
        error: "Workflow failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Get workflow status and provider health
 */
export async function GET() {
  try {
    const providerStatus = getProviderStatus();
    const rotationStats = getRotationStats();

    return NextResponse.json({
      status: "healthy",
      providers: providerStatus,
      rotation: rotationStats,
      workflow: {
        stages: [
          "Core Identity Agent (Slug Generation)",
          "Categorization Agent (Local Taxonomy)",
          "Market Dynamics Agent (Content Generation)",
          "Resolution & Oracle Agent (Validation)",
          "AI Final Review (Confidence Scorer)",
        ],
        features: [
          "Automatic Vertex AI / Kimi API rotation",
          "Bangladesh-specific context detection",
          "bd-local tag for local events",
          "Confidence-based approval workflow",
          "Batch processing support",
        ],
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 }
    );
  }
}
