/**
 * ============================================================
 * app/api/admin/events/create/route.ts
 * ============================================================
 * POST /api/admin/events/create
 *
 * This is the FIXED version of the event creation route.
 *
 * What was broken before:
 *   - Scattered SQL logic duplicated across multiple routes
 *   - No atomic transaction → partial failures left orphaned rows
 *   - Liquidity never seeded → market appeared dead to users
 *   - trading_closes_at stored in local time instead of UTC
 *   - Slug generation was naive and could collide
 *
 * What this version does:
 *   1. Validates the request body (auth + required fields)
 *   2. Converts trading_closes_at from Dhaka local → UTC
 *   3. Delegates everything else to EventService.createEventAtomic()
 *      which calls the create_event_complete PostgreSQL RPC.
 *      That RPC is a single PG transaction: event + market + orderbook seed.
 *   4. Returns structured JSON with event_id, market_id, and slug.
 *
 * Error codes:
 *   400 — Validation failure (missing title, invalid date, etc.)
 *   401 — Not authenticated or not an admin
 *   500 — DB error (check server logs for detail)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { eventService, type CreateEventInput } from '@/lib/services/EventService';
import { convertToUTC } from '@/lib/utils/timezone';

// ── Request body shape ───────────────────────────────────────────────────────

interface CreateEventRequestBody {
  // Required
  title:             string;
  trading_closes_at: string;  // datetime-local string (Asia/Dhaka) OR UTC ISO

  // Optional
  question?:               string;
  description?:            string;
  category?:               string;
  subcategory?:            string;
  tags?:                   string | string[];   // Accept comma-separated string OR array
  image_url?:              string;
  slug?:                   string;
  status?:                 'draft' | 'pending' | 'active';
  answer1?:                string;
  answer2?:                string;
  answer_type?:            'binary' | 'multiple' | 'scalar';
  resolution_method?:      string;
  resolution_delay_hours?: number;
  initial_liquidity?:      number;
  is_featured?:            boolean;
  ai_keywords?:            string | string[];
  ai_sources?:             string | string[];
  ai_confidence_threshold?: number;
  is_custom_category?:     boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a value that might be a comma-separated string or an array into an array */
function toArray(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Determine if a string is already a UTC ISO string (has Z or +offset suffix)
 * or is a naive datetime-local string that needs conversion.
 */
function isUtcString(s: string): boolean {
  return s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s);
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Authentication ─────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'অনুমতি নেই — আপনাকে লগইন করতে হবে' },
      { status: 401 }
    );
  }

  // ── 2. Admin role check ───────────────────────────────────────────────────
  // Check user_metadata.role OR a separate admin_users table.
  // Adjust this check to match your actual admin verification logic.
  const isAdmin =
    user.user_metadata?.role === 'admin' ||
    user.user_metadata?.is_admin === true ||
    user.app_metadata?.role === 'admin';

  if (!isAdmin) {
    // Secondary check: look up profiles table if metadata isn't set
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'শুধুমাত্র অ্যাডমিনরা ইভেন্ট তৈরি করতে পারেন' },
        { status: 401 }
      );
    }
  }

  // ── 3. Parse & validate body ──────────────────────────────────────────────
  let body: CreateEventRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Required field validation
  if (!body.title || body.title.trim().length < 5) {
    return NextResponse.json(
      { success: false, error: 'শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে' },
      { status: 400 }
    );
  }

  if (!body.trading_closes_at) {
    return NextResponse.json(
      { success: false, error: 'ট্রেডিং সমাপ্তির তারিখ আবশ্যক' },
      { status: 400 }
    );
  }

  // ── 4. Normalize trading_closes_at to UTC ─────────────────────────────────
  // If the client sent a naive datetime-local string (from the admin form),
  // we treat it as Asia/Dhaka and convert to UTC.
  // If it's already a UTC ISO string, we leave it alone.
  let tradingClosesUtc: string;
  if (isUtcString(body.trading_closes_at)) {
    tradingClosesUtc = body.trading_closes_at;
  } else {
    tradingClosesUtc = convertToUTC(body.trading_closes_at);
  }

  if (!tradingClosesUtc) {
    return NextResponse.json(
      { success: false, error: 'trading_closes_at তারিখ ফরম্যাট ভুল' },
      { status: 400 }
    );
  }

  // Must be in the future
  if (new Date(tradingClosesUtc) <= new Date()) {
    return NextResponse.json(
      { success: false, error: 'ট্রেডিং সমাপ্তির তারিখ ভবিষ্যতে হতে হবে' },
      { status: 400 }
    );
  }

  // ── 5. Build the CreateEventInput ─────────────────────────────────────────
  const input: CreateEventInput = {
    title:                   body.title.trim(),
    trading_closes_at:       tradingClosesUtc,
    question:                body.question?.trim()       || body.title.trim(),
    description:             body.description?.trim()    || '',
    category:                body.category               || 'general',
    subcategory:             body.subcategory            || undefined,
    tags:                    toArray(body.tags),
    image_url:               body.image_url              || undefined,
    slug:                    body.slug?.trim()            || undefined,
    status:                  body.status                  || 'active',
    answer1:                 body.answer1?.trim()         || 'হ্যাঁ (Yes)',
    answer2:                 body.answer2?.trim()         || 'না (No)',
    answer_type:             body.answer_type             || 'binary',
    resolution_method:       body.resolution_method       || 'manual_admin',
    resolution_delay_hours:  Number(body.resolution_delay_hours  ?? 24),
    initial_liquidity:       Number(body.initial_liquidity       ?? 1000),
    is_featured:             Boolean(body.is_featured             ?? false),
    ai_keywords:             toArray(body.ai_keywords),
    ai_sources:              toArray(body.ai_sources),
    ai_confidence_threshold: Number(body.ai_confidence_threshold ?? 85),
    is_custom_category:      Boolean(body.is_custom_category      ?? false),
  };

  // ── 6. Delegate to EventService (atomic DB transaction) ───────────────────
  console.log(`[/api/admin/events/create] Admin ${user.id} creating: "${input.title}"`);

  const result = await eventService.createEventAtomic(input, user.id);

  if (!result.success) {
    console.error('[/api/admin/events/create] EventService failed:', result);
    return NextResponse.json(
      {
        success: false,
        error:   result.error  || 'ইভেন্ট তৈরিতে সমস্যা হয়েছে',
        detail:  result.detail || '',
        hint:    result.hint   || '',
      },
      { status: 500 }
    );
  }

  // ── 7. Success response ───────────────────────────────────────────────────
  return NextResponse.json(
    {
      success:   true,
      event_id:  result.event_id,
      market_id: result.market_id,
      slug:      result.slug,
      message:   result.message || 'ইভেন্ট ও মার্কেট সফলভাবে তৈরি হয়েছে',
      // Convenience redirect URL for the admin to click
      market_url: `/markets/${result.slug}`,
    },
    { status: 201 }
  );
}

// ── Reject non-POST methods gracefully ───────────────────────────────────────
export async function GET() {
  return NextResponse.json(
    { error: 'POST method required' },
    { status: 405 }
  );
}
