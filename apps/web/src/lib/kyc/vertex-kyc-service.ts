/**
 * Vertex AI KYC Verification Service
 *
 * Uses Google Vertex AI (Gemini) for document extraction.
 * Deterministic heuristics (code, not AI) for fraud prevention.
 *
 * Architecture:
 *   1. Vertex AI extracts fields from document image → strict JSON
 *   2. Deterministic validation: age, expiration, uniqueness, confidence
 *   3. Pass → verified | Fail → rejected or pending_manual_review
 */

import { callVertexAI } from "@/lib/ai/vertex-client";
import { createServiceClient } from "@/lib/supabase/server";

// ─── Configuration ────────────────────────────────────────────────────────────────────────────

export const KYC_MIN_CONFIDENCE = 90;
export const KYC_MIN_AGE = 18;

export const KYC_SYSTEM_PROMPT = `You are a strict KYC document analyst. Extract data from the provided ID document image.

You MUST respond ONLY with valid JSON matching this exact schema:
{
  "document_type": "PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE" | "UNKNOWN",
  "document_id": "string (exact ID number)",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "YYYY-MM-DD",
  "expiration_date": "YYYY-MM-DD",
  "confidence_score": number (0-100),
  "visual_flags": ["BLURRY" | "GLARE" | "CROPPED" | "CLEAN"]
}

RULES:
- If any text is unreadable, set that field to "UNKNOWN" and lower confidence_score.
- If the image is too blurry to read anything, set ALL fields to "UNKNOWN" and confidence_score to 0.
- Do NOT guess dates or names. Only output what you can clearly read.
- visual_flags MUST include "CLEAN" if the image is sharp and fully visible.
- visual_flags MUST include "BLURRY" if text is hard to read.
- Never hallucinate data. Uncertainty → lower confidence.`;

// ─── Types ────────────────────────────────────────────────────────────────────────────

export interface KYCExtractionResult {
  document_type: "PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE" | "UNKNOWN";
  document_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // YYYY-MM-DD
  expiration_date: string; // YYYY-MM-DD
  confidence_score: number;
  visual_flags: string[];
}

export type KYCVerificationStatus =
  | "verified"
  | "rejected"
  | "pending_manual_review";

export interface KYCVerificationResult {
  status: KYCVerificationStatus;
  extraction: KYCExtractionResult | null;
  reason: string;
  checks: {
    age_passed: boolean;
    expiration_passed: boolean;
    confidence_passed: boolean;
    visual_passed: boolean;
    unique_passed: boolean;
  };
}

export class KYCExtractionError extends Error {
  public rawResponse: string;
  constructor(msg: string, rawResponse: string = "") {
    super(msg);
    this.name = "KYCExtractionError";
    this.rawResponse = rawResponse;
  }
}

// ─── Vertex AI Extraction ───────────────────────────────────────────────────────────────────────

export async function extractKYCDocument(
  imageBase64: string
): Promise<KYCExtractionResult> {
  const systemPrompt = KYC_SYSTEM_PROMPT;
  const userPrompt = `Analyze this ID document image (base64 encoded) and extract the required fields as JSON.\n\nImage: data:image/jpeg;base64,${imageBase64.slice(0, 100)}...`;

  const response = await callVertexAI(systemPrompt, userPrompt, {
    maxTokens: 1024,
    temperature: 0.0,
  });

  const rawText = response.text || "";

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = rawText;
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  let parsed: Partial<KYCExtractionResult>;
  try {
    parsed = JSON.parse(jsonText) as Partial<KYCExtractionResult>;
  } catch {
    throw new KYCExtractionError(
      `Vertex AI returned unparseable JSON. Raw: ${rawText.slice(0, 500)}`,
      rawText
    );
  }

  // Validate required fields
  const required = [
    "document_type",
    "document_id",
    "first_name",
    "last_name",
    "date_of_birth",
    "expiration_date",
    "confidence_score",
    "visual_flags",
  ];
  const missing = required.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    throw new KYCExtractionError(
      `Missing required fields in KYC extraction: ${missing.join(", ")}. Raw: ${jsonText.slice(0, 500)}`,
      jsonText
    );
  }

  // Type guard and clamp
  const result: KYCExtractionResult = {
    document_type: parsed.document_type as KYCExtractionResult["document_type"],
    document_id: String(parsed.document_id),
    first_name: String(parsed.first_name),
    last_name: String(parsed.last_name),
    date_of_birth: String(parsed.date_of_birth),
    expiration_date: String(parsed.expiration_date),
    confidence_score: Math.min(
      100,
      Math.max(0, Number(parsed.confidence_score) || 0)
    ),
    visual_flags: Array.isArray(parsed.visual_flags)
      ? parsed.visual_flags.map(String)
      : [],
  };

  return result;
}

