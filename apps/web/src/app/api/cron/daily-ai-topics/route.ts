/**
 * Daily AI Topics Cron Job
 * Triggered by Upstash QStash every day at 6 AM
 * Generates AI topics automatically with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

// Verify QStash signature
async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get('upstash-signature');
  if (!signature) return false;

  // In production, verify signature with QStash public key
  // For now, checking cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  return cronSecret === process.env.CRON_SECRET;
}

// Check if already generated today (caching)
async function checkAlreadyGenerated(supabase: any): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ai_daily_topics')
    .select('id')
    .gte('generated_at', today)
    .limit(1);

  if (error) {
    console.error('Cache check error:', error);
    return false;
  }

  return data && data.length > 0;
}

// Helper: Fetch trending news
async function fetchTrendingNews(categories: string[]): Promise<string> {
  const contexts: Record<string, string> = {
    'Sports': 'BPL 2024 ongoing, Bangladesh vs Sri Lanka series upcoming, IPL 2024 auction completed',
    'Politics': 'Upcoming City Corporation elections, National budget preparation',
    'Economy': 'USD rate fluctuating around 120-125 BDT, Inflation concerns, IMF loan discussions',
    'Entertainment': 'New Bollywood releases, Bangladeshi film industry developments',
    'Technology': 'AI advancements, iPhone 16 rumors, Crypto market volatility',
    'International': 'US Election 2024, Global climate summit, Major sporting events'
  };

  return categories.map(cat => `${cat}: ${contexts[cat] || 'General trends'}`).join('\n');
}

// Helper: Send Telegram notification
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
    // Verify request is from QStash
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createServiceClient();

    // Check if already generated today (prevent duplicates)
    const alreadyGenerated = await checkAlreadyGenerated(supabase);
    if (alreadyGenerated) {
      console.log('Topics already generated today, skipping...');
      return NextResponse.json({
        success: true,
        message: 'Already generated today',
        skipped: true
      });
    }

    // Get admin settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_ai_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      throw new Error('Failed to fetch AI settings');
    }

    // Check if auto-generate is enabled
    if (!settings.auto_generate_enabled) {
      return NextResponse.json({
        success: true,
        message: 'Auto-generation disabled',
        skipped: true
      });
    }

    const categories = settings.default_categories || ['Sports', 'Politics', 'Economy'];
    const count = settings.max_daily_topics || 5;

    // Fetch trending news for context
    const newsContext = await fetchTrendingNews(categories);

    // Build comprehensive prompt
    const prompt = `
You are an AI assistant for a Bangladesh prediction market platform called "Plokymarket".
Generate ${count} engaging prediction market topics that users would want to trade on.

=== CONTEXT ===
Region: Bangladesh (Primary) + International
Current Date: ${new Date().toISOString().split('T')[0]}
Categories: ${categories.join(', ')}

=== TRENDING NEWS ===
${newsContext}

=== BANGLADESH CONTEXT (60% of topics) ===
Sports: BPL cricket, Bangladesh national team, Shakib/Tamim/Mushfiqur performances, local football
Economy: USD-BDT rate (120-125 TK), inflation, stock market (DSE), remittance, IMF loan
Politics: Elections, City Corporation, government policies, infrastructure projects
Social: Eid festivals, exam results, weather events, viral trends

=== INTERNATIONAL CONTEXT (40% of topics) ===
Sports: ICC tournaments, IPL, FIFA World Cup, Premier League, Olympics
Global: US Elections, geopolitics, oil prices, climate summits
Entertainment: Bollywood (SRK, Salman), Hollywood (Marvel/DC), K-pop
Technology: iPhone/Samsung releases, AI developments, Crypto (Bitcoin/Ethereum)

=== REQUIREMENTS ===
1. Mix: 60% Bangladesh local + 40% International topics
2. Clear YES/NO outcomes
3. Resolve within 7-30 days
4. Bengali titles/descriptions, English technical terms
5. Specific numbers, dates, names for credibility
6. Avoid sensitive political topics

=== OUTPUT FORMAT ===
[
  {
    "title": "Bengali title",
    "question": "Clear YES/NO question in Bengali",
    "description": "Detailed Bengali description",
    "category": "One of: ${categories.join(', ')}",
    "reasoning": "Why relevant",
    "confidence": 0.85
  }
]

Generate exactly ${count} topics.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${settings.gemini_model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
      throw new Error(`Gemini API error: ${errorData.error?.message}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse JSON
    let topics: any[] = [];
    try {
      const jsonMatch = generatedText.match(/```json\n?([\s\S]*?)\n?```/) ||
        generatedText.match(/\[([\s\S]*)\]/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : generatedText;
      topics = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Parse error:', generatedText);
      throw new Error('Failed to parse AI response');
    }

    // Validate and save
    const validTopics = topics.filter(t => t.title && t.question && t.category).map(t => ({
      suggested_title: t.title,
      suggested_question: t.question,
      suggested_description: t.description || '',
      suggested_category: t.category,
      ai_reasoning: t.reasoning || '',
      ai_confidence: Math.min(Math.max(t.confidence || 0.5, 0), 1),
      status: 'pending'
    }));

    if (validTopics.length === 0) {
      throw new Error('No valid topics');
    }

    // Save to database
    const { data: savedTopics, error: insertError } = await supabase
      .from('ai_daily_topics')
      .insert(validTopics)
      .select();

    if (insertError) throw insertError;

    // Send notification
    const message = `
🤖 <b>AI Daily Topics Auto-Generated</b>

📊 <b>Count:</b> ${validTopics.length} topics
🏷️ <b>Categories:</b> ${categories.join(', ')}
⏱️ <b>Time:</b> ${Date.now() - startTime}ms

${validTopics.map((t, i) => `${i + 1}. ${t.suggested_title}`).join('\n')}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/daily-topics">Review Topics</a>
    `.trim();

    await sendTelegramNotification(message);

    return NextResponse.json({
      success: true,
      generated: validTopics.length,
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Cron job error:', error);

    // Send error notification
    await sendTelegramNotification(`
❌ <b>AI Topics Generation Failed</b>

Error: ${error.message}
Time: ${new Date().toISOString()}
    `.trim());

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
