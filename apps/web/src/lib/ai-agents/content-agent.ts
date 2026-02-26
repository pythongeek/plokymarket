/**
 * Content Agent
 * - NLP & Contextualization
 * - Named Entity Recognition (NER)
 * - SEO optimization
 * - Bangladeshi news context fetching
 */

import { ContentAgentResult, AgentContext } from './types';
import { executeWithFailover } from './provider-switcher';

// NER Patterns for Bangladeshi context
const NER_PATTERNS = {
  // Sports entities
  sports: {
    tournament: /বিপিএল|বাংলাদেশ প্রিমিয়ার লীগ|নিউজিল্যান্ড সিরিজ|ইংল্যান্ড সিরিজ|ভারত সিরিজ|পাকিস্তান সিরিজ|টি২০ বিশ্বকাপ|ওয়ানডে বিশ্বকাপ|এশিয়া কাপ/i,
    year: /20\d{2}|\d{4}/,
    team: /কুমিল্লা|রংপুর|ঢাকা|চট্টগ্রাম|সিলেট|খুলনা|বরিশাল|বাংলাদেশ|ভারত|পাকিস্তান|অস্ট্রেলিয়া|ইংল্যান্ড|নিউজিল্যান্ড|দক্ষিণ আফ্রিকা|শ্রীলঙ্কা|ওয়েস্ট ইন্ডিজ/i,
  },
  // Politics entities
  politics: {
    election: /নির্বাচন|ভোট|ইলেকশন/i,
    party: /আওয়ামী লীগ|বিএনপি|জাতীয় পার্টি/i,
    position: /প্রধানমন্ত্রী|প্রেসিডেন্ট|মেয়র|চেয়ারম্যান/i,
  },
  // Crypto entities
  crypto: {
    coin: /বিটকয়েন|ইথেরিয়াম|বিএনবি|সোলানা|কার্ডানো|এক্সআরপি/i,
    exchange: /বিনান্স|কয়েনবেস|ক্রাকেন|বাইবিট/i,
    metric: /দাম|মূল্য|প্রাইস|ক্যাপ|ভলিউম/i,
  },
};

/**
 * Extract named entities from title
 */
function extractEntities(title: string): {
  category: string;
  entities: Record<string, string[]>;
} {
  const entities: Record<string, string[]> = {
    tournament: [],
    year: [],
    team: [],
    election: [],
    party: [],
    coin: [],
  };
  
  let category = 'Other';
  
  // Check sports
  if (NER_PATTERNS.sports.tournament.test(title)) {
    category = 'Sports';
    const tournamentMatch = title.match(NER_PATTERNS.sports.tournament);
    if (tournamentMatch) entities.tournament.push(tournamentMatch[0]);
    
    const yearMatch = title.match(NER_PATTERNS.sports.year);
    if (yearMatch) entities.year.push(yearMatch[0]);
    
    const teamMatches = title.match(new RegExp(NER_PATTERNS.sports.team, 'g'));
    if (teamMatches) entities.team.push(...teamMatches);
  }
  
  // Check politics
  else if (NER_PATTERNS.politics.election.test(title)) {
    category = 'Politics';
    const electionMatch = title.match(NER_PATTERNS.politics.election);
    if (electionMatch) entities.election.push(electionMatch[0]);
    
    const partyMatches = title.match(new RegExp(NER_PATTERNS.politics.party, 'g'));
    if (partyMatches) entities.party.push(...partyMatches);
  }
  
  // Check crypto
  else if (NER_PATTERNS.crypto.coin.test(title) || NER_PATTERNS.crypto.exchange.test(title)) {
    category = 'Crypto';
    const coinMatches = title.match(new RegExp(NER_PATTERNS.crypto.coin, 'g'));
    if (coinMatches) entities.coin.push(...coinMatches);
  }
  
  return { category, entities };
}

/**
 * Calculate SEO score for title
 */
function calculateSEOScore(title: string): number {
  let score = 50; // Base score
  
  // Length check (optimal: 30-60 chars)
  if (title.length >= 30 && title.length <= 60) score += 15;
  else if (title.length > 60) score += 5;
  
  // Contains year (trending)
  if (/\d{4}/.test(title)) score += 10;
  
  // Contains question mark (engagement)
  if (title.includes('?')) score += 10;
  
  // Contains popular keywords
  const popularKeywords = ['বিজয়', 'চ্যাম্পিয়ন', 'জয়', 'হার', 'দাম', 'মূল্য'];
  if (popularKeywords.some(kw => title.includes(kw))) score += 10;
  
  // Bengali content bonus
  if (/[\u0980-\u09FF]/.test(title)) score += 5;
  
  return Math.min(100, score);
}

/**
 * Generate enhanced title using rule-based fallback
 */
