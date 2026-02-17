/**
 * Admin AI Configuration API
 * Manage AI topic generation settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET - Fetch AI settings
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('admin_ai_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ settings: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST - Update AI settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      custom_instruction, 
      target_region, 
      default_categories,
      auto_generate_enabled,
      auto_generate_time,
      max_daily_topics,
      gemini_model,
      admin_id 
    } = body;
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('admin_ai_settings')
      .update({
        custom_instruction,
        target_region,
        default_categories,
        auto_generate_enabled,
        auto_generate_time,
        max_daily_topics,
        gemini_model,
        updated_by: admin_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      settings: data,
      message: 'AI settings updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
