'use client'
// app/(dashboard)/sys-cmd-7x9k2/events/create/page.tsx
// Fixes:
//  1. Full category list restored
//  2. Custom category input field
//  3. Proper payload sent to fixed API

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BUILT_IN_CATEGORIES, slugifyCategory } from '@/lib/config/categories'

/* ── tiny helpers ── */
const generateSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .trim() +
  '-' +
  Math.random().toString(36).slice(2, 6)

/* ── types ── */
interface FormState {
  title: string
  question: string
  description: string
  category: string
  customCategory: string   // ← NEW
  subcategory: string
  tags: string
  trading_closes_at: string
  resolution_delay_hours: number
  initial_liquidity: number
  answer_type: string
  answer1: string
  answer2: string
  image_url: string
  is_featured: boolean
  resolution_method: string
  ai_keywords: string
  ai_sources: string
  ai_confidence_threshold: number
}

const RESOLUTION_METHODS = [
  { value: 'manual_admin',   label: '🛡️ Manual Admin'   },
  { value: 'ai_oracle',      label: '🤖 AI Oracle'      },
  { value: 'expert_panel',   label: '👥 Expert Panel'   },
  { value: 'external_api',   label: '🔗 External API'   },
  { value: 'consensus',      label: '📊 Consensus'      },
  { value: 'community_vote', label: '👥 Community Vote' },
  { value: 'hybrid',         label: '🔀 Hybrid'         },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [showCustomCategory, setShowCustomCategory] = useState(false)

  const [form, setForm] = useState<FormState>({
    title:                    '',
    question:                 '',
    description:              '',
    category:                 '',
    customCategory:           '',
    subcategory:              '',
    tags:                     '',
    trading_closes_at:        '',
    resolution_delay_hours:   24,
    initial_liquidity:        1000,
    answer_type:              'binary',
    answer1:                  'হ্যাঁ (Yes)',
    answer2:                  'না (No)',
    image_url:                '',
    is_featured:              false,
    resolution_method:        'manual_admin',
    ai_keywords:              '',
    ai_sources:               '',
    ai_confidence_threshold:  85,
  })

  /* load custom categories from DB */
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('custom_categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        if (data) setCustomCategories(data.map((r: any) => r.name))
      })
  }, [])

  const set = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  /* effective category resolves custom input */
  const effectiveCategory = showCustomCategory
    ? form.customCategory.trim()
    : form.category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.question.trim()) { setError('Question is required'); return }
    if (!effectiveCategory)    { setError('Category is required'); return }
    if (!form.trading_closes_at) { setError('Trading close date is required'); return }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); setLoading(false); return }

      const slug = generateSlug(form.title || form.question)

      const payload = {
        event_data: {
          title:                  form.title || form.question,
          question:               form.question,
          description:            form.description,
          category:               effectiveCategory,
          subcategory:            form.subcategory,
          tags:                   form.tags.split(',').map(t => t.trim()).filter(Boolean),
          slug,
          image_url:              form.image_url,
          trading_closes_at:      form.trading_closes_at,
          resolution_delay_hours: form.resolution_delay_hours,
          initial_liquidity:      form.initial_liquidity,
          answer_type:            form.answer_type,
          answer1:                form.answer1,
          answer2:                form.answer2,
          is_featured:            form.is_featured,
          resolution_method:      form.resolution_method,
          ai_keywords:            form.ai_keywords.split(',').map(k => k.trim()).filter(Boolean),
          ai_sources:             form.ai_sources.split(',').map(s => s.trim()).filter(Boolean),
          ai_confidence_threshold: form.ai_confidence_threshold,
          status:                 'active',
        },
        resolution_config: {
          primary_method:       form.resolution_method,
          confidence_threshold: form.ai_confidence_threshold,
          ai_keywords:          form.ai_keywords.split(',').map(k => k.trim()).filter(Boolean),
          ai_sources:           form.ai_sources.split(',').map(s => s.trim()).filter(Boolean),
        },
      }

      const res = await fetch('/api/admin/events/create', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || data.details || 'Event creation failed')
      } else {
        setSuccess(`✅ Event created! ID: ${data.event_id}`)
        /* save custom category if new */
        if (showCustomCategory && form.customCategory.trim()) {
          await supabase.from('custom_categories').insert({
            name:        form.customCategory.trim(),
            slug:        slugifyCategory(form.customCategory.trim()),
            is_active:   true,
            display_order: 999,
          }).then(() => {})
        }
        setTimeout(() => router.push('/sys-cmd-7x9k2'), 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  /* all category options = built-in + DB custom (deduped) */
  const allCategories = [
    ...BUILT_IN_CATEGORIES.map(c => c.name),
    ...customCategories.filter(c => !BUILT_IN_CATEGORIES.some(b => b.name === c)),
  ]

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Title ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Short display title"
          />
        </div>

        {/* ── Question ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Question <span className="text-red-500">*</span></label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={form.question}
            onChange={e => set('question', e.target.value)}
            placeholder="Will X happen before Y date?"
            required
          />
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* ── Category + Custom ── */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>

          {!showCustomCategory ? (
            <div className="flex gap-2">
              <select
                className="flex-1 border rounded px-3 py-2"
                value={form.category}
                onChange={e => set('category', e.target.value)}
                required={!showCustomCategory}
              >
                <option value="">— Select category —</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCustomCategory(true)}
                className="px-3 py-2 border rounded text-sm text-blue-600 hover:bg-blue-50"
                title="Add custom category"
              >
                + Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                value={form.customCategory}
                onChange={e => set('customCategory', e.target.value)}
                placeholder="Enter custom category name"
                autoFocus
                required={showCustomCategory}
              />
              <button
                type="button"
                onClick={() => { setShowCustomCategory(false); set('customCategory', '') }}
                className="px-3 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                ← Back to list
              </button>
            </div>
          )}

          {showCustomCategory && form.customCategory && (
            <p className="mt-1 text-xs text-gray-500">
              Slug: <code>{slugifyCategory(form.customCategory)}</code> · will be saved as new category
            </p>
          )}
        </div>

        {/* ── Subcategory ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Subcategory</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.subcategory}
            onChange={e => set('subcategory', e.target.value)}
            placeholder="e.g. IPL, BPL, National League…"
          />
        </div>

        {/* ── Tags ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="cricket, national, 2026"
          />
        </div>

        {/* ── Image URL ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.image_url}
            onChange={e => set('image_url', e.target.value)}
            placeholder="https://…"
          />
        </div>

        {/* ── Trading closes + Resolution delay ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Trading Closes At <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2"
              value={form.trading_closes_at}
              onChange={e => set('trading_closes_at', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resolution Delay (hours)</label>
            <input
              type="number"
              min={0}
              max={720}
              className="w-full border rounded px-3 py-2"
              value={form.resolution_delay_hours}
              onChange={e => set('resolution_delay_hours', Number(e.target.value))}
            />
          </div>
        </div>

        {/* ── Liquidity ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Initial Liquidity (USDC)</label>
          <input
            type="number"
            min={100}
            className="w-full border rounded px-3 py-2"
            value={form.initial_liquidity}
            onChange={e => set('initial_liquidity', Number(e.target.value))}
          />
        </div>

        {/* ── Answers ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Answer 1 (Yes)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.answer1}
              onChange={e => set('answer1', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Answer 2 (No)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.answer2}
              onChange={e => set('answer2', e.target.value)}
            />
          </div>
        </div>

        {/* ── Resolution method ── */}
        <div>
          <label className="block text-sm font-medium mb-1">Resolution Method</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.resolution_method}
            onChange={e => set('resolution_method', e.target.value)}
          >
            {RESOLUTION_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* ── AI Oracle config (conditional) ── */}
        {form.resolution_method === 'ai_oracle' && (
          <div className="space-y-3 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-medium text-blue-800">🤖 AI Oracle Configuration</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Keywords (comma-separated)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.ai_keywords}
                onChange={e => set('ai_keywords', e.target.value)}
                placeholder="cricket, Bangladesh, final"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">News Sources (comma-separated)</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.ai_sources}
                onChange={e => set('ai_sources', e.target.value)}
                placeholder="prothomalo.com, thedailystar.net"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confidence Threshold: {form.ai_confidence_threshold}%
              </label>
              <input
                type="range"
                min={70}
                max={99}
                className="w-full"
                value={form.ai_confidence_threshold}
                onChange={e => set('ai_confidence_threshold', Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* ── Featured toggle ── */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={e => set('is_featured', e.target.checked)}
          />
          <span className="text-sm font-medium">Featured event</span>
        </label>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating Event…' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}
