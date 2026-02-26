/**
 * Validation Agent
 * Validates event quality and identifies risks
 */

import { getModel, executeWithRetry, parseJSONResponse, MODELS } from "../vertex-client";
import { VALIDATION_AGENT_PROMPT } from "../prompts/eventPrompts";

export type RiskSeverity = "low" | "medium" | "high";
export type RiskCategory = "ambiguity" | "source" | "timing" | "duplicate" | "sensitive";
export type Recommendation = "approve" | "review" | "revise" | "reject";

export interface Risk {
  severity: RiskSeverity;
  category: RiskCategory;
  description: string;
  suggestion: string;
}

export interface ValidationBreakdown {
  titleQuality: number;
  descriptionQuality: number;
  resolutionCriteria: number;
  resolutionSource: number;
  feasibility: number;
}

export interface ValidationResult {
  score: number;
  recommendation: Recommendation;
  breakdown: ValidationBreakdown;
  risks: Risk[];
  improvements: string[];
  confidence: number;
}

/**
 * Validate event data
 */
export async function validateEvent(eventData: {
  title: string;
  slug: string;
  category: string;
  description?: string;
  resolutionCriteria?: {
    yes?: string;
    no?: string;
    edgeCases?: string;
  };
  resolutionSource?: {
    name?: string;
    url?: string;
  };
  resolutionDate?: string;
}): Promise<ValidationResult> {
  return executeWithRetry(async () => {
    const model = getModel({
      modelName: MODELS.VALIDATION_ENGINE.modelName,
      systemInstruction: VALIDATION_AGENT_PROMPT,
      temperature: MODELS.VALIDATION_ENGINE.temperature,
      maxOutputTokens: MODELS.VALIDATION_ENGINE.maxOutputTokens,
      responseMimeType: "application/json",
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: `Validate this event data:\n${JSON.stringify(eventData, null, 2)}` }],
      }],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("Empty response from model");
    }

    const parsed = parseJSONResponse(text);
    
    return {
      score: parsed.score || 0,
      recommendation: parsed.recommendation || "review",
      breakdown: {
        titleQuality: parsed.breakdown?.titleQuality || 0,
        descriptionQuality: parsed.breakdown?.descriptionQuality || 0,
        resolutionCriteria: parsed.breakdown?.resolutionCriteria || 0,
        resolutionSource: parsed.breakdown?.resolutionSource || 0,
        feasibility: parsed.breakdown?.feasibility || 0,
      },
      risks: parsed.risks || [],
      improvements: parsed.improvements || [],
      confidence: parsed.confidence || 0,
    };
  }, { retries: 3, backoffMs: 500 });
}

/**
 * Fallback validation using rules
 */
