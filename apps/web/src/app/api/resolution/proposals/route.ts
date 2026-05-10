/**
 * Proposals API v2.1
 * Verdict proposals and approval workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET: Get proposals for a question
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
      .from("proposals")
      .select("*")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposals: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch proposals", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Submit a verdict proposal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      question_id,
      proposed_outcome,
      reasoning,
      evidence_cid = "",
      bond_amount = 0
    } = body;

    if (!question_id || !proposed_outcome || !reasoning) {
      return NextResponse.json(
        { error: "question_id, proposed_outcome, and reasoning are required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Check if user is an active resolver
    const { data: resolver } = await supabase
      .from("resolvers")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!resolver) {
      return NextResponse.json(
        { error: "Only active resolvers can propose verdicts" },
        { status: 403 }
      );
    }

    // Insert proposal
    const { data: proposal, error: insertError } = await supabase
      .from("proposals")
      .insert({
        question_id,
        proposed_outcome,
        reasoning,
        evidence_cid,
        bond_amount,
        proposer: resolver.id,
        timelock_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h timelock
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Update question status to PROPOSED
    await supabase
      .from("resolution_questions")
      .update({ status: 1 }) // PROPOSED
      .eq("id", question_id);

    return NextResponse.json({
      success: true,
      proposal
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create proposal", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Approve a proposal
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { proposal_id, approver_id } = body;

    if (!proposal_id || !approver_id) {
      return NextResponse.json(
        { error: "proposal_id and approver_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get current proposal
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .single();

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    // Check if already approved by this approver
    if (proposal.approvers?.includes(approver_id)) {
      return NextResponse.json(
        { error: "Already approved by this resolver" },
        { status: 400 }
      );
    }

    // Update proposal
    const newApprovals = (proposal.approvals || 0) + 1;
    const newApprovers = [...(proposal.approvers || []), approver_id];

    const { data: updated, error } = await supabase
      .from("proposals")
      .update({
        approvals: newApprovals,
        approvers: newApprovers
      })
      .eq("id", proposal_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if quorum reached
    if (newApprovals >= proposal.required_approvals) {
      // Update question to TIMELOCK status
      await supabase
        .from("resolution_questions")
        .update({
          status: 2, // TIMELOCK
          outcome: proposal.proposed_outcome
        })
        .eq("id", proposal.question_id);
    }

    return NextResponse.json({
      success: true,
      proposal: updated,
      quorum_reached: newApprovals >= proposal.required_approvals
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to approve proposal", details: error.message },
      { status: 500 }
    );
  }
}
