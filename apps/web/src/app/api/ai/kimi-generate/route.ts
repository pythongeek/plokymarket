import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

/**
 * POST /api/ai/kimi-generate
 * Generate content using Kimi API (Moonshot)
 * Body: {
 *   prompt: string,
 *   temperature?: number,
 *   useBanglaContext?: boolean
 * }
 * Returns: {
 *   data: any,
 *   confidence: number,
 *   provider: 'kimi',
 *   latency: number
 * }
 */
export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const body = await req.json();
    const { prompt, temperature = 0.3, useBanglaContext = true } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const kimiKey = process.env.KIMI_API_KEY;
    if (!kimiKey) {
      return NextResponse.json(
        { error: 'Kimi API key not configured' },
        { status: 500 }
      );
    }

    // Add Bangla context if requested
    const contextualPrompt = useBanglaContext
      ? `${prompt}\n\nদয়া করে বাংলাদেশের প্রেক্ষাপট বিবেচনা করে বাংলা ভাষায় উপযুক্ত কন্টেন্ট তৈরি করুন।`
      : prompt;

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kimiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: contextualPrompt }],
        temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Kimi Generate] API Error:', errorText);
      return NextResponse.json(
        { error: `Kimi API error: ${response.status}` },
        { status: response.status }
      );
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    const latency = Date.now() - start;

    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from Kimi' },
        { status: 500 }
      );
    }

    // Try to parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch {
      // If not JSON, wrap in object
      parsedData = { content, raw: true };
    }

    // Calculate confidence score
    let confidence = 70;
    if (parsedData && !parsedData.raw) confidence += 10;
    if (/[\u0980-\u09FF]/.test(content)) confidence += 10;
    if (content.length > 200) confidence += 5;

    return NextResponse.json({
      data: parsedData,
      confidence: Math.min(100, confidence),
      provider: 'kimi',
      latency,
      rawResponse: content,
    });
  } catch (error) {
    console.error('[Kimi Generate] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/kimi-generate/health
 * Check Kimi API health
 */
export async function GET(req: NextRequest) {
  const start = Date.now();

  try {
    const kimiKey = process.env.KIMI_API_KEY;
    if (!kimiKey) {
      return NextResponse.json({
        status: 'unconfigured',
        healthy: false,
        message: 'Kimi API key not configured',
      });
    }

    // Simple health check
    const response = await fetch('https://api.moonshot.cn/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kimiKey}`,
      },
    });

    const latency = Date.now() - start;

    if (response.ok) {
      return NextResponse.json({
        status: 'healthy',
        healthy: true,
        latency,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        healthy: false,
        statusCode: response.status,
        latency,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      healthy: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
