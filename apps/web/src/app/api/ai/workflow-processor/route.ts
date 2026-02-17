/**
 * Upstash Workflow Processor
 * Handles AI topic generation asynchronously
 * This endpoint is called by Upstash QStash
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Bangladesh Context Prompt Builder
function buildPrompt(topic: string, context: string, variation: number): string {
  const bdContext = `
=== BANGLADESH CONTEXT (Primary Focus) ===
Sports:
- BPL (Bangladesh Premier League): Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur, Cumilla, Barishal
- National Team: Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim, Liton Das
- Cricket: vs India, Pakistan, Australia, England, Sri Lanka
- Football: Abahani, Mohammedan, Bashundhara Kings
- Upcoming: Asia Cup, World Cup qualifiers

Politics:
- National Elections (জাতীয় নির্বাচন)
- City Corporation: Dhaka North/South, Chattogram, Khulna, Rajshahi
- Political Parties: Awami League, BNP, Jatiya Party
- Key Figures: PM Sheikh Hasina, leaders

Economy:
- USD-BDT Exchange Rate (current: 120-125 TK per USD)
- Inflation: Rice, Onion, Oil prices
- Stock Market: DSE Index, Chittagong Stock Exchange
- Remittance: Middle East, Malaysia, Singapore, UK
- IMF Loan discussions and policies

Entertainment:
- Bollywood: SRK, Salman Khan, Amir Khan releases
- Dhallywood: Bangladeshi cinema
- International: Hollywood Marvel/DC, Oscar
- Music: K-pop trends in Bangladesh

Technology:
- Mobile: iPhone, Samsung, Xiaomi, Realme
- AI: ChatGPT, Google Gemini updates
- Crypto: Bitcoin, Ethereum trends
- Social Media: Viral trends

Social:
- Festivals: Eid-ul-Fitr, Eid-ul-Adha, Puja
- Education: HSC, SSC, University results
- Weather: Cyclone, Monsoon, Floods
- Viral: Social media trends
`;

  const internationalContext = `
=== INTERNATIONAL CONTEXT (Secondary) ===
Sports: IPL, FIFA World Cup, Premier League, Olympics
Global: US Elections, Geopolitics, Oil prices
Tech: Apple, Google, Microsoft, AI developments
`;

  const variationPrompts = [
    "Focus on Bangladesh local context with specific teams/players/politicians",
    "Focus on economic impact and market predictions",
    "Focus on international comparison and global trends"
  ];

  return `
You are an AI assistant for Plokymarket, a Bangladesh prediction market platform.
Generate a prediction market event based on the following topic.

TOPIC: "${topic}"
${context ? `ADDITIONAL CONTEXT: "${context}"` : ''}

${bdContext}

${internationalContext}

VARIATION FOCUS: ${variationPrompts[variation % variationPrompts.length]}

REQUIREMENTS:
1. Title: Catchy Bengali title (max 100 chars)
2. Question: Clear YES/NO question in Bengali/English mix
3. Description: Detailed context in Bengali
4. Category: One of [sports, politics, economy, entertainment, technology, international, social, weather]
5. Subcategory: Specific area
6. Tags: 3-5 relevant keywords (Bengali + English)
7. Trading End: Suggest appropriate date (7-30 days from now)
8. Confidence: 0-100 score based on predictability
9. Trending: 0-100 score based on current relevance
10. Reasoning: Why this is a good prediction market topic
11. Sources: 2-3 relevant news source URLs

OUTPUT FORMAT (JSON):
{
  "title": "Bengali title",
  "question": "Clear YES/NO question",
  "description": "Detailed Bengali description",
  "category": "category_name",
  "subcategory": "specific_area",
  "tags": ["tag1", "tag2", "tag3"],
  "trading_end": "2024-03-15T18:00:00Z",
  "confidence_score": 85,
  "trending_score": 78,
  "reasoning": "Why this topic works",
  "sources": ["https://prothomalo.com/...", "https://espncricinfo.com/..."]
}

Generate variation ${variation + 1} of ${variationPrompts.length}.
`;
}

// Call Gemini API
async function callGemini(prompt: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No content from Gemini');
  }

  // Parse JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('JSON parse error:', text);
  }

  return null;
}

// Send Telegram notification
async function notifyAdmin(workflowId: string, topic: string, count: number) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return;

  const message = `
🤖 <b>AI Topic Generation Complete</b>

📌 Topic: ${topic}
✅ Generated: ${count} suggestions
🔧 Workflow: ${workflowId}
⏰ Time: ${new Date().toLocaleString('bn-BD')}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events/create/ai-assisted">Review</a>
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Notification error:', e);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify QStash signature (simplified for free tier)
    const signature = request.headers.get('upstash-signature');
    if (!signature && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflow_id, topic, context, variations, suggestion_ids } = body;

    const supabase = getSupabase();
    const results = [];

    // Generate each variation
    for (let i = 0; i < variations; i++) {
      try {
        const prompt = buildPrompt(topic, context, i);
        const aiResult = await callGemini(prompt);

        if (aiResult && suggestion_ids[i]) {
          // Update database
          const { data, error } = await supabase
            .from('ai_daily_topics')
            .update({
              suggested_title: aiResult.title,
              suggested_question: aiResult.question,
              suggested_description: aiResult.description,
              suggested_category: aiResult.category,
              suggested_subcategory: aiResult.subcategory,
              suggested_tags: aiResult.tags,
              suggested_trading_end: aiResult.trading_end,
              ai_confidence: aiResult.confidence_score,
              trending_score: aiResult.trending_score,
              ai_reasoning: aiResult.reasoning,
              source_urls: aiResult.sources,
              status: 'pending',
              workflow_id: workflow_id
            })
            .eq('id', suggestion_ids[i])
            .select()
            .single();

          if (!error && data) {
            results.push(data);
          }
        }
      } catch (err) {
        console.error(`Variation ${i} error:`, err);
      }
    }

    // Notify admin
    await notifyAdmin(workflow_id, topic, results.length);

    return NextResponse.json({
      success: true,
      workflow_id,
      generated: results.length,
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Workflow processor error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
