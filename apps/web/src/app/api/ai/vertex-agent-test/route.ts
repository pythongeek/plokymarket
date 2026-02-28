/**
 * Vertex AI Agent Test Endpoint
 * Tests Vertex AI Agent connectivity in GCP environment
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkVertexAgentHealth, generateEventWithAgent } from '@/lib/ai/vertex-agent';

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      platform: 'Google Cloud Run',
      project: process.env.GOOGLE_CLOUD_PROJECT || 'not-set',
      location: process.env.VERTEX_LOCATION || 'asia-south1',
    },
    tests: {}
  };

  // Test 1: Health Check
  results.tests.health = await checkVertexAgentHealth();

  // Test 2: Generate Event
  if (results.tests.health.healthy) {
    try {
      const eventResult = await generateEventWithAgent(
        'বাংলাদেশ প্রিমিয়ার লিগ ২০২৬ এর চ্যাম্পিয়ন কে হবে?'
      );
      results.tests.eventGeneration = eventResult;
    } catch (error: any) {
      results.tests.eventGeneration = {
        success: false,
        error: error.message,
      };
    }
  }

  // Overall status
  results.overall = {
    healthy: results.tests.health?.healthy || false,
    canGenerateEvents: results.tests.eventGeneration?.success || false,
  };

  const statusCode = results.overall.healthy ? 200 : 503;
  
  return NextResponse.json(results, { status: statusCode });
}

export async function POST(req: NextRequest) {
  try {
    const { rawInput } = await req.json();
    
    if (!rawInput) {
      return NextResponse.json(
        { error: 'rawInput is required' },
        { status: 400 }
      );
    }

    const result = await generateEventWithAgent(rawInput);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
