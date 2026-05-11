/**
 * AI Event Validation API
 * Validates event data quality and identifies risks
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEvent, validateEventFallback } from "@/lib/ai/agents";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request
    const body = await req.json();
    const {
      title,
      slug,
      category,
      description,
      resolutionCriteria,
      resolutionSource,
      resolutionDate,
    } = body;

    // Validate required fields
    if (!title || !slug || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, category" },
        { status: 400 }
      );
    }

    const eventData = {
      title,
      slug,
      category,
      description,
      resolutionCriteria,
      resolutionSource,
      resolutionDate,
    };

    // Run validation
    let result;
    try {
      result = await validateEvent(eventData);
    } catch (error) {
      console.warn("[Validate Event] AI validation failed, using fallback:", error);
      result = validateEventFallback(eventData);
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      validation: result,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("[Validate Event] Error:", error);
    return NextResponse.json(
      {
        error: "Validation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
