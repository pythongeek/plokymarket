/**
 * Vertex AI REST API Client
 * Uses direct REST API calls with API key authentication
 * Works on Vercel without Docker
 */

const VERTEX_API_BASE = 'https://asia-south1-aiplatform.googleapis.com/v1';

/**
 * Get access token from service account key
 * This runs server-side only
 */
async function getAccessToken(): Promise<string | null> {
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!base64Key) {
    console.error('[Vertex REST] No service account key found');
    return null;
  }

  try {
    const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedKey);

    // Fix potential literal newline escaping issues common in Vercel envs
    if (credentials?.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    // Create JWT for service account
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    const jwtHeader = Buffer.from(JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
      kid: credentials.private_key_id
    })).toString('base64url');

    const jwtClaim = Buffer.from(JSON.stringify({
      iss: credentials.client_email,
      sub: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry
    })).toString('base64url');

    // Note: In production, you should use a JWT library to sign
    // For now, we'll use a simpler approach with the API key
    return null;
  } catch (error) {
    console.error('[Vertex REST] Failed to parse credentials:', error);
    return null;
  }
}

/**
 * Alternative: Use API key directly if available
 */
function getApiKey(): string | null {
  return process.env.VERTEX_API_KEY || null;
}

/**
 * Generate content using Vertex AI REST API
 */
export async function generateWithVertexREST(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
) {
  const project = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0578182636';
  const location = process.env.VERTEX_LOCATION || 'asia-south1';
  const {
    model = 'gemini-1.5-flash',
    temperature = 0.2,
    maxOutputTokens = 2048,
  } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('VERTEX_API_KEY not configured');
  }

  const url = `${VERTEX_API_BASE}/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        topP: 0.8,
        topK: 40,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vertex AI API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text,
    model,
    usage: data.usageMetadata,
  };
}

/**
 * Check Vertex AI REST API health
 */
export async function checkVertexRESTHealth() {
  const start = Date.now();

  try {
    const result = await generateWithVertexREST('Say "ok"', { maxOutputTokens: 10 });

    return {
      healthy: true,
      latencyMs: Date.now() - start,
      model: 'gemini-1.5-flash',
      response: result.content,
    };
  } catch (error: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Generate event content with Vertex AI
 */
export async function generateEventWithVertex(rawInput: string) {
  const systemPrompt = `You are an expert event creator for Plokymarket, a Bangladeshi prediction market platform.

Create an engaging prediction market event based on the user's input.

Respond in JSON format:
{
  "title": "Event title in Bengali",
  "description": "Detailed description in Bengali", 
  "category": "One of: Sports, Politics, Crypto, Weather, Entertainment, Other",
  "subcategory": "Specific subcategory",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedResolutionDate": "2026-03-15T00:00:00+06:00",
  "confidence": 0.85
}`;

  const prompt = `${systemPrompt}\n\nUser Input: "${rawInput}"`;

  try {
    const result = await generateWithVertexREST(prompt, {
      model: 'gemini-1.5-pro',
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    const parsed = JSON.parse(result.content || '{}');

    return {
      success: true,
      data: parsed,
      provider: 'vertex-rest',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
