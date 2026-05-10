import { NextRequest, NextResponse } from "next/server";

// AI Resolution Analysis API Route
// Proxies requests to the AI resolution service

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8081";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "AI service unavailable", fallback: true },
      { status: 503 }
    );
  }
}
