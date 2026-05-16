/**
 * QStash Signature Verification
 *
 * Enforces strict signature checking on all QStash webhook endpoints.
 * Uses Upstash Receiver to verify JWT signatures from QStash.
 *
 * Security: Without valid signature, ANY request to QStash endpoints
 * is rejected with 401/403 to prevent spoofing.
 */

import { Receiver } from "@upstash/qstash";
import { NextRequest, NextResponse } from "next/server";

const CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

function getReceiver(): Receiver | null {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY || CURRENT_SIGNING_KEY;
  if (!currentKey) {
    console.error("[QStash] QSTASH_CURRENT_SIGNING_KEY not set");
    return null;
  }
  return new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || NEXT_SIGNING_KEY || undefined,
  });
}

/**
 * Verify QStash signature on incoming request.
 * Returns true if valid, false otherwise.
 */
export async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const r = getReceiver();
  if (!r) {
    console.error("[QStash] Receiver not initialized — cannot verify signature");
    return false;
  }

  try {
    // Extract signature from Upstash-Signature header
    const signature = request.headers.get("upstash-signature") || "";
    if (!signature) {
      console.warn("[QStash] Missing Upstash-Signature header");
      return false;
    }

    // Read body for verification
    const body = await request.text();

    // Verify using Upstash Receiver
    const isValid = await r.verify({
      signature,
      body,
    });

    return isValid;
  } catch (error: any) {
    console.error("[QStash] Signature verification error:", error.message);
    return false;
  }
}

/**
 * Middleware wrapper: rejects requests without valid QStash signature.
 * Usage: wrap your POST handler with this.
 */
export function withQStashAuth(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized — invalid or missing QStash signature" },
        { status: 401 }
      );
    }
    return handler(request);
  };
}
