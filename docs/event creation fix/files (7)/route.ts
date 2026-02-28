// app/api/admin/events/create/route.ts
// Fixed: removed outcomes field from markets insert, proper error handling

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { event_data, resolution_config, markets_data } = body

    if (!event_data?.question && !event_data?.title) {
      return NextResponse.json({ error: 'Event question or title is required' }, { status: 400 })
    }

    // Build the event payload
    const eventPayload = {
      ...event_data,
      created_by: user.id,
      // Normalize: support both resolution_method and primary_method keys
      resolution_method: event_data.resolution_method 
        || resolution_config?.primary_method 
        || 'manual_admin',
      ai_keywords: resolution_config?.ai_keywords || event_data.ai_keywords || [],
      ai_sources:  resolution_config?.ai_sources  || event_data.ai_sources  || [],
      ai_confidence_threshold: resolution_config?.confidence_threshold || event_data.ai_confidence_threshold || 85,
    }

    // Use the fixed RPC function
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_event_with_markets', {
        p_event_data:   eventPayload,
        p_markets_data: markets_data || null,
      })

    if (rpcError) {
      console.error('[create_event] RPC error:', rpcError)
      return NextResponse.json(
        { error: rpcError.message, details: rpcError.details },
        { status: 500 }
      )
    }

    if (!rpcResult?.success) {
      return NextResponse.json(
        { error: rpcResult?.error || 'Event creation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      event_id:  rpcResult.event_id,
      market_id: rpcResult.market_id,
      slug:      rpcResult.slug,
      message:   'Event created successfully',
    })

  } catch (err: any) {
    console.error('[create_event] Unexpected error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