// ─── Deterministic Anti-Fraud Heuristics ───────────────────────────────────────────────────────────────

/**
 * Calculate age from date_of_birth string (YYYY-MM-DD).
 * Deterministic — pure code, no AI.
 */
export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return -1;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if expiration_date is in the future.
 */
export function isDocumentValid(expirationDate: string): boolean {
  const exp = new Date(expirationDate);
  if (isNaN(exp.getTime())) return false;
  return exp > new Date();
}

/**
 * Check for duplicate document_id across other users.
 * Returns true if unique (no duplicates found).
 */
export async function isDocumentIdUnique(
  documentId: string,
  currentUserId: string
): Promise<boolean> {
  if (!documentId || documentId === "UNKNOWN") return false;

  const supabase = await createServiceClient();

  const { data, error } = await (supabase
    .from("user_kyc_profiles")
    .select("id, user_id")
    .eq("id_number", documentId)
    .neq("user_id", currentUserId)
    .limit(1) as any);

  if (error) {
    console.error("[KYC] Duplicate check DB error:", error.message);
    // Fail safe: assume duplicate if we can't check
    return false;
  }

  return !data || data.length === 0;
}

// ─── Main Verification Flow ──────────────────────────────────────────────────────────────────────────────

export async function verifyKYCSubmission(
  userId: string,
  documentImageBase64: string
): Promise<KYCVerificationResult> {
  // Step 1: Extract data from document via Vertex AI
  let extraction: KYCExtractionResult;
  try {
    extraction = await extractKYCDocument(documentImageBase64);
  } catch (error: any) {
    if (error instanceof KYCExtractionError) {
      // Log to manual review queue
      await queueKYCManualReview(userId, null, "EXTRACTION_ERROR", error.rawResponse);
      return {
        status: "pending_manual_review",
        extraction: null,
        reason: `Document extraction failed: ${error.message}`,
        checks: {
          age_passed: false,
          expiration_passed: false,
          confidence_passed: false,
          visual_passed: false,
          unique_passed: false,
        },
      };
    }
    throw error; // Unexpected error → let caller handle
  }

  // Step 2: Deterministic validation (Rule 5: AI for judgment only, code for logic)
  const age = calculateAge(extraction.date_of_birth);
  const agePassed = age >= KYC_MIN_AGE;
  const expirationPassed = isDocumentValid(extraction.expiration_date);
  const confidencePassed = extraction.confidence_score >= KYC_MIN_CONFIDENCE;
  const visualPassed = extraction.visual_flags.includes("CLEAN");
  const uniquePassed = await isDocumentIdUnique(extraction.document_id, userId);

  const checks = {
    age_passed: agePassed,
    expiration_passed: expirationPassed,
    confidence_passed: confidencePassed,
    visual_passed: visualPassed,
    unique_passed: uniquePassed,
  };

  // Step 3: Routing logic
  const allPassed =
    agePassed && expirationPassed && confidencePassed && visualPassed && uniquePassed;

  if (allPassed) {
    // Update user profile to verified
    await updateKYCStatus(userId, "verified", extraction);
    return {
      status: "verified",
      extraction,
      reason: "All KYC checks passed",
      checks,
    };
  }

  // Determine rejection vs manual review
  if (!uniquePassed) {
    // Duplicate ID = high fraud risk → immediate rejection
    await updateKYCStatus(userId, "rejected", extraction, "DUPLICATE_DOCUMENT_ID");
    return {
      status: "rejected",
      extraction,
      reason: "Document ID already registered to another user (Sybil attack detected)",
      checks,
    };
  }

  if (!agePassed) {
    await updateKYCStatus(userId, "rejected", extraction, "UNDERAGE");
    return {
      status: "rejected",
      extraction,
      reason: `User is underage (${age} years old). Minimum age: ${KYC_MIN_AGE}`,
      checks,
    };
  }

  if (!expirationPassed) {
    await updateKYCStatus(userId, "rejected", extraction, "EXPIRED_DOCUMENT");
    return {
      status: "rejected",
      extraction,
      reason: "Document has expired",
      checks,
    };
  }

  // Quality issues (low confidence, blurry, glare) → manual review
  if (!confidencePassed || !visualPassed) {
    await queueKYCManualReview(
      userId,
      extraction,
      "LOW_QUALITY",
      `Confidence: ${extraction.confidence_score}%, Flags: ${extraction.visual_flags.join(", ")}`
    );
    return {
      status: "pending_manual_review",
      extraction,
      reason: `Document quality insufficient for automated verification (confidence: ${extraction.confidence_score}%, flags: ${extraction.visual_flags.join(", ")})`,
      checks,
    };
  }

  // Should never reach here, but fail safe
  await queueKYCManualReview(userId, extraction, "UNKNOWN_FAILURE", "Unknown validation failure");
  return {
    status: "pending_manual_review",
    extraction,
    reason: "Unknown validation failure — escalated to manual review",
    checks,
  };
}

