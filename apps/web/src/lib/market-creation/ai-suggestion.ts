/**
 * Gemini AI Event Suggestion Service
 * Uses Google Gemini to suggest complete event listings with markets.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface AISuggestedEvent {
    title: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
    startDate: string;
    endDate: string;
    imagePrompt: string;
    markets: AISuggestedMarket[];
}

export interface AISuggestedMarket {
    question: string;
    description: string;
    type: 'binary' | 'categorical';
    outcomes: { id: string; label: string }[];
    resolutionSource: string;
    resolutionCriteria: string;
    suggestedDeadline: string;
}

/**
 * Ask Gemini to suggest a complete event listing with markets.
 * @param prompt - A topic, news headline, or area of interest
 * @param context - Optional additional context (category preference, region, etc.)
 */
export async function suggestEventWithGemini(
    prompt: string,
    context?: { category?: string; region?: string; numMarkets?: number }
): Promise<AISuggestedEvent> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const numMarkets = context?.numMarkets || 3;
    const regionCtx = context?.region ? ` Focus on the ${context.region} region.` : ' Focus on Bangladesh context.';
    const categoryCtx = context?.category ? ` Category preference: ${context.category}.` : '';

    const systemPrompt = `You are an expert prediction market creator for a Polymarket-style platform.
Given a topic or news headline, generate a complete Event listing with ${numMarkets} tradable Markets.${regionCtx}${categoryCtx}

RULES:
- Events group related markets. Markets are specific tradable propositions.
- Markets should be binary (Yes/No) or categorical (multiple outcomes).
- Resolution criteria must be specific, verifiable, and unambiguous.
- Dates should be realistic ISO-8601 format relative to today (${new Date().toISOString().split('T')[0]}).
- slug should be lowercase with hyphens, no spaces.
- tags should be relevant keywords.
- imagePrompt should describe a good cover image for the event.

Respond ONLY with valid JSON matching this exact structure (no markdown, no explanation):
{
  "title": "Event Title",
  "slug": "event-slug",
  "description": "1-2 sentence event description",
  "category": "Category (Politics|Sports|Crypto|Entertainment|Economy|Technology|Weather|Other)",
  "tags": ["tag1", "tag2"],
  "startDate": "2024-01-15",
  "endDate": "2024-06-30",
  "imagePrompt": "Description for cover image",
  "markets": [
    {
      "question": "Will X happen by Y?",
      "description": "Market description",
      "type": "binary",
      "outcomes": [{"id": "yes", "label": "Yes"}, {"id": "no", "label": "No"}],
      "resolutionSource": "Official source name",
      "resolutionCriteria": "Specific criteria for resolution",
      "suggestedDeadline": "2024-06-30"
    }
  ]
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nTOPIC: ${prompt}` }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
        throw new Error('No response from Gemini');
    }

    // Parse JSON from response
    try {
        const parsed = JSON.parse(textContent) as AISuggestedEvent;

        // Validate required fields
        if (!parsed.title || !parsed.markets || parsed.markets.length === 0) {
            throw new Error('Invalid suggestion structure');
        }

        return parsed;
    } catch (parseError) {
        // Try to extract JSON from markdown code blocks if Gemini wrapped it
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) ||
            textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const cleanJson = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(cleanJson) as AISuggestedEvent;
        }
        throw new Error(`Failed to parse Gemini response: ${parseError}`);
    }
}
