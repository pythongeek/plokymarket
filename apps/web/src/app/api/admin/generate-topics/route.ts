/**
 * AI Topic Generation API
 * Generates topics using Gemini AI with admin custom prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface AITopic {
  title: string;
  question: string;
  description: string;
  category: string;
  reasoning: string;
  confidence: number;
}

// Helper function to fetch trending news
async function fetchTrendingNews(categories: string[]): Promise<string> {
  try {
    // You can integrate with news APIs like NewsAPI, GNews, or your own scraper
    // For now, returning context based on categories
    const contexts: Record<string, string> = {
      'Sports': 'BPL 2024 ongoing, Bangladesh vs Sri Lanka series upcoming, IPL 2024 auction completed',
      'Politics': 'Upcoming City Corporation elections, National budget preparation',
      'Economy': 'USD rate fluctuating around 120-125 BDT, Inflation concerns, IMF loan discussions',
      'Entertainment': 'New Bollywood releases, Bangladeshi film industry developments',
      'Technology': 'AI advancements, iPhone 16 rumors, Crypto market volatility',
      'International': 'US Election 2024, Global climate summit, Major sporting events'
    };
    
    return categories.map(cat => `${cat}: ${contexts[cat] || 'General trends'}`).join('\n');
  } catch (error) {
    return 'Using general context';
  }
}

// Helper function to send Telegram notification
async function sendTelegramNotification(message: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return;
  
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
  } catch (error) {
    console.error('Telegram notification failed:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      custom_prompt, 
      categories = ['Sports', 'Politics', 'Economy', 'Entertainment'],
      count = 5,
      admin_id 
    } = body;
    
    const supabase = getSupabase();
    
    // Get admin settings
    const { data: settings } = await supabase
      .from('admin_ai_settings')
      .select('*')
      .single();
    
    // Fetch trending news for context
    const newsContext = await fetchTrendingNews(categories);
    
    // Build enhanced prompt with Bangladesh + International context
    const prompt = `
You are an AI assistant for a Bangladesh prediction market platform called "Plokymarket".
Generate ${count} engaging prediction market topics that users would want to trade on.

=== CONTEXT ===
Region: ${settings?.target_region || 'Bangladesh'} (Primary) + International
Current Date: ${new Date().toISOString().split('T')[0]}
Categories: ${categories.join(', ')}

=== TRENDING NEWS ===
${newsContext}

=== CUSTOM INSTRUCTION ===
${custom_prompt || settings?.custom_instruction || 'Generate engaging prediction market topics'}

=== BANGLADESH CONTEXT (High Priority) ===
Sports:
- BPL (Bangladesh Premier League) cricket matches and player performances
- Bangladesh national team matches (vs India, Pakistan, Australia, etc.)
- Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim performances
- Local football leagues (Abahani, Mohammedan, Bashundhara Kings)

Economy:
- USD to BDT exchange rate (currently around 120-125 TK)
- Inflation rate and commodity prices (rice, onion, oil)
- Stock market (DSE index) movements
- Remittance flow trends
- IMF loan and economic policies

Politics:
- Upcoming elections (National, City Corporation)
- Political party activities and alliances
- Government policy changes
- Infrastructure projects (Padma Bridge, Metro Rail, Expressway)

Social/Culture:
- Eid festivals and holidays
- Educational exam results (HSC, SSC, University)
- Weather events (floods, cyclones, monsoon)
- Viral social media trends in Bangladesh

=== INTERNATIONAL CONTEXT (Include if globally significant) ===
Sports:
- ICC World Cup, T20 World Cup, Champions Trophy
- IPL (Indian Premier League) - very popular in Bangladesh
- FIFA World Cup, Premier League, Champions League
- Olympics medal predictions

Global Events:
- US Presidential elections and policies
- Major geopolitical events affecting South Asia
- Global tech company earnings (affects Bangladesh market)
- International oil prices
- Climate change summits and agreements

Entertainment:
- Bollywood blockbuster releases (Salman Khan, Shahrukh Khan movies)
- Hollywood Marvel/DC movies
- International award shows (Oscars, Grammy)
- K-pop and global music trends popular in Bangladesh

Technology:
- iPhone/Samsung new releases
- AI developments (ChatGPT, Google Bard updates)
- Crypto market movements (Bitcoin, Ethereum)
- Major tech company announcements

=== REQUIREMENTS ===
1. Mix of Bangladesh local (60%) and International (40%) topics
2. Questions must have clear YES/NO outcomes
3. Events should resolve within 7-30 days
4. Use Bengali for titles and descriptions, English for technical terms
5. Include specific numbers, dates, and names for credibility
6. Avoid controversial or sensitive political topics
7. Focus on events that have verifiable outcomes

=== OUTPUT FORMAT ===
Return ONLY a JSON array in this exact format:
[
  {
    "title": "Short catchy title in Bengali (e.g., 'বিপিএল ফাইনালে কুমিল্লা জিতবে?')",
    "question": "Clear YES/NO question in Bengali (e.g., 'বিপিএল ২০২৪ ফাইনালে কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?')",
    "description": "Detailed description in Bengali with context and why it matters",
    "category": "One of: ${categories.join(', ')}",
    "reasoning": "Why this topic is relevant and timely - mention specific dates, players, or events",
    "confidence": 0.85
  }
]

Generate exactly ${count} high-quality topics.`;

    // Call Gemini API
    const geminiResponse = await fetch(
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
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || geminiResponse.statusText}`);
    }
    
    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated from AI');
    }
    
    // Parse JSON from response
    let topics: AITopic[] = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        generatedText.match(/\[([\s\S]*)\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : generatedText;
      topics = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      throw new Error('Failed to parse AI generated topics');
    }
    
    // Validate and clean topics
    const validTopics = topics.filter(t => 
      t.title && t.question && t.category
    ).map(t => ({
      suggested_title: t.title,
      suggested_question: t.question,
      suggested_description: t.description || '',
      suggested_category: t.category,
      ai_reasoning: t.reasoning || '',
      ai_confidence: Math.min(Math.max(t.confidence || 0.5, 0), 1),
      status: 'pending'
    }));
    
    if (validTopics.length === 0) {
      throw new Error('No valid topics generated');
    }
    
    // Save to database
    const { data: savedTopics, error: insertError } = await supabase
      .from('ai_daily_topics')
      .insert(validTopics)
      .select();
    
    if (insertError) throw insertError;
    
    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_admin_id: admin_id,
      p_action_type: 'create_event',
      p_resource_type: 'ai_topics',
      p_resource_id: null,
      p_new_values: { generated_count: validTopics.length, categories },
      p_reason: custom_prompt || 'AI topic generation'
    });
    
    // Send Telegram notification
    const notificationMessage = `
🤖 <b>AI Daily Topics Generated</b>

📊 <b>Count:</b> ${validTopics.length} topics
🏷️ <b>Categories:</b> ${categories.join(', ')}
⏱️ <b>Time:</b> ${Date.now() - startTime}ms

${validTopics.map((t, i) => `${i + 1}. ${t.suggested_title}`).join('\n')}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/daily-topics">Review Topics</a>
    `.trim();
    
    await sendTelegramNotification(notificationMessage);
    
    return NextResponse.json({
      success: true,
      generated: validTopics.length,
      topics: savedTopics,
      execution_time_ms: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('Topic generation error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        execution_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
