/**
 * Resolution Questions API v2.1
 * CRUD for prediction market resolution questions
 * Connects to local Supabase + on-chain contracts
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8081";

// GET: List resolution questions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createServiceClient();

    let query = supabase
      .from("resolution_questions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== null) query = query.eq("status", parseInt(status));
    if (tier !== null) query = query.eq("tier", parseInt(tier));
    if (category) query = query.eq("category", category);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      questions: data,
      total: count,
      limit,
      offset
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch questions", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new resolution question
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category = "general",
      tier = 0,
      resolution_time,
      evidence = [],
      news_urls = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Insert question
    const { data: question, error: insertError } = await supabase
      .from("resolution_questions")
      .insert({
        title,
        description,
        category,
        tier,
        resolution_time,
        status: 0, // OPEN
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Trigger AI analysis in background
    if (AI_SERVICE_URL) {
      fetch(`${AI_SERVICE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: question.id,
          title,
          description,
          category,
          tier,
          evidence,
          news_urls
        })
      }).catch(err => console.error("[AI] Background analysis failed:", err));
    }

    return NextResponse.json({
      success: true,
      question
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create question", details: error.message },
      { status: 500 }
    );
  }
}
