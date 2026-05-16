/**
 * Module D Phase 4 Tests — Vertex AI KYC Verification
 * Intent-based tests (Rule 9): encode WHY behavior matters.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateAge,
  isDocumentValid,
  extractKYCDocument,
  verifyKYCSubmission,
  KYC_MIN_CONFIDENCE,
  KYC_MIN_AGE,
  KYCExtractionError,
  type KYCExtractionResult,
} from "./vertex-kyc-service";

// Mock vertex-client
vi.mock("@/lib/ai/vertex-client", () => ({
  callVertexAI: vi.fn(),
}));

// Mock supabase server
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
      })),
      upsert: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      insert: vi.fn(() => ({ error: null })),
    })),
  })),
}));

import { callVertexAI } from "@/lib/ai/vertex-client";

describe("KYC Deterministic Heuristics", () => {
  describe("calculateAge", () => {
    it("returns correct age for adult born 20 years ago", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 20);
      const age = calculateAge(dob.toISOString().split("T")[0]);
      expect(age).toBe(20);
      expect(age).toBeGreaterThanOrEqual(KYC_MIN_AGE);
    });

    it("returns 17 for someone born 17 years ago (underage)", () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 17);
      const age = calculateAge(dob.toISOString().split("T")[0]);
      expect(age).toBe(17);
      expect(age).toBeLessThan(KYC_MIN_AGE);
    });

    it("returns -1 for invalid date", () => {
      expect(calculateAge("not-a-date")).toBe(-1);
    });
  });

  describe("isDocumentValid", () => {
    it("returns true for future expiration date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(isDocumentValid(future.toISOString().split("T")[0])).toBe(true);
    });

    it("returns false for past expiration date", () => {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 1);
      expect(isDocumentValid(past.toISOString().split("T")[0])).toBe(false);
    });

    it("returns false for invalid date", () => {
      expect(isDocumentValid("invalid")).toBe(false);
    });
  });
});

describe("KYC Extraction from Vertex AI", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("parses valid JSON response correctly", async () => {
    const mockResponse = {
      text: JSON.stringify({
        document_type: "PASSPORT",
        document_id: "AB123456",
        first_name: "John",
        last_name: "Doe",
        date_of_birth: "1990-05-15",
        expiration_date: "2030-05-15",
        confidence_score: 95,
        visual_flags: ["CLEAN"],
      }),
    };
    vi.mocked(callVertexAI).mockResolvedValueOnce(mockResponse as any);

    const result = await extractKYCDocument("fakebase64");
    expect(result.document_type).toBe("PASSPORT");
    expect(result.document_id).toBe("AB123456");
    expect(result.confidence_score).toBe(95);
    expect(result.visual_flags).toContain("CLEAN");
  });

  it("extracts JSON from markdown code block", async () => {
    const mockResponse = {
      text: '```json\n{"document_type":"NATIONAL_ID","document_id":"ID789","first_name":"Jane","last_name":"Smith","date_of_birth":"1985-03-20","expiration_date":"2028-03-20","confidence_score":92,"visual_flags":["CLEAN"]}\n```',
    };
    vi.mocked(callVertexAI).mockResolvedValueOnce(mockResponse as any);

    const result = await extractKYCDocument("fakebase64");
    expect(result.first_name).toBe("Jane");
    expect(result.confidence_score).toBe(92);
  });

  it("throws KYCExtractionError on invalid JSON", async () => {
    vi.mocked(callVertexAI).mockResolvedValueOnce({ text: "not json at all" } as any);

    await expect(extractKYCDocument("fakebase64")).rejects.toThrow(KYCExtractionError);
  });

  it("throws KYCExtractionError on missing required fields", async () => {
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify({ document_type: "PASSPORT", confidence_score: 50 }),
    } as any);

    await expect(extractKYCDocument("fakebase64")).rejects.toThrow(KYCExtractionError);
  });

  it("clamps confidence_score to 0-100 range", async () => {
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify({
        document_type: "PASSPORT",
        document_id: "X",
        first_name: "A",
        last_name: "B",
        date_of_birth: "1990-01-01",
        expiration_date: "2030-01-01",
        confidence_score: 150,
        visual_flags: ["CLEAN"],
      }),
    } as any);

    const result = await extractKYCDocument("fakebase64");
    expect(result.confidence_score).toBe(100);
  });
});

describe("KYC Verification Flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const validExtraction: KYCExtractionResult = {
    document_type: "PASSPORT",
    document_id: "UNIQUE123",
    first_name: "John",
    last_name: "Doe",
    date_of_birth: "1990-05-15",
    expiration_date: "2030-05-15",
    confidence_score: 95,
    visual_flags: ["CLEAN"],
  };

  it("A (Happy Path): all checks pass → verified", async () => {
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(validExtraction),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.status).toBe("verified");
    expect(result.checks.age_passed).toBe(true);
    expect(result.checks.confidence_passed).toBe(true);
    expect(result.checks.unique_passed).toBe(true);
  });

  it("B (Underage): 17 years old → rejected", async () => {
    const underage = {
      ...validExtraction,
      date_of_birth: new Date(new Date().setFullYear(new Date().getFullYear() - 17))
        .toISOString()
        .split("T")[0],
    };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(underage),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.status).toBe("rejected");
    expect(result.checks.age_passed).toBe(false);
    expect(result.reason).toContain("underage");
  });

  it("C (Blurry/Low Confidence): 80% confidence + BLURRY → pending_manual_review", async () => {
    const lowQuality = {
      ...validExtraction,
      confidence_score: 80,
      visual_flags: ["BLURRY"],
    };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(lowQuality),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.status).toBe("pending_manual_review");
    expect(result.checks.confidence_passed).toBe(false);
    expect(result.checks.visual_passed).toBe(false);
  });

  it("D (Expired Document): past expiration → rejected", async () => {
    const expired = {
      ...validExtraction,
      expiration_date: "2020-01-01",
    };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(expired),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.status).toBe("rejected");
    expect(result.checks.expiration_passed).toBe(false);
  });

  it("E (Parsing Failure): malformed Vertex output → pending_manual_review with EXTRACTION_ERROR", async () => {
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: "This is just random text, not JSON",
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.status).toBe("pending_manual_review");
    expect(result.extraction).toBeNull();
    expect(result.reason).toContain("extraction failed");
  });

  it("F (Confidence exactly 90): passes threshold", async () => {
    const borderline = { ...validExtraction, confidence_score: 90 };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(borderline),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.checks.confidence_passed).toBe(true);
    expect(result.status).toBe("verified");
  });

  it("G (Confidence 89): fails threshold → manual review", async () => {
    const borderline = { ...validExtraction, confidence_score: 89 };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(borderline),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.checks.confidence_passed).toBe(false);
    expect(result.status).toBe("pending_manual_review");
  });

  it("H (No CLEAN flag): fails visual check → manual review", async () => {
    const noClean = { ...validExtraction, visual_flags: ["GLARE", "CROPPED"] };
    vi.mocked(callVertexAI).mockResolvedValueOnce({
      text: JSON.stringify(noClean),
    } as any);

    const result = await verifyKYCSubmission("user-1", "fakebase64");
    expect(result.checks.visual_passed).toBe(false);
    expect(result.status).toBe("pending_manual_review");
  });
});
