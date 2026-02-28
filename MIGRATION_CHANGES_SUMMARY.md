# Database & Code Changes Summary
## Plokymarket - Event Creation & Category System

---

## 📁 Files Modified

### 1. Database Migrations

#### `supabase/migrations/094_reimplemented_events_markets.sql`
**Updated `create_event_complete` function with custom category support:**

```sql
CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
    v_slug TEXT;
    v_result JSONB;
    v_initial_liquidity NUMERIC;
    v_system_user_id UUID;
    v_category TEXT;
    v_is_custom_category BOOLEAN;
BEGIN
    -- Generate slug if not provided
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(COALESCE(p_event_data->>'title', p_event_data->>'question'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    
    -- Check if this is a custom category (from "Other" option)
    v_is_custom_category := COALESCE((p_event_data->>'is_custom_category')::BOOLEAN, FALSE);
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    -- If custom category, add to custom_categories table if not exists
    IF v_is_custom_category AND v_category != 'general' THEN
        -- Try to insert, handle both name and slug conflicts
        BEGIN
            INSERT INTO public.custom_categories (name, slug, icon, display_order, created_by)
            VALUES (
                v_category,
                lower(regexp_replace(v_category, '[^a-zA-Z0-9]+', '-', 'g')),
                '📌',
                999,
                p_admin_id
            );
        EXCEPTION WHEN unique_violation THEN
            -- Category already exists (either name or slug), continue without error
            NULL;
        END;
    END IF;
    
    -- Insert event
    INSERT INTO public.events (
        title, slug, question, description, category, subcategory,
        tags, image_url, answer_type, answer1, answer2, status,
        starts_at, trading_opens_at, trading_closes_at,
        resolution_method, resolution_delay_hours, resolution_source,
        initial_liquidity, current_liquidity, is_featured,
        ai_keywords, ai_sources, ai_confidence_threshold, created_by
    ) VALUES (
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        v_slug,
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        COALESCE((p_event_data->'tags')::TEXT[], '{}'),
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE(p_event_data->>'status', 'pending'),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        p_event_data->>'resolution_source',
        v_initial_liquidity,
        v_initial_liquidity,
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
        COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Create linked market record
    INSERT INTO public.markets (
        event_id, name, question, description, category, subcategory,
        tags, trading_closes_at, resolution_delay_hours,
        initial_liquidity, liquidity, status, slug,
        answer_type, answer1, answer2, is_featured, created_by, image_url
    ) VALUES (
        v_event_id,
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        COALESCE((p_event_data->'tags')::TEXT[], '{}'),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug,
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        p_admin_id,
        p_event_data->>'image_url'
    )
    RETURNING id INTO v_market_id;
    
    -- Create resolution config
    INSERT INTO resolution_systems (
        event_id, primary_method, ai_keywords, ai_sources, confidence_threshold, status
    ) VALUES (
        COALESCE(v_market_id, v_event_id),
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
        COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        'pending'
    );
    
    -- Initialize orderbook with liquidity
    IF COALESCE(p_event_data->>'status', 'pending') = 'active' AND v_initial_liquidity > 0 THEN
        SELECT id INTO v_system_user_id
        FROM public.user_profiles
        WHERE is_admin = true
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_system_user_id IS NOT NULL THEN
            INSERT INTO public.orders (
                market_id, user_id, side, outcome, price, quantity, filled_quantity, status, order_type
            ) VALUES 
            (v_market_id, v_system_user_id, 'buy', 'YES', 0.48, v_initial_liquidity, 0, 'open', 'limit'),
            (v_market_id, v_system_user_id, 'buy', 'NO', 0.48, v_initial_liquidity, 0, 'open', 'limit');
        ELSE
            RAISE WARNING 'No admin user found to seed market liquidity';
        END IF;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully',
        'is_custom_category', v_is_custom_category,
        'category', v_category
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
    RETURN v_result;
END;
$$;
```

---

### 2. Frontend Components

#### `apps/web/src/components/admin/EventCreationPanel.tsx`

**Key Changes:**

