/**
 * Slug Generation Agent
 * Creates SEO-friendly, URL-safe slugs from event titles
 * Supports Bengali to English transliteration
 */

import { getModel, executeWithRetry, parseJSONResponse, MODELS } from "../vertex-client";
import { SLUG_AGENT_PROMPT } from "../prompts/eventPrompts";

export interface SlugGenerationResult {
  slug: string;
  title: string;
  language: "bn" | "en" | "mixed";
  keywords: string[];
  transliterationNotes?: string;
}

/**
 * Generate URL-safe slug from event title
 */
export async function generateSlug(title: string): Promise<SlugGenerationResult> {
  return executeWithRetry(async () => {
    const model = getModel({
      modelName: MODELS.SLUG_GENERATOR.modelName,
      systemInstruction: SLUG_AGENT_PROMPT,
      temperature: MODELS.SLUG_GENERATOR.temperature,
      maxOutputTokens: MODELS.SLUG_GENERATOR.maxOutputTokens,
      responseMimeType: "application/json",
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `Generate slug for: "${title}"` }],
      }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("Empty response from model");
    }

    const parsed = parseJSONResponse(text);
    
    // Validate response structure
    if (!parsed.slug || !parsed.title) {
      throw new Error("Invalid response structure from model");
    }

    // Additional sanitization
    const sanitizedSlug = parsed.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 60);

    return {
      slug: sanitizedSlug,
      title: parsed.title,
      language: parsed.language || detectLanguage(title),
      keywords: parsed.keywords || [],
      transliterationNotes: parsed.transliterationNotes,
    };
  }, { retries: 3, backoffMs: 500 });
}

/**
 * Fallback slug generation without AI
 */
export function generateSlugFallback(title: string): SlugGenerationResult {
  const language = detectLanguage(title);
  
  // Basic transliteration for common Bengali words
  let transliterated = title
    .replace(/বিপিএল/gi, "bpl")
    .replace(/বাংলাদেশ/gi, "bangladesh")
    .replace(/ক্রিকেট/gi, "cricket")
    .replace(/নির্বাচন/gi, "election")
    .replace(/জিতবে/gi, "win")
    .replace(/হারবে/gi, "lose")
    .replace(/ঢাকা/gi, "dhaka")
    .replace(/চট্টগ্রাম/gi, "chittagong")
    .replace(/চট্টগ্রাম/gi, "chattogram")
    .replace(/সিলেট/gi, "sylhet")
    .replace(/রাজশাহী/gi, "rajshahi")
    .replace(/খুলনা/gi, "khulna");

  const slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);

  return {
    slug,
    title: transliterated,
    language,
    keywords: extractKeywords(transliterated),
  };
}

/**
 * Detect language of text
 */
function detectLanguage(text: string): "bn" | "en" | "mixed" {
  const bengaliChars = /[\u0980-\u09FF]/;
  const hasBengali = bengaliChars.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasBengali && hasEnglish) return "mixed";
  return hasBengali ? "bn" : "en";
}

/**
 * Extract keywords from title
 */
function extractKeywords(title: string): string[] {
  const stopWords = new Set(["the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "will"]);
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}
