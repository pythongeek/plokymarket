/**
 * Content Generation Agent
 * Generates event descriptions with resolution criteria
 * Optimized for Bangladesh context
 */

import { getModel, executeWithRetry, parseJSONResponse, MODELS } from "../vertex-client";
import { CONTENT_AGENT_PROMPT } from "../prompts/eventPrompts";

export interface ResolutionCriteria {
  yes: string;
  no: string;
  edgeCases: string;
}

export interface ResolutionSource {
  name: string;
  url: string;
  alternativeSources?: string[];
}

export interface ContentResult {
  description: string;
  resolutionCriteria: ResolutionCriteria;
  resolutionSource: ResolutionSource;
  context: string;
  language: "bn" | "en" | "mixed";
  suggestedResolutionDate?: string;
}

/**
 * Generate event content
 */
export async function generateContent(
  title: string,
  category: string,
  existingDescription?: string
): Promise<ContentResult> {
  return executeWithRetry(async () => {
    const model = getModel({
      modelName: MODELS.CONTENT_GENERATOR.modelName,
      systemInstruction: CONTENT_AGENT_PROMPT,
      temperature: MODELS.CONTENT_GENERATOR.temperature,
      maxOutputTokens: MODELS.CONTENT_GENERATOR.maxOutputTokens,
      responseMimeType: "application/json",
    });

    const inputText = existingDescription
      ? `Title: "${title}"\nCategory: ${category}\nExisting Description: "${existingDescription}"\n\nGenerate complete event content.`
      : `Title: "${title}"\nCategory: ${category}\n\nGenerate complete event content.`;

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
    
    return {
      description: parsed.description || "",
      resolutionCriteria: {
        yes: parsed.resolutionCriteria?.yes || "",
        no: parsed.resolutionCriteria?.no || "",
        edgeCases: parsed.resolutionCriteria?.edgeCases || "",
      },
      resolutionSource: {
        name: parsed.resolutionSource?.name || "",
        url: parsed.resolutionSource?.url || "",
        alternativeSources: parsed.resolutionSource?.alternativeSources || [],
      },
      context: parsed.context || "",
      language: parsed.language || "en",
      suggestedResolutionDate: parsed.suggestedResolutionDate,
    };
  }, { retries: 3, backoffMs: 500 });
}

/**
 * Fallback content generation
 */
export function generateContentFallback(
  title: string, 
  category: string
): ContentResult {
  const language = detectLanguage(title);
  
  // Get category-specific templates
  const templates = getCategoryTemplates(category);
  
  return {
    description: templates.description(title),
    resolutionCriteria: {
      yes: templates.yesCriteria,
      no: templates.noCriteria,
      edgeCases: templates.edgeCases,
    },
    resolutionSource: templates.source,
    context: templates.context,
    language,
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
 * Get templates based on category
 */
function getCategoryTemplates(category: string) {
  const templates: Record<string, {
    description: (title: string) => string;
    yesCriteria: string;
    noCriteria: string;
    edgeCases: string;
    source: ResolutionSource;
    context: string;
  }> = {
    politics: {
      description: (title) => `This market predicts the outcome of: ${title}. The resolution will be based on official results from the Bangladesh Election Commission or relevant government authority.`,
      yesCriteria: "The event occurs as specified in the market question.",
      noCriteria: "The event does not occur as specified in the market question.",
      edgeCases: "In case of disputed results, the decision of the Election Commission will be final. If the election is postponed or cancelled, the market will be resolved as invalid.",
      source: {
        name: "Bangladesh Election Commission",
        url: "https://www.eci.gov.bd",
        alternativeSources: ["Official Government Gazette"],
      },
      context: "Political events in Bangladesh can be subject to rapid changes. Traders should monitor news closely.",
    },
    sports: {
      description: (title) => `This market predicts: ${title}. The resolution will be based on official match results.`,
      yesCriteria: "The specified team/player achieves the outcome stated in the question.",
      noCriteria: "The specified team/player does not achieve the outcome stated in the question.",
      edgeCases: "If the match is cancelled or abandoned, the market will be resolved based on official rules of the governing body. For rain-affected matches, DLS method results will be considered official.",
      source: {
        name: "Bangladesh Cricket Board / ESPN Cricinfo",
        url: "https://www.tigercricket.com.bd",
        alternativeSources: ["https://www.espncricinfo.com"],
      },
      context: "Sports events can be affected by weather conditions. Check weather forecasts for outdoor events.",
    },
    crypto: {
      description: (title) => `This market predicts: ${title}. Resolution will be based on price data from major exchanges.`,
      yesCriteria: "The specified price level or event occurs within the specified timeframe.",
      noCriteria: "The specified price level or event does not occur within the specified timeframe.",
      edgeCases: "Price data will be taken from CoinMarketCap or CoinGecko at the specified time. In case of exchange outages, the average of available exchanges will be used.",
      source: {
        name: "CoinMarketCap / CoinGecko",
        url: "https://coinmarketcap.com",
        alternativeSources: ["https://www.coingecko.com"],
      },
      context: "Cryptocurrency markets are highly volatile. Prices can change rapidly.",
    },
    economics: {
      description: (title) => `This market predicts: ${title}. Resolution will be based on official government or central bank data.`,
      yesCriteria: "The specified economic indicator meets or exceeds the threshold stated in the question.",
      noCriteria: "The specified economic indicator does not meet the threshold stated in the question.",
      edgeCases: "Data will be taken from official Bangladesh Bank or BBS publications. Revised data will be considered if published before resolution date.",
      source: {
        name: "Bangladesh Bank",
        url: "https://www.bb.org.bd",
        alternativeSources: ["Bangladesh Bureau of Statistics"],
      },
      context: "Economic data releases follow scheduled calendars. Check the Bangladesh Bank website for publication dates.",
    },
    weather: {
      description: (title) => `This market predicts: ${title}. Resolution will be based on official meteorological data.`,
      yesCriteria: "The specified weather condition occurs as stated in the question.",
      noCriteria: "The specified weather condition does not occur as stated in the question.",
      edgeCases: "Data will be taken from Bangladesh Meteorological Department. Measurements from Dhaka station will be used unless otherwise specified.",
      source: {
        name: "Bangladesh Meteorological Department",
        url: "http://www.bmd.gov.bd",
        alternativeSources: ["Regional weather stations"],
      },
      context: "Weather predictions are inherently uncertain. Multiple sources may be consulted for verification.",
    },
    default: {
      description: (title) => `This market predicts: ${title}.`,
      yesCriteria: "The event occurs as specified in the market question.",
      noCriteria: "The event does not occur as specified in the market question.",
      edgeCases: "In case of ambiguity, the market creator's intent will be considered, subject to community review.",
      source: {
        name: "Authoritative Source",
        url: "",
        alternativeSources: [],
      },
      context: "Please review the resolution criteria carefully before trading.",
    },
  };
  
  return templates[category] || templates.default;
}