1. **Updated ORACLE_TYPES to match database enum:**
```typescript
const ORACLE_TYPES = [
  { 
    id: 'manual_admin', 
    name: 'ম্যানুয়াল (অ্যাডমিন)', 
    description: 'অ্যাডমিন প্যানেল থেকে সরাসরি রেজাল্ট ইনপুট দেয়া হবে।' 
  },
  { 
    id: 'ai_oracle', 
    name: 'AI ওরাকল (Vertex/Kimi)', 
    description: 'AI এজেন্ট স্বয়ংক্রিয়ভাবে নিউজ স্ক্র্যাপ করে রেজাল্ট দিবে।' 
  },
  { 
    id: 'expert_panel', 
    name: 'এক্সপার্ট প্যানেল', 
    description: 'বাংলাদেশি বিশেষজ্ঞদের একটি প্যানেল রেজাল্ট যাচাই করবে।' 
  },
  { 
    id: 'external_api', 
    name: 'এক্সটারনাল API', 
    description: 'সরাসরি স্পোর্টস বা ফিন্যান্স ডেটা সোর্স থেকে রেজাল্ট আসবে।' 
  },
  { 
    id: 'community_vote', 
    name: 'কমিউনিটি ভোট', 
    description: 'প্ল্যাটফর্ম ব্যবহারকারীদের ভোটের মাধ্যমে রেজোলিউশন।' 
  },
  { 
    id: 'hybrid', 
    name: 'হাইব্রিড সিস্টেম', 
    description: 'AI এবং মানুষের সমন্বয়ে একটি উন্নত রেজোলিউশন ব্যবস্থা।' 
  }
];
```

2. **Added custom category state and handlers:**
```typescript
// Custom category state for "Other" option
const [customCategory, setCustomCategory] = useState('');
const isOtherCategory = eventData.category === 'Other';
```

3. **Updated category selector with "Other" option:**
```typescript
<Select value={eventData.category} onValueChange={(value) => {
  setEventData(prev => ({ ...prev, category: value }));
  if (value !== 'Other') {
    setCustomCategory('');
  }
}}>
  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
    <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
  </SelectTrigger>
  <SelectContent className="bg-slate-900 border-slate-700">
    {categoriesLoading ? (
      <SelectItem value="loading" disabled className="text-slate-500">
        লোড হচ্ছে...
      </SelectItem>
    ) : (
      <>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-slate-800">
            {cat.bn} ({cat.id})
          </SelectItem>
        ))}
        <SelectItem value="Other" className="text-white hover:bg-slate-800 border-t border-slate-700 mt-1 pt-1">
          অন্যান্য (Custom Category)
        </SelectItem>
      </>
    )}
  </SelectContent>
</Select>

{/* Custom Category Input - shown only when "Other" is selected */}
{isOtherCategory && (
  <div className="mt-2">
    <Input
      value={customCategory}
      onChange={(e) => setCustomCategory(e.target.value)}
      placeholder="কাস্টম ক্যাটাগরি টাইপ করুন..."
      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 border-dashed"
    />
    <p className="text-xs text-slate-400 mt-1">
      এই ক্যাটাগরি নতুন হিসেবে সংরক্ষণ হবে
    </p>
  </div>
)}
```

4. **Updated form submission to include custom category:**
```typescript
body: JSON.stringify({
  event_data: {
    ...eventData,
    category: isOtherCategory && customCategory.trim() 
      ? customCategory.trim() 
      : eventData.category,
    is_custom_category: isOtherCategory && !!customCategory.trim()
  },
  resolution_config: resolutionConfig
})
```

---

### 3. API Routes

#### `apps/web/src/app/api/admin/events/create/route.ts`

**Updated to use `create_event_complete` RPC:**

```typescript
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
    const { event_data, resolution_config } = body

    if (!event_data?.question && !event_data?.title) {
      return NextResponse.json({ error: 'Event question or title is required' }, { status: 400 })
    }

    // Build the event payload
    const eventPayload = {
      ...event_data,
      created_by: user.id,
      resolution_method: event_data.resolution_method 
        || resolution_config?.primary_method 
        || 'manual_admin',
      ai_keywords: resolution_config?.ai_keywords || event_data.ai_keywords || [],
      ai_sources:  resolution_config?.ai_sources  || event_data.ai_sources  || [],
      ai_confidence_threshold: resolution_config?.confidence_threshold || event_data.ai_confidence_threshold || 85,
    }

    // Use the complete RPC function that handles event + market + liquidity atomically
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_event_complete', {
        p_event_data: eventPayload,
        p_admin_id:   user.id,
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
```

