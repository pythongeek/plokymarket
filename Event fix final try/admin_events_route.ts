// apps/web/src/app/api/admin/events/route.ts
// Admin-only events listing — used by /sys-cmd-7x9k2/events page

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ─── Auth guard helper ────────────────────────────────────────────────────────
async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin, is_super_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin && !profile?.is_super_admin) return null
  return user
}

// ─── GET /api/admin/events ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status   = searchParams.get('status')   || undefined
    const category = searchParams.get('category') || undefined
    const search   = searchParams.get('search')   || undefined
    const limit    = Math.min(parseInt(searchParams.get('limit')  || '100'), 200)
    const offset   = parseInt(searchParams.get('offset') || '0')

    // Try the RPC function first (returns resolver_reference + market_count)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_events', {
      p_status:   status   ?? null,
      p_category: category ?? null,
      p_search:   search   ?? null,
      p_limit:    limit,
      p_offset:   offset,
    })

    if (!rpcError && rpcData) {
      return NextResponse.json({ data: rpcData, count: rpcData.length })
    }

    // Fallback: direct table query if RPC fails
    console.warn('[admin/events] RPC failed, falling back to direct query:', rpcError?.message)

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status)   query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (search)   query = query.or(
      `title.ilike.%${search}%,question.ilike.%${search}%`
    )

    const { data, error, count } = await query

    if (error) {
      console.error('[admin/events] Fallback query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (err: any) {
    console.error('[admin/events] Unexpected error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/events ──────────────────────────────────────────────────
// Body: { id, ...fields }  — patch any event fields
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await requireAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Event id required' }, { status: 400 })
    }

    // Disallow changing created_by through this endpoint
    delete updates.created_by

    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
