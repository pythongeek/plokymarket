/**
 * Category Classification Agent
 * Classifies events into appropriate categories with Bangladesh context
 */

import { getModel, executeWithRetry, parseJSONResponse, MODELS } from "../vertex-client";
import { CATEGORY_AGENT_PROMPT } from "../prompts/eventPrompts";

export type Category = 
  | "politics" 
  | "sports" 
  | "crypto" 
  | "economics" 
  | "weather" 
  | "entertainment" 
  | "technology" 
  | "international";

export type Subcategory = 
  | "election" | "by-election" | "local-election" | "national-election" | "policy"
  | "cricket" | "football" | "bpl" | "world-cup" | "asia-cup" | "t20" | "test" | "odi"
  | "bitcoin" | "ethereum" | "altcoin" | "defi" | "nft" | "regulation"
  | "stock-market" | "forex" | "gdp" | "inflation" | "budget" | "trade"
  | "cyclone" | "flood" | "rainfall" | "temperature" | "earthquake"
  | string;

export type EventTag = 
  | "bd-local" 
  | "high-impact" 
  | "time-sensitive" 
  | "international";

export interface CategoryResult {
  primary: Category;
  secondary: Subcategory[];
  tags: EventTag[];
  confidence: number;
  reasoning: string;
  bangladeshContext: {
    isLocal: boolean;
    relevantEntities: string[];
    suggestedAuthority: string;
  };
}

/**
 * Classify event category
 */
export async function classifyCategory(
  title: string, 
  description?: string
): Promise<CategoryResult> {
  return executeWithRetry(async () => {
    const model = getModel({
      modelName: MODELS.CATEGORY_CLASSIFIER.modelName,
      systemInstruction: CATEGORY_AGENT_PROMPT,
      temperature: MODELS.CATEGORY_CLASSIFIER.temperature,
      maxOutputTokens: MODELS.CATEGORY_CLASSIFIER.maxOutputTokens,
      responseMimeType: "application/json",
    });

    const inputText = description 
      ? `Title: "${title}"\nDescription: "${description}"\n\nClassify this event.`
      : `Title: "${title}"\n\nClassify this event.`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: inputText }],
      }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("Empty response from model");
    }

    const parsed = parseJSONResponse(text);
    
    // Validate and set defaults
    return {
      primary: parsed.primary || "international",
      secondary: parsed.secondary || [],
      tags: parsed.tags || [],
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || "No reasoning provided",
      bangladeshContext: {
        isLocal: parsed.bangladeshContext?.isLocal || false,
        relevantEntities: parsed.bangladeshContext?.relevantEntities || [],
        suggestedAuthority: parsed.bangladeshContext?.suggestedAuthority || "",
      },
    };
  }, { retries: 3, backoffMs: 500 });
}

/**
 * Fallback category classification using rules
 */
export function classifyCategoryFallback(title: string): CategoryResult {
  const lowerTitle = title.toLowerCase();
  
  // Bangladesh context detection
  const bdKeywords = [
    "bangladesh", "dhaka", "chittagong", "chattogram", "sylhet", 
    "rajshahi", "khulna", "bdt", "taka", "বাংলাদেশ", "ঢাকা"
  ];
  const isLocal = bdKeywords.some(kw => lowerTitle.includes(kw));
  
  // Category detection
  let primary: Category = "international";
  let secondary: Subcategory[] = [];
  let tags: EventTag[] = isLocal ? ["bd-local"] : [];
  
  // Politics
  if (/\b(election|vote|poll|government|minister|parliament|nirbachon|ভোট)\b/.test(lowerTitle)) {
    primary = "politics";
    secondary.push("national-election");
    tags.push("high-impact");
  }
  // Sports - Cricket
  else if (/\b(cricket|bpl|ipl|world cup|t20|odi|test|match|ক্রিকেট|বিপিএল)\b/.test(lowerTitle)) {
    primary = "sports";
    secondary.push("cricket");
    if (lowerTitle.includes("bpl") || lowerTitle.includes("বিপিএল")) {
      secondary.push("bpl");
    }
    if (/\b(final|semi-final|playoff|championship)\b/.test(lowerTitle)) {
      tags.push("high-impact");
    }
  }
  // Sports - Football
  else if (/\b(football|soccer|fifa|world cup|premier league|fifa|ফুটবল)\b/.test(lowerTitle)) {
    primary = "sports";
    secondary.push("football");
  }
  // Crypto
  else if (/\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|blockchain|nft|defi)\b/.test(lowerTitle)) {
    primary = "crypto";
    if (lowerTitle.includes("bitcoin") || lowerTitle.includes("btc")) {
      secondary.push("bitcoin");
    } else if (lowerTitle.includes("ethereum") || lowerTitle.includes("eth")) {
      secondary.push("ethereum");
    }
  }
  // Economics
  else if (/\b(stock|market|gdp|inflation|economy|budget|forex|dse|cse|exchange rate)\b/.test(lowerTitle)) {
    primary = "economics";
    if (lowerTitle.includes("stock") || lowerTitle.includes("dse") || lowerTitle.includes("cse")) {
      secondary.push("stock-market");
    } else if (lowerTitle.includes("inflation")) {
      secondary.push("inflation");
    }
  }
  // Weather
  else if (/\b(weather|temperature|rain|cyclone|storm|flood|weather|বৃষ্টি|ঝড়)\b/.test(lowerTitle)) {
    primary = "weather";
    if (lowerTitle.includes("cyclone") || lowerTitle.includes("flood")) {
      secondary.push("cyclone");
      tags.push("high-impact");
    }
  }
  // Entertainment
  else if (/\b(movie|film|oscar|grammy|nobel|award|actor|actress)\b/.test(lowerTitle)) {
    primary = "entertainment";
  }
  // Technology
  else if (/\b(ai|artificial intelligence|tech|launch|apple|google|microsoft|tesla)\b/.test(lowerTitle)) {
    primary = "technology";
  }
  
  // Determine authority
  const authorityMap: Record<Category, string> = {
    politics: "Bangladesh Election Commission",
    sports: "Bangladesh Cricket Board",
    crypto: "CoinMarketCap / CoinGecko",
    economics: "Bangladesh Bank",
    weather: "Bangladesh Meteorological Department",
    entertainment: "Official Award Committee",
    technology: "Company Official Announcement",
    international: "Reuters / BBC",
  };
  
  return {
    primary,
    secondary,
    tags,
    confidence: 0.6,
    reasoning: "Rule-based classification fallback",
    bangladeshContext: {
      isLocal,
      relevantEntities: extractEntities(lowerTitle),
      suggestedAuthority: authorityMap[primary],
    },
  };
}

/**
 * Extract relevant entities from title
 */
function extractEntities(title: string): string[] {
  const entities: string[] = [];
  
  // Cities
  const cities = ["dhaka", "chittagong", "chattogram", "sylhet", "rajshahi", "khulna"];
  cities.forEach(city => {
    if (title.includes(city)) entities.push(city);
  });
  
  // Teams
  const teams = ["tigers", "comilla", "dhaka", "chattogram", "sylhet", "khulna", "rangpur"];
  teams.forEach(team => {
    if (title.includes(team)) entities.push(team);
  });
  
  return entities;
}