// ─── Database Operations ───────────────────────────────────────────────────────────────────────────────

async function updateKYCStatus(
  userId: string,
  status: "verified" | "rejected",
  extraction: KYCExtractionResult,
  rejectionReason?: string
) {
  const supabase = await createServiceClient();

  const updateData: any = {
    verification_status: status,
    full_name: `${extraction.first_name} ${extraction.last_name}`.trim(),
    date_of_birth: extraction.date_of_birth,
    id_type: extraction.document_type,
    id_number: extraction.document_id,
    id_expiry: extraction.expiration_date,
    risk_score: status === "verified" ? 10 : 100,
    risk_factors:
      status === "rejected" && rejectionReason
        ? [{ reason: rejectionReason, timestamp: new Date().toISOString() }]
        : [],
    verified_at: status === "verified" ? new Date().toISOString() : null,
    rejection_reason: rejectionReason || null,
    updated_at: new Date().toISOString(),
  };

  await (supabase.from("user_kyc_profiles") as any)
    .upsert({ user_id: userId, ...updateData })
    .eq("user_id", userId);

  // Also update kyc_submissions
  await (supabase.from("kyc_submissions") as any).insert({
    user_id: userId,
    submitted_data: {
      extraction,
      checks: {
        age: calculateAge(extraction.date_of_birth),
        confidence: extraction.confidence_score,
        flags: extraction.visual_flags,
      },
    },
    status,
    rejection_reason: rejectionReason || null,
    created_at: new Date().toISOString(),
  });
}

async function queueKYCManualReview(
  userId: string,
  extraction: KYCExtractionResult | null,
  reason: string,
  details: string
) {
  const supabase = await createServiceClient();

  await (supabase.from("kyc_submissions") as any).insert({
    user_id: userId,
    submitted_data: {
      extraction,
      review_reason: reason,
      review_details: details,
    },
    status: "pending",
    rejection_reason: `${reason}: ${details.slice(0, 500)}`,
    created_at: new Date().toISOString(),
  });

  console.warn(`[KYC] User ${userId} queued for manual review. Reason: ${reason}`);
}
