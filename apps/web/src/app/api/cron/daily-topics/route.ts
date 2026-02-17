/**
 * Daily AI Topics Generation Cron Job
 * Triggered by Upstash QStash
 * Uses admin-configurable sources and prompts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Verify QStash signature
async function verifyQStashSignature(request: Request): Promise<boolean> {
  const signature = request.headers.get('upstash-signature');
  
  if (process.env.NODE_ENV === 'development' && !signature) {
    return true;
  }
  
  if (!signature) {
    console.warn('[DailyTopics] Missing QStash signature');
    return false;
  }
  
  return true;
}

// Fetch news from RSS feeds
async function fetchRSSNews(sources: any[]): Promise<string> {
  const headlines: string[] = [];
  
  for (const source of sources.slice(0, 3)) {
    try {
      if (source.type === 'rss') {
        const response = await fetch(source.url, { 
          headers: { 'User-Agent': 'Plokymarket Bot' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const xml = await response.text();
          // Extract titles from RSS XML (basic parsing)
          const titles = xml.match(/<title>(.*?)<\/title>/g)?.slice(1, 4) || [];
          headlines.push(...titles.map(t => t.replace(/<\/?title>/g, '')));
        }
      }
    } catch (e) {
      console.warn(`[DailyTopics] Failed to fetch from ${source.name}:`, e);
    }
  }
  
  return headlines.join('. ');
}

// Fetch news from NewsAPI
async function fetchNewsAPI(keywords: string[]): Promise<string> {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return '';
    
    const query = keywords.slice(0, 3).join(' OR ');
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.articles?.map((a: any) => a.title).join('. ') || '';
    }
  } catch (e) {
    console.warn('[DailyTopics] NewsAPI fetch failed:', e);
  }
  return '';
}

// Generate topics using Gemini with custom prompt
async function generateTopicsWithConfig(config: any): Promise<any[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Fetch news from configured sources
  let newsContext = '';
  
  if (config.news_sources && config.news_sources.length > 0) {
    newsContext = await fetchRSSNews(config.news_sources);
  }
  
  if (!newsContext && config.search_keywords) {
    newsContext = await fetchNewsAPI(config.search_keywords);
  }

  // Build prompt from template
  const prompt = config.prompt_template
    .replace('{context}', config.context_type)
    .replace('{count}', config.topics_per_generation || 5)
    .replace('{focus_areas}', config.focus_areas?.join(', ') || 'general news')
    .replace('{categories}', 'Sports, Politics, Crypto, Tech, Entertainment')
    .replace('{sources}', newsContext || 'current trending topics');

  // Call Gemini API
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.ai_model || 'gemini-1.5-flash'}:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.max_tokens || 2048
        }
      })
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const geminiData = await geminiResponse.json();
  const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Parse JSON from response
  let topics = [];
  try {
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      topics = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[DailyTopics] Failed to parse Gemini response:', e);
    throw new Error('Failed to parse generated topics');
  }

  return topics;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  // Verify QStash signature
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    // Get active configurations
    const { data: configs, error: configError } = await supabase
      .from('ai_topic_configs')
      .select('*')
      .eq('is_active', true);

    if (configError) throw configError;
    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No active configurations found' }, { status: 400 });
    }

    const allTopics = [];
    const jobResults = [];

    // Generate topics for each config
    for (const config of configs) {
      const jobStartTime = Date.now();
      
      try {
        // Create job record
        const { data: job } = await supabase
          .from('ai_topic_generation_jobs')
          .insert({
            config_id: config.id,
            status: 'running',
            started_at: new Date().toISOString(),
            sources_used: config.news_sources,
            keywords_used: config.search_keywords,
            prompt_sent: config.prompt_template?.slice(0, 500)
          })
          .select()
          .single();

        // Generate topics
        const topics = await generateTopicsWithConfig(config);

        // Save topics to database
        const savedTopics = [];
        for (const topic of topics) {
          const { data, error } = await supabase
            .from('ai_daily_topics')
            .insert({
              title: topic.title,
              category: topic.category,
              description: topic.description || topic.confidence_reasoning || '',
              trading_end_date: topic.suggested_end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              source_keywords: topic.source_keywords || config.search_keywords || [],
              ai_confidence: 0.8,
              ai_model_version: config.ai_model,
              status: 'pending',
              config_id: config.id,
              generated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!error) {
            savedTopics.push(data);
          }
        }

        // Update job as completed
        const executionTime = Date.now() - jobStartTime;
        await supabase
          .from('ai_topic_generation_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            execution_time_ms: executionTime,
            topics_generated: savedTopics,
            topics_count: savedTopics.length,
            raw_response: JSON.stringify(topics).slice(0, 10000)
          })
          .eq('id', job.id);

        // Update config stats
        await supabase
          .from('ai_topic_configs')
          .update({
            last_generated_at: new Date().toISOString(),
            generation_count: (config.generation_count || 0) + 1
          })
          .eq('id', config.id);

        allTopics.push(...savedTopics);
        jobResults.push({ config: config.name, generated: savedTopics.length });

      } catch (configError: any) {
        console.error(`[DailyTopics] Config ${config.name} failed:`, configError);
        
        // Log failed job
        await supabase
          .from('ai_topic_generation_jobs')
          .insert({
            config_id: config.id,
            status: 'failed',
            error_message: configError.message,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({
      success: true,
      configs_processed: configs.length,
      total_topics_generated: allTopics.length,
      results: jobResults,
      executionTimeMs: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[DailyTopics] Error:', error);
    return NextResponse.json(
      { error: error.message, executionTimeMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint for admin
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', '') || '');
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get config ID from body (optional)
    const body = await request.json().catch(() => ({}));
    const configId = body.config_id;

    // If specific config requested, filter by it
    if (configId) {
      const { data: config } = await supabase
        .from('ai_topic_configs')
        .select('*')
        .eq('id', configId)
        .single();
      
      if (!config) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 });
      }
    }

    // Trigger the same logic as GET
    return GET(request);
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
