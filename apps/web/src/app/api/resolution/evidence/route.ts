/**
 * Evidence API v2.1
 * Submit and retrieve evidence for resolution questions
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8081";

// GET: Get evidence for a question
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("question_id");

    if (!questionId) {
      return NextResponse.json(
        { error: "question_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from("evidence")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evidence: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch evidence", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Submit evidence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question_id,
      evidence_text,
      evidence_type = 2,
      source_url = "",
      bond_amount = 0
    } = body;

    if (!question_id || !evidence_text) {
      return NextResponse.json(
        { error: "question_id and evidence_text are required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Insert evidence
    const { data: evidence, error: insertError } = await supabase
      .from("evidence")
      .insert({
        question_id,
        evidence_text,
        evidence_type,
        source_url,
        source_domain: source_url ? new URL(source_url).hostname : null,
        bond_amount
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Trigger AI evidence analysis in background
    if (AI_SERVICE_URL) {
      fetch(`${AI_SERVICE_URL}/analyze/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_text,
          evidence_type,
          source_url,
          question_context: question_id
        })
      })
        .then(async res => {
          if (res.ok) {
            const analysis = await res.json();
            // Update evidence with AI scores
            await supabase
              .from("evidence")
              .update({
                credibility_score: analysis.credibility_score,
                manipulation_risk: analysis.manipulation_risk,
                factuality_score: analysis.factuality_score
              })
              .eq("id", evidence.id);
          }
        })
        .catch(err => console.error("[AI] Evidence analysis failed:", err));
    }

    return NextResponse.json({
      success: true,
      evidence
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to submit evidence", details: error.message },
      { status: 500 }
    );
  }
}
