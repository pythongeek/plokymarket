/**
 * Duplicate Detection Agent
 * - Levenshtein Distance Algorithm
 * - Similarity scoring
 * - Event deduplication
 */

import { DuplicateCheckResult, AgentContext } from './types';

/**
 * Calculate Levenshtein distance between two strings
 * Time complexity: O(m*n)
 * Space complexity: O(m*n)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate similarity ratio (0-1, higher = more similar)
 */
export function similarityRatio(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove punctuation
 * - Remove extra spaces
 * - Transliterate Bengali numbers to English
 */
function normalizeText(text: string): string {
  const bengaliToEnglish: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  
  return text
    .toLowerCase()
    .replace(/[০-৯]/g, char => bengaliToEnglish[char] || char)
    .replace(/[^\w\s\u0980-\u09FF]/g, '') // Keep Bengali chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract key entities from title for comparison
 */
function extractKeyEntities(title: string): {
  year?: string;
  tournament?: string;
  teams: string[];
} {
  const normalized = normalizeText(title);
  
  // Extract year
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : undefined;
  
  // Extract tournament names
  const tournaments = [
    'বিপিএল', 'বাংলাদেশ প্রিমিয়ার লীগ', 'টি২০ বিশ্বকাপ',
    'ওয়ানডে বিশ্বকাপ', 'এশিয়া কাপ', 'ফিফা বিশ্বকাপ',
    'ইপিএল', 'লা লিগা', 'চ্যাম্পিয়ন্স লীগ',
  ];
  
  let tournament: string | undefined;
  for (const t of tournaments) {
    if (normalized.includes(normalizeText(t))) {
      tournament = t;
      break;
    }
  }
  
  // Extract team names
  const teams: string[] = [];
  const teamNames = [
    'কুমিল্লা', 'রংপুর', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'খুলনা', 'বরিশাল',
    'বাংলাদেশ', 'ভারত', 'পাকিস্তান', 'অস্ট্রেলিয়া', 'ইংল্যান্ড',
    'নিউজিল্যান্ড', 'দক্ষিণ আফ্রিকা', 'শ্রীলঙ্কা', 'ওয়েস্ট ইন্ডিজ',
    'ম্যানচেস্টার ইউনাইটেড', 'লিভারপুল', 'চেলসি', 'আর্সেনাল', 'ম্যান সিটি',
  ];
  
  for (const team of teamNames) {
    if (normalized.includes(normalizeText(team))) {
      teams.push(team);
    }
  }
  
  return { year, tournament, teams };
}

/**
 * Check if two events are semantically similar
 */
function isSemanticallySimilar(
  title1: string,
  title2: string
): { isSimilar: boolean; reason: string } {
  const entities1 = extractKeyEntities(title1);
  const entities2 = extractKeyEntities(title2);
  
  // Same year and tournament = likely duplicate
  if (
    entities1.year &&
    entities2.year &&
    entities1.year === entities2.year &&
    entities1.tournament &&
    entities2.tournament &&
    entities1.tournament === entities2.tournament
  ) {
    // Check if same teams
    if (
      entities1.teams.length > 0 &&
      entities2.teams.length > 0
    ) {
      const commonTeams = entities1.teams.filter(t =>
        entities2.teams.includes(t)
      );
      if (commonTeams.length >= 2) {
        return {
          isSimilar: true,
          reason: `Same ${entities1.tournament} ${entities1.year} with same teams`,
        };
      }
    }
    
    // Same tournament and year, no specific teams
    return {
      isSimilar: true,
      reason: `Same ${entities1.tournament} ${entities1.year}`,
    };
  }
  
  return { isSimilar: false, reason: '' };
}

/**
 * Find similar events from existing list
 */
export function findSimilarEvents(
  newTitle: string,
  existingEvents: string[],
  threshold: number = 0.7
): Array<{ title: string; similarity: number }> {
  const normalizedNew = normalizeText(newTitle);
  const similar: Array<{ title: string; similarity: number }> = [];
  
  for (const existing of existingEvents) {
    const normalizedExisting = normalizeText(existing);
    
    // Check semantic similarity first
    const semantic = isSemanticallySimilar(newTitle, existing);
    if (semantic.isSimilar) {
      similar.push({ title: existing, similarity: 0.95 });
      continue;
    }
    
    // Check Levenshtein similarity
    const sim = similarityRatio(normalizedNew, normalizedExisting);
    if (sim >= threshold) {
      similar.push({ title: existing, similarity: sim });
    }
  }
  
  // Sort by similarity (highest first)
  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Generate suggestions for making title unique
 */
function generateUniqueSuggestions(
  title: string,
  similarEvents: Array<{ title: string; similarity: number }>
): string[] {
  const suggestions: string[] = [];
  const entities = extractKeyEntities(title);
  
  // Suggestion 1: Add specific date
  const today = new Date();
  const dateStr = today.toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric',
  });
  suggestions.push(`${title} (${dateStr})`);
  
  // Suggestion 2: Add year if not present
  if (!entities.year) {
    const year = new Date().getFullYear();
    suggestions.push(`${title} ${year}`);
  }
  
  // Suggestion 3: Make more specific
  if (entities.teams.length === 0) {
    suggestions.push(`${title} - নির্দিষ্ট দল উল্লেখ করুন`);
  }
  
  // Suggestion 4: Add qualifier
  suggestions.push(`[নতুন] ${title}`);
  
  return suggestions;
}

/**
 * Main duplicate check function
 */
export function checkForDuplicates(
  newTitle: string,
  existingEvents: string[] = [],
  threshold: number = 0.7
): DuplicateCheckResult {
  // If no existing events, no duplicates
  if (!existingEvents || existingEvents.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      suggestions: [],
    };
  }
  
  // Find similar events
  const similar = findSimilarEvents(newTitle, existingEvents, threshold);
  
  if (similar.length === 0) {
    return {
      isDuplicate: false,
      similarity: 0,
      suggestions: [],
    };
  }
  
  // Get the most similar
  const mostSimilar = similar[0];
  const isDuplicate = mostSimilar.similarity >= 0.9;
  
  return {
    isDuplicate,
    similarity: mostSimilar.similarity,
    matchedEvent: {
      id: '', // Would be populated from database
      title: mostSimilar.title,
      slug: '', // Would be populated from database
    },
    suggestions: generateUniqueSuggestions(newTitle, similar),
  };
}

/**
 * Batch check for duplicates (for admin dashboard)
 */
export function batchDuplicateCheck(
  titles: string[],
  existingEvents: string[]
): Map<string, DuplicateCheckResult> {
  const results = new Map<string, DuplicateCheckResult>();
  
  for (const title of titles) {
    results.set(title, checkForDuplicates(title, existingEvents));
  }
  
  return results;
}

/**
 * Quick similarity check for real-time UI
 */
export function quickSimilarityCheck(
  input: string,
  existingEvents: string[]
): { hasSimilar: boolean; bestMatch?: string; similarity: number } {
  if (!existingEvents.length) {
    return { hasSimilar: false, similarity: 0 };
  }
  
  const normalizedInput = normalizeText(input);
  let bestMatch: string | undefined;
  let bestSimilarity = 0;
  
  for (const event of existingEvents) {
    const similarity = similarityRatio(normalizedInput, normalizeText(event));
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = event;
    }
  }
  
  return {
    hasSimilar: bestSimilarity >= 0.6,
    bestMatch,
    similarity: bestSimilarity,
  };
}
