/**
 * Upstash Workflow - Event Processor
 * Handles async event processing
 * Optimized for Vercel Edge + Free Tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Workflow steps
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    const { step, data } = payload;

    const supabase = await createServiceClient();

    // Step 1: Initialize
    if (step === 'init' || !step) {
      const { event_id, config } = data;

      console.log(`[Workflow] Initializing event ${event_id}`);

      // Get event details
      const { data: event } = await supabase
        .from('markets')
        .select('*')
        .eq('id', event_id)
        .single();

      if (!event) {
        throw new Error('Event not found');
      }

      // If AI Oracle is configured, trigger AI analysis
      if (config?.primary_method === 'ai_oracle') {
        return NextResponse.json({
          step: 'init',
          status: 'pending',
          next_step: 'ai_analysis',
          event_id,
          config
        });
      }

      // Otherwise complete
      return NextResponse.json({
        step: 'init',
        status: 'completed',
        event_id,
        message: 'Event ready for manual resolution'
      });
    }

    // Step 2: AI Analysis (if needed)
    if (step === 'ai_analysis') {
      const { event_id, config } = data;

      console.log(`[Workflow] AI analysis for event ${event_id}`);

      // Get event
      const { data: event } = await supabase
        .from('markets')
        .select('*')
        .eq('id', event_id)
        .single();

      if (!event) {
        throw new Error('Event not found');
      }

      // Build AI prompt
      const prompt = `
Analyze this prediction market event for Bangladesh context:

Question: ${event.question}
Description: ${event.description}
Category: ${event.category}

Keywords: ${config.ai_keywords?.join(', ') || 'N/A'}
Sources: ${config.ai_sources?.join(', ') || 'N/A'}

Task:
1. Search for relevant news and information
2. Analyze current trends and data
3. Provide confidence score (0-100)
4. Suggest preliminary outcome if possible

Return JSON format:
{
  "analysis": "detailed analysis",
  "confidence": 85,
  "trending_keywords": ["keyword1", "keyword2"],
  "suggested_outcome": "YES/NO/UNCERTAIN",
  "sources_found": ["source1", "source2"]
}
`;

      // Call Gemini API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        }
      );

      if (!geminiResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const geminiData = await geminiResponse.json();
      const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      // Parse analysis
      let analysis = {};
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Analysis parse error:', e);
      }

      // Save analysis to database
      await supabase
        .from('ai_resolution_pipelines')
        .insert({
          market_id: event_id,
          pipeline_id: `wf-${Date.now()}`,
          query: { question: event.question },
          synthesis_output: analysis,
          final_confidence: (analysis as any).confidence || 0,
          status: 'completed'
        });

      return NextResponse.json({
        step: 'ai_analysis',
        status: 'completed',
        event_id,
        analysis,
        execution_time_ms: Date.now() - startTime
      });
    }

    // Default: complete
    return NextResponse.json({
      status: 'completed',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Workflow error:', error);
    return NextResponse.json(
      {
        error: error.message,
        execution_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
