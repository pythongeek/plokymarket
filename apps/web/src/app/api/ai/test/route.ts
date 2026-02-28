/**
 * AI API Test Endpoint
 * Tests both Vertex AI and Kimi API connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { isKimiConfigured, callKimiAPI } from '@/lib/ai/kimi-client';

// Test using direct Gemini API with API Key (for AI Studio key)
async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY not set' };
  }

  try {
    // Try AI Studio API endpoint first (generativelanguage.googleapis.com)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Respond with {"status": "ok"}' }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Gemini API error (${response.status}): ${error}`,
        note: 'If using Vertex AI service account, please ensure GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is set instead'
      };
    }

    const data = await response.json();
    return {
      success: true,
      model: 'gemini-1.5-flash',
      provider: 'AI Studio',
      response: data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100)
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { getVertexClient } from '@/lib/ai/vertex-client';

// Test using Vertex AI with Service Account
async function testVertexAI() {
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64Key) {
    return { success: false, error: 'GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 not set' };
  }

  try {
    const client = getVertexClient();
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
      generationConfig: { maxOutputTokens: 50 },
    });

    const start = Date.now();
    const result = await model.generateContent('Respond with {"status": "ok"}');
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsed = response;
    try {
      if (response) {
        const mdMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (mdMatch) parsed = JSON.parse(mdMatch[1].trim());
        else parsed = JSON.parse(response);
      }
    } catch (e) { }

    return {
      success: true,
      model: 'gemini-1.5-flash-002',
      provider: 'Vertex AI',
      latencyMs: Date.now() - start,
      response: parsed
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET(req: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Environment Variables
  results.tests.env = {
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT ? '✅ Set' : '❌ Missing',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
    GOOGLE_SERVICE_ACCOUNT_KEY_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 ? '✅ Set' : '❌ Missing',
    KIMI_API_KEY: isKimiConfigured() ? '✅ Set' : '❌ Missing'
  };

  // Test 2: Gemini API (AI Studio)
  results.tests.gemini = await testGeminiAPI();

  // Test 3: Vertex AI (Service Account)
  if (!results.tests.gemini.success) {
    results.tests.vertex = await testVertexAI();
  }

  // Test 4: Kimi API
  try {
    if (!isKimiConfigured()) {
      results.tests.kimi = {
        success: false,
        error: 'KIMI_API_KEY not configured'
      };
    } else {
      const start = Date.now();
      const kimiResult = await callKimiAPI([
        { role: 'user', content: 'Respond with {"status": "ok"}' }
      ], { maxTokens: 50 });

      results.tests.kimi = {
        success: true,
        model: 'kimi-k1.5',
        latencyMs: Date.now() - start,
        response: kimiResult.choices[0]?.message?.content?.substring(0, 100)
      };
    }
  } catch (error: any) {
    results.tests.kimi = {
      success: false,
      error: error.message
    };
  }

  // Overall status
  results.overall = {
    geminiWorking: results.tests.gemini?.success || false,
    vertexWorking: results.tests.vertex?.success || false,
    kimiWorking: results.tests.kimi?.success || false,
    atLeastOneWorking:
      (results.tests.gemini?.success || false) ||
      (results.tests.vertex?.success || false) ||
      (results.tests.kimi?.success || false)
  };

  const statusCode = results.overall.atLeastOneWorking ? 200 : 503;

  return NextResponse.json(results, { status: statusCode });
}