---

### 4. AI/ML Services

#### `apps/web/src/lib/ai/kimi-client.ts`

**Updated with proper error handling:**

```typescript
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = "https://api.moonshot.cn/v1";

export function isKimiConfigured(): boolean {
  return !!KIMI_API_KEY && KIMI_API_KEY.length > 0;
}

export async function callKimiAPI(
  messages: KimiMessage[],
  options: KimiCompletionOptions = {}
): Promise<KimiCompletionResult> {
  // Check if Kimi API is configured
  if (!isKimiConfigured()) {
    throw new Error(
      "Kimi API not configured. Please set KIMI_API_KEY environment variable."
    );
  }
  // ... rest of the function
}

export async function checkKimiHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  
  if (!isKimiConfigured()) {
    return {
      healthy: false,
      latencyMs: 0,
      error: "KIMI_API_KEY not configured",
    };
  }
  // ... rest of the function
}
```

---

### 5. Vertex AI API

#### `apps/web/src/app/api/ai/vertex-generate/route.ts`

**Updated with stable model IDs and asia-south1 region:**

```typescript
/**
 * Vertex AI Generation API
 * Region: asia-south1 (Mumbai) for low latency in Bangladesh
 */

const FAST_MODEL = 'gemini-1.5-flash-002';  // Fast, cost-effective tasks
const PRO_MODEL  = 'gemini-1.5-pro-002';    // Complex reasoning tasks

function initVertexAI(): VertexAI | null {
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION || 'asia-south1'; // Mumbai for BD
    
    if (!project) {
      console.warn('[Vertex API] GOOGLE_CLOUD_PROJECT not set');
      return null;
    }
    
    console.log(`[Vertex API] Initializing with project: ${project}, location: ${location}`);
    return new VertexAI({ project, location, googleAuthOptions: getAuthOptions() });
  } catch (error) {
    console.error('[Vertex API] Failed to init:', error);
    return null;
  }
}
```

---

## 📊 Data Flow

```
Admin Panel (Event Creation)
    ↓
[1] Select Category → "Other" → Custom Input
    ↓
API: /api/admin/events/create
    ↓
RPC: create_event_complete(p_event_data, p_admin_id)
    ↓
[1] Check is_custom_category flag
    ↓
[2] IF custom: INSERT INTO custom_categories
    ↓
[3] INSERT INTO events
    ↓
[4] INSERT INTO markets (linked to event)
    ↓
[5] INSERT INTO resolution_systems
    ↓
[6] IF active: Seed orderbook with liquidity
    ↓
Return: { success, event_id, market_id, slug }
```

---

## 🔧 Environment Variables

Required in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Cloud / Vertex AI
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
VERTEX_LOCATION=asia-south1
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=base64-encoded-service-account-json

# Kimi AI (Optional fallback)
KIMI_API_KEY=your-kimi-api-key

# QStash
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
```

---

## 🚀 Deployment Status

| Component | Status | URL |
|-----------|--------|-----|
| Frontend | ✅ Live | https://polymarket-bangladesh.vercel.app |
| Database | ✅ Updated | Supabase Cloud |
| Migrations | ✅ Ready | Run manually or auto-deploy |

---

## 📝 Post-Deployment Checklist

1. **Run Database Migrations:**
   ```sql
   -- In Supabase SQL Editor
   -- Migration 094 is already updated
   -- Migration 125 has custom_categories table
   -- Migration 129 has constraint drops
   ```

2. **Verify Environment Variables:**
   - Check all required vars in Vercel Dashboard
   - Ensure GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is valid

3. **Test Event Creation:**
   - Login as admin
   - Go to /sys-cmd-7x9k2/events/create
   - Try "Other" category option
   - Verify custom category appears in dropdown

4. **Test AI Features:**
   - Test Vertex AI generation
   - Verify Kimi fallback works
