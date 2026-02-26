/**
 * AI Event Processor API
 * Main endpoint for AI-powered event creation
 * Coordinates multiple AI agents with fallback support
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEventWithAI, type EventCreationInput } from "@/lib/ai/orchestrator";

export const maxDuration = 120; // 2 minutes for complex generation
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to create events" },
        { status: 401 }
      );
    }

    // Check if user is admin or has event creation permission
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin, can_create_events")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("[Event Processor] User fetch error:", userError);
      return NextResponse.json(
        { error: "Failed to verify user permissions" },
        { status: 500 }
      );
    }

    const canCreateEvents = userData?.is_admin || userData?.can_create_events;
    
    if (!canCreateEvents) {
      return NextResponse.json(
        { error: "Forbidden", message: "You don't have permission to create events" },
        { status: 403 }
      );
    }

    // Parse request body
    let body: EventCreationInput;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate input
    if (!body.title || body.title.trim().length < 10) {
      return NextResponse.json(
        { error: "Bad Request", message: "Title must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (body.title.length > 200) {
      return NextResponse.json(
        { error: "Bad Request", message: "Title must be less than 200 characters" },
        { status: 400 }
      );
    }

    // Execute AI pipeline
    console.log(`[Event Processor] Processing event: "${body.title.substring(0, 50)}..."`);
    
    const result = await createEventWithAI(body, {
      useFallback: true,
      skipValidation: false,
      preferredProvider: "auto",
    });

    const processingTime = Date.now() - startTime;

    // Log to database for analytics
    try {
      await supabase.from("ai_event_pipelines").insert({
        event_id: null, // Will be updated after event creation
        user_id: user.id,
        stage: "full_pipeline",
        provider: result.metadata.providerUsed,
        model: result.metadata.providerUsed === "vertex" ? "gemini-1.5" : "kimi-k1.5",
        input_payload: body,
        output_payload: result,
        latency_ms: processingTime,
        status: result.success ? "success" : "partial_success",
        error_message: result.metadata.errors.length > 0 
          ? result.metadata.errors.join("; ") 
          : null,
      });
    } catch (logError) {
      console.warn("[Event Processor] Failed to log pipeline:", logError);
    }

    // Return response
    return NextResponse.json({
      success: result.success,
      data: {
        slug: result.slug,
        category: result.category,
        content: result.content,
        validation: result.validation,
      },
      metadata: {
        processingTimeMs: processingTime,
        providerUsed: result.metadata.providerUsed,
        stagesCompleted: result.metadata.stagesCompleted,
        warnings: result.metadata.errors,
      },
    }, {
      headers: {
        "X-Processing-Time": String(processingTime),
        "X-AI-Provider": result.metadata.providerUsed,
      },
    });

  } catch (error) {
    console.error("[Event Processor] Unhandled error:", error);
    
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check AI service health
 * Simplified health check that doesn't require full AI initialization
 */
export async function GET() {
  try {
    // Check environment variables
    const hasVertexKey = !!process.env.VERTEX_API_KEY || !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
    const hasKimiKey = !!process.env.KIMI_API_KEY;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    // Basic connectivity check - don't actually call APIs to avoid cold start issues
    const vertexHealthy = hasVertexKey || hasGeminiKey;
    const kimiHealthy = hasKimiKey;
    const fallbackHealthy = hasGeminiKey; // Gemini can be used as fallback

    const allHealthy = vertexHealthy || kimiHealthy || fallbackHealthy;

    return NextResponse.json({
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        vertex: {
          status: vertexHealthy ? "healthy" : "unhealthy",
          configured: hasVertexKey,
          location: process.env.VERTEX_LOCATION || "us-central1",
        },
        kimi: {
          status: kimiHealthy ? "healthy" : "unhealthy",
          configured: hasKimiKey,
        },
        gemini: {
          status: hasGeminiKey ? "healthy" : "unhealthy",
          configured: hasGeminiKey,
        },
      },
      recommendation: allHealthy 
        ? "All AI services configured and ready" 
        : "Some AI services unavailable - check environment variables",
      version: "2.0.0",
    }, {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("[Event Processor] Health check error:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