export function validateEventFallback(eventData: {
  title: string;
  slug: string;
  category: string;
  description?: string;
  resolutionCriteria?: {
    yes?: string;
    no?: string;
    edgeCases?: string;
  };
  resolutionSource?: {
    name?: string;
    url?: string;
  };
  resolutionDate?: string;
}): ValidationResult {
  const risks: Risk[] = [];
  const improvements: string[] = [];
  const breakdown: ValidationBreakdown = {
    titleQuality: 0,
    descriptionQuality: 0,
    resolutionCriteria: 0,
    resolutionSource: 0,
    feasibility: 0,
  };
  
  // Title quality check
  if (eventData.title.length < 10) {
    risks.push({
      severity: "medium",
      category: "ambiguity",
      description: "Title is too short",
      suggestion: "Expand the title to be more descriptive",
    });
    breakdown.titleQuality = 0.4;
  } else if (eventData.title.length > 150) {
    risks.push({
      severity: "low",
      category: "ambiguity",
      description: "Title is very long",
      suggestion: "Consider making the title more concise",
    });
    breakdown.titleQuality = 0.7;
  } else {
    breakdown.titleQuality = 0.85;
  }
  
  // Check for ambiguous terms
  const ambiguousTerms = ["significant", "major", "substantial", "important", "considerable"];
  const hasAmbiguousTerms = ambiguousTerms.some(term => 
    eventData.title.toLowerCase().includes(term)
  );
  
  if (hasAmbiguousTerms) {
    risks.push({
      severity: "high",
      category: "ambiguity",
      description: "Title contains subjective terms without clear definition",
      suggestion: "Define what constitutes 'significant' or replace with measurable criteria",
    });
    breakdown.titleQuality -= 0.2;
  }
  
  // Description quality
  if (!eventData.description || eventData.description.length < 50) {
    risks.push({
      severity: "medium",
      category: "ambiguity",
      description: "Description is missing or too short",
      suggestion: "Add a detailed description explaining the event",
    });
    breakdown.descriptionQuality = 0.3;
  } else {
    breakdown.descriptionQuality = 0.8;
  }
  
  // Resolution criteria check
  const hasYesCriteria = eventData.resolutionCriteria?.yes && eventData.resolutionCriteria.yes.length > 10;
  const hasNoCriteria = eventData.resolutionCriteria?.no && eventData.resolutionCriteria.no.length > 10;
  
  if (!hasYesCriteria || !hasNoCriteria) {
    risks.push({
      severity: "high",
      category: "ambiguity",
      description: "Resolution criteria are incomplete",
      suggestion: "Define clear YES and NO outcomes",
    });
    breakdown.resolutionCriteria = 0.3;
  } else {
    breakdown.resolutionCriteria = 0.85;
  }
  
  // Resolution source check
  const hasSource = eventData.resolutionSource?.name && eventData.resolutionSource.name.length > 0;
  
  if (!hasSource) {
    risks.push({
      severity: "high",
      category: "source",
      description: "No resolution source specified",
      suggestion: "Provide an authoritative source for resolution",
    });
    breakdown.resolutionSource = 0.2;
  } else {
    breakdown.resolutionSource = 0.9;
  }
  
  // Feasibility check
  if (eventData.resolutionDate) {
    const resolutionDate = new Date(eventData.resolutionDate);
    const now = new Date();
    const daysUntil = (resolutionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysUntil < 1) {
      risks.push({
        severity: "high",
        category: "timing",
        description: "Resolution date is too soon",
        suggestion: "Allow more time for the event to unfold",
      });
      breakdown.feasibility = 0.3;
    } else if (daysUntil > 365) {
      risks.push({
        severity: "medium",
        category: "timing",
        description: "Resolution date is more than a year away",
        suggestion: "Consider if this timeframe is appropriate for the event",
      });
      breakdown.feasibility = 0.6;
    } else {
      breakdown.feasibility = 0.85;
    }
  } else {
    risks.push({
      severity: "medium",
      category: "timing",
      description: "No resolution date specified",
      suggestion: "Provide an expected resolution date",
    });
    breakdown.feasibility = 0.5;
  }
  
  // Calculate overall score
  const score = (
    breakdown.titleQuality * 0.2 +
    breakdown.descriptionQuality * 0.2 +
    breakdown.resolutionCriteria * 0.3 +
    breakdown.resolutionSource * 0.15 +
    breakdown.feasibility * 0.15
  );
  
  // Determine recommendation
  let recommendation: Recommendation;
  if (score >= 0.9) {
    recommendation = "approve";
  } else if (score >= 0.8) {
    recommendation = "review";
  } else if (score >= 0.6) {
    recommendation = "revise";
  } else {
    recommendation = "reject";
  }
  
  // Generate improvements
  if (breakdown.titleQuality < 0.8) {
    improvements.push("Improve title clarity and specificity");
  }
  if (breakdown.descriptionQuality < 0.8) {
    improvements.push("Add more context to the description");
  }
  if (breakdown.resolutionCriteria < 0.8) {
    improvements.push("Clarify resolution criteria for all outcomes");
  }
  if (breakdown.resolutionSource < 0.8) {
    improvements.push("Provide authoritative resolution source");
  }
  
  return {
    score: Math.max(0, Math.min(1, score)),
    recommendation,
    breakdown,
    risks,
    improvements,
    confidence: 0.7,
  };
}