function generateEnhancedTitleRuleBased(
  rawTitle: string,
  entities: Record<string, string[]>
): string {
  const { category } = extractEntities(rawTitle);
  
  if (category === 'Sports') {
    const tournament = entities.tournament[0] || '';
    const year = entities.year[0] || new Date().getFullYear().toString();
    
    if (tournament.includes('বিপিএল') || tournament.includes('বাংলাদেশ প্রিমিয়ার লীগ')) {
      return `${tournament} ${year}-এ চ্যাম্পিয়ন হবে কোন দল?`;
    }
    
    if (entities.team.length >= 2) {
      return `${entities.team[0]} বনাম ${entities.team[1]}: কে জিতবে ${tournament || 'ম্যাচ'}?`;
    }
    
    return `${tournament || rawTitle} ${year}: কে হবে বিজয়ী?`;
  }
  
  if (category === 'Politics') {
    const election = entities.election[0] || 'নির্বাচন';
    const year = entities.year[0] || new Date().getFullYear().toString();
    return `${year} সালের ${election}: কোন দল জয়লাভ করবে?`;
  }
  
  if (category === 'Crypto') {
    const coin = entities.coin[0] || 'বিটকয়েন';
    return `${coin} এর দাম কি আগামী সপ্তাহে বাড়বে?`;
  }
  
  // Generic enhancement
  if (!rawTitle.includes('?')) {
    return `${rawTitle} - কী হবে ফলাফল?`;
  }
  
  return rawTitle;
}

/**
 * Generate description using rule-based fallback
 */
function generateDescriptionRuleBased(
  title: string,
  category: string
): string {
  const descriptions: Record<string, string> = {
    Sports: `এই ইভেন্টে আপনি ${title.includes('বিপিএল') ? 'বাংলাদেশ প্রিমিয়ার লীগ' : 'খেলাটি'} সম্পর্কে পূর্বাভাস দিতে পারবেন। সঠিক পূর্বাভাস দিয়ে পুরস্কার জিতুন!`,
    Politics: `এই রাজনৈতিক ইভেন্টে ভবিষ্যৎবাণী করুন এবং আপনার বিশ্লেষণ দক্ষতা প্রমাণ করুন।`,
    Crypto: `ক্রিপ্টোকারেন্সি বাজারের ওঠানামা নিয়ে পূর্বাভাস দিন। বাজার বিশ্লেষণ করে সঠিক সিদ্ধান্ত নিন।`,
    Other: `এই ইভেন্টে ভবিষ্যৎবাণী করুন এবং অন্যান্য ব্যবহারকারীদের সাথে ট্রেড করুন।`,
  };
  
  return descriptions[category] || descriptions.Other;
}

/**
 * Generate tags using rule-based fallback
 */
function generateTagsRuleBased(
  title: string,
  category: string,
  entities: Record<string, string[]>
): string[] {
  const tags: string[] = [category.toLowerCase()];
  
  if (category === 'Sports') {
    tags.push('cricket', 'bangladesh', 'prediction');
    if (entities.tournament[0]) tags.push(entities.tournament[0].toLowerCase().replace(/\s+/g, '-'));
  } else if (category === 'Politics') {
    tags.push('bangladesh', 'election', 'prediction');
  } else if (category === 'Crypto') {
    tags.push('bitcoin', 'trading', 'price-prediction');
  }
  
  return [...new Set(tags)];
}

/**
 * Vertex AI implementation (SERVER-SIDE ONLY)
 * This should be called from API routes
 */
async function generateWithVertexAI(
  context: AgentContext
): Promise<ContentAgentResult> {
  // Call the API route instead of direct Vertex AI
  const response = await fetch('/api/ai/vertex-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'content',
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Vertex AI API call failed');
  }

  const data = await response.json();
  return {
    ...data.result,
    confidence: 0.85,
  };
}

/**
 * Kimi API implementation
 */
async function generateWithKimi(
  context: AgentContext
): Promise<ContentAgentResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a content optimization AI for a Bangladeshi prediction market. Generate engaging Bengali content.',
        },
        {
          role: 'user',
          content: `Optimize this event title: "${context.rawInput || context.title}"

Respond in JSON format:
{
  "title": "optimized Bengali title",
  "description": "compelling Bengali description",
  "category": "Sports|Politics|Crypto|Other",
  "subcategory": "specific subcategory",
  "tags": ["tag1", "tag2"],
  "seoScore": 85
}`,
        },
      ],
      temperature: 0.3,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from Kimi');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Kimi');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    subcategory: parsed.subcategory,
    tags: parsed.tags,
    seoScore: parsed.seoScore,
    confidence: 0.8,
  };
}

/**
 * Rule-based fallback implementation
 */
function generateRuleBased(context: AgentContext): ContentAgentResult {
  const rawTitle = context.rawInput || context.title || '';
  const { category, entities } = extractEntities(rawTitle);
  
  const title = generateEnhancedTitleRuleBased(rawTitle, entities);
  const description = generateDescriptionRuleBased(title, category);
  const tags = generateTagsRuleBased(title, category, entities);
  const seoScore = calculateSEOScore(title);
  
  return {
    title,
    description,
    category,
    subcategory: category,
    tags,
    seoScore,
    confidence: 0.6,
  };
}

/**
 * Main Content Agent function
 */
export async function runContentAgent(
  context: AgentContext
): Promise<ContentAgentResult> {
  console.log('[ContentAgent] Starting with context:', context);
  
  const { result, provider } = await executeWithFailover(
    () => generateWithVertexAI(context),
    () => generateWithKimi(context),
    () => generateRuleBased(context)
  );
  
  console.log(`[ContentAgent] Completed using ${provider}`);
  
  return {
    ...result,
    sources: provider === 'rule-based' ? ['rule-based'] : [provider, 'ner-analysis'],
  };
}

/**
 * Quick title enhancement (for real-time suggestions)
 */
export function quickEnhanceTitle(rawTitle: string): string {
  const { entities } = extractEntities(rawTitle);
  return generateEnhancedTitleRuleBased(rawTitle, entities);
}
