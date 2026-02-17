# Hybrid Mode এবং Resolution Systems - Part 2

## 📝 ইভেন্ট তৈরির Mode 3: Hybrid Creator

Hybrid মোডে ম্যানুয়াল কন্ট্রোল + AI সাজেশন একসাথে থাকে।

### `app/admin/events/create/hybrid/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { 
  Sparkles, 
  Edit3, 
  Lightbulb,
  RefreshCw,
  Check,
  AlertTriangle
} from 'lucide-react'
import { motion } from 'framer-motion'

interface FieldSuggestion {
  value: string
  confidence: number
  reasoning: string
}

interface Suggestions {
  title?: FieldSuggestion
  question?: FieldSuggestion
  description?: FieldSuggestion
  category?: FieldSuggestion
  tags?: FieldSuggestion
  end_date?: FieldSuggestion
}

export default function HybridEventCreator() {
  const router = useRouter()
  const supabase = createClient()
  
  // ফর্ম স্টেট (Manual থেকে same)
  const [formData, setFormData] = useState({
    name: '',
    question: '',
    description: '',
    category: 'Sports',
    subcategory: '',
    tags: [] as string[],
    starts_at: new Date().toISOString(),
    ends_at: '',
    resolution_delay: 60,
    initial_liquidity: 1000,
    image_url: '',
  })

  // AI Suggestions স্টেট
  const [suggestions, setSuggestions] = useState<Suggestions>({})
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState<string | null>(null)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())

  // নির্দিষ্ট ফিল্ডের জন্য AI সাজেশন জেনারেট করুন
  const generateFieldSuggestion = async (field: string) => {
    setIsGeneratingSuggestion(field)

    try {
      const context = {
        currentData: formData,
        field,
      }

      const response = await fetch('/api/ai/suggest-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })

      if (!response.ok) throw new Error('Failed to generate suggestion')

      const data = await response.json()
      
      setSuggestions(prev => ({
        ...prev,
        [field]: data.suggestion
      }))

      toast.success(`✨ ${field} এর জন্য সাজেশন তৈরি হয়েছে`)

    } catch (error) {
      console.error('Suggestion error:', error)
      toast.error('সাজেশন তৈরি করতে ব্যর্থ')
    } finally {
      setIsGeneratingSuggestion(null)
    }
  }

  // সাজেশন Apply করুন
  const applySuggestion = (field: string) => {
    const suggestion = suggestions[field as keyof Suggestions]
    if (!suggestion) return

    setFormData(prev => ({
      ...prev,
      [field]: field === 'tags' 
        ? suggestion.value.split(',').map(t => t.trim())
        : suggestion.value
    }))

    setAppliedSuggestions(prev => new Set(prev).add(field))
    toast.success(`${field} আপডেট করা হয়েছে`)
  }

  // Smart Auto-Complete: user টাইপ করার সাথে সাথে suggestion দেখান
  const [autoSuggestDebounce, setAutoSuggestDebounce] = useState<NodeJS.Timeout>()
  
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-suggest যদি user অন্তত 10 অক্ষর টাইপ করেছে
    if (value.length >= 10 && !appliedSuggestions.has(field)) {
      if (autoSuggestDebounce) clearTimeout(autoSuggestDebounce)
      
      setAutoSuggestDebounce(
        setTimeout(() => {
          generateFieldSuggestion(field)
        }, 2000) // 2 সেকেন্ড পরে
      )
    }
  }

  // সম্পূর্ণ ফর্ম AI দিয়ে পূরণ করুন
  const autoFillEntireForm = async () => {
    if (!formData.name || formData.name.length < 10) {
      toast.error('অন্তত একটি বিষয়/শিরোনাম দিন')
      return
    }

    setIsGeneratingSuggestion('all')

    try {
      const response = await fetch('/api/ai/auto-fill-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.name,
          partial_data: formData
        })
      })

      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        ...data.filled_form
      }))

      setSuggestions(data.suggestions)
      toast.success('✨ সম্পূর্ণ ফর্ম AI দিয়ে পূরণ করা হয়েছে!')

    } catch (error) {
      toast.error('অটো-ফিল করতে ব্যর্থ')
    } finally {
      setIsGeneratingSuggestion(null)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Edit3 className="w-8 h-8 text-blue-500" />
          Hybrid Event Creator
          <Sparkles className="w-6 h-6 text-purple-500" />
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ম্যানুয়াল কন্ট্রোল + AI সাহায্য - সেরা দুই জগত একসাথে
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">AI Assistant</span>
          </div>
          <Button
            onClick={autoFillEntireForm}
            disabled={isGeneratingSuggestion === 'all' || !formData.name}
            variant="outline"
            size="sm"
          >
            {isGeneratingSuggestion === 'all' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                সম্পূর্ণ ফর্ম Auto-Fill করুন
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* মূল ফর্ম */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* শিরোনাম ফিল্ড (AI Suggestion সহ) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium">শিরোনাম *</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateFieldSuggestion('name')}
                disabled={isGeneratingSuggestion === 'name'}
              >
                {isGeneratingSuggestion === 'name' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Input
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="যেমন: Bitcoin $100K by 2026?"
              maxLength={255}
            />

            {/* AI Suggestion Card */}
            {suggestions.title && !appliedSuggestions.has('name') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      AI Suggestion
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      {suggestions.title.confidence}% confident
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion('name')}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {suggestions.title.value}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {suggestions.title.reasoning}
                </p>
              </motion.div>
            )}
          </Card>

          {/* প্রশ্ন ফিল্ড (AI Suggestion সহ) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium">প্রশ্ন (Yes/No Format) *</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateFieldSuggestion('question')}
                disabled={isGeneratingSuggestion === 'question'}
              >
                {isGeneratingSuggestion === 'question' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Textarea
              value={formData.question}
              onChange={(e) => handleFieldChange('question', e.target.value)}
              placeholder="পরিষ্কার এবং যাচাইযোগ্য প্রশ্ন..."
              rows={3}
              maxLength={2000}
            />

            {suggestions.question && !appliedSuggestions.has('question') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      AI Suggestion
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion('question')}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {suggestions.question.value}
                </p>
              </motion.div>
            )}
          </Card>

          {/* বিবরণ ফিল্ড (AI Suggestion সহ) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium">বিস্তারিত বিবরণ</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => generateFieldSuggestion('description')}
                disabled={isGeneratingSuggestion === 'description'}
              >
                {isGeneratingSuggestion === 'description' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="ইভেন্ট সম্পর্কে অতিরিক্ত তথ্য..."
              rows={5}
            />

            {suggestions.description && !appliedSuggestions.has('description') && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">AI Suggestion</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion('description')}
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {suggestions.description.value}
                </p>
              </motion.div>
            )}
          </Card>

          {/* অন্যান্য ফিল্ড - Manual Creator থেকে same */}
          {/* ... ক্যাটাগরি, ট্যাগ, তারিখ, ইত্যাদি ... */}
        </div>

        {/* সাইডবার */}
        <div className="space-y-6">
          {/* AI Assistant Info */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Assistant Status
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Suggestions Used:</span>
                <span className="font-semibold">
                  {appliedSuggestions.size}/5
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-semibold">
                  {Object.values(suggestions).length > 0
                    ? Math.round(
                        Object.values(suggestions).reduce((sum, s) => sum + (s?.confidence || 0), 0) / 
                        Object.values(suggestions).length
                      )
                    : 0}%
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <h4 className="text-xs font-medium mb-2">Tips:</h4>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>• প্রতিটি ফিল্ডে <Sparkles className="w-3 h-3 inline" /> আইকনে ক্লিক করুন</li>
                <li>• Auto-complete পেতে টাইপ করুন</li>
                <li>• "Auto-Fill" দিয়ে পুরো ফর্ম পূরণ করুন</li>
              </ul>
            </div>
          </Card>

          {/* Submit */}
          <Card className="p-6">
            <Button
              className="w-full"
              size="lg"
              // onClick={handleSubmit} - Manual Creator থেকে same logic
            >
              ইভেন্ট তৈরি করুন
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

### Hybrid Mode এর জন্য API Endpoint

**`app/api/ai/suggest-field/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const runtime = 'edge'

const FIELD_PROMPTS = {
  name: `Based on the context, suggest a catchy, concise event title (max 50 chars).
The title should:
- Be attention-grabbing
- Clearly indicate the prediction topic
- Be searchable
- Include key terms

Return ONLY JSON:
{
  "value": "suggested title",
  "confidence": 85,
  "reasoning": "why this title works"
}`,

  question: `Based on the context, formulate a clear Yes/No question.
The question should:
- Be unambiguous
- Be verifiable in the future
- Have a clear resolution date
- Not be too complex

Return ONLY JSON:
{
  "value": "Will X happen by Y date?",
  "confidence": 90,
  "reasoning": "why this question is good"
}`,

  description: `Based on the context, write a 2-3 sentence description.
Include:
- Background context
- Why this matters
- Key terms/events to watch

Return ONLY JSON:
{
  "value": "description text",
  "confidence": 80,
  "reasoning": "what makes this description effective"
}`,

  tags: `Based on the context, suggest 3-5 relevant tags.
Tags should be:
- Mix of Bengali and English
- Searchable keywords
- Related to the topic
- Popular terms

Return ONLY JSON:
{
  "value": "Bitcoin,Crypto,বিটকয়েন,2026",
  "confidence": 85,
  "reasoning": "why these tags"
}`,

  category: `Based on the context, determine the best category.
Options: Sports, Politics, Crypto, Economics, Technology, Entertainment, World Events, Science, Culture, Business

Return ONLY JSON:
{
  "value": "Crypto",
  "confidence": 95,
  "reasoning": "why this category"
}`
}

export async function POST(req: NextRequest) {
  try {
    const { currentData, field } = await req.json()

    const prompt = `
Context:
${JSON.stringify(currentData, null, 2)}

Task: ${FIELD_PROMPTS[field as keyof typeof FIELD_PROMPTS]}

Current field value: ${currentData[field] || 'empty'}

Provide an improved suggestion based on the context.
`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const suggestion = JSON.parse(jsonText)

    return NextResponse.json({ suggestion })

  } catch (error: any) {
    console.error('Field suggestion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}
```

---

## 🔍 ৫টি যাচাইকরণ সিস্টেম (Resolution Systems)

### 1. AI Oracle System (নিউজ স্ক্যানার)

**`app/api/resolution/ai-oracle/[eventId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient()
    const { eventId } = params

    // ১. ইভেন্ট এবং Resolution Config লোড করুন
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    const { data: resolution } = await supabase
      .from('resolution_systems')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (!event || !resolution) {
      throw new Error('Event or resolution config not found')
    }

    const config = resolution.ai_oracle_config

    // ২. Whitelisted সোর্স থেকে নিউজ আর্টিকেল fetch করুন
    const articles = await fetchNewsArticles(
      config.sources,
      config.keywords,
      event.ends_at
    )

    if (articles.length < config.min_sources_required) {
      throw new Error(`Insufficient sources. Found ${articles.length}, need ${config.min_sources_required}`)
    }

    // ৩. Claude দিয়ে analyze করুন
    const analysis = await analyzeWithClaude(event, articles, config)

    // ৪. Confidence threshold চেক করুন
    if (analysis.confidence < config.confidence_threshold) {
      // Confidence কম - fallback এ যান
      await supabase
        .from('resolution_systems')
        .update({
          resolution_status: 'in_progress',
          evidence: { ai_analysis: analysis, low_confidence: true }
        })
        .eq('id', resolution.id)

      return NextResponse.json({
        success: false,
        message: 'Low confidence, falling back to manual resolution',
        analysis
      })
    }

    // ৫. High confidence - Resolve করুন
    const outcome = analysis.outcome === 'yes' ? 1 : 2

    await supabase
      .from('events')
      .update({
        trading_status: 'resolved',
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
        resolution_source: 'ai_oracle'
      })
      .eq('id', eventId)

    await supabase
      .from('resolution_systems')
      .update({
        resolution_status: 'resolved',
        proposed_outcome: outcome,
        confidence_level: analysis.confidence,
        evidence: { ai_analysis: analysis, articles },
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolution.id)

    return NextResponse.json({
      success: true,
      outcome,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning
    })

  } catch (error: any) {
    console.error('AI Oracle error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// News fetching helper
async function fetchNewsArticles(
  sources: string[],
  keywords: string[],
  afterDate: string
) {
  // Implementation: আপনার News APIs থেকে fetch করুন
  // এখানে placeholder - আপনার actual API calls করতে হবে
  
  const articles: any[] = []
  
  for (const source of sources) {
    // Example: NewsAPI, RSS feeds, or custom scrapers
    // articles.push(...await fetchFromSource(source, keywords, afterDate))
  }
  
  return articles
}

// Claude analysis helper
async function analyzeWithClaude(
  event: any,
  articles: any[],
  config: any
) {
  const prompt = `You are analyzing news articles to determine the outcome of a prediction market event.

Event Question: ${event.question}
Resolution Date: ${event.ends_at}

News Articles (${articles.length}):
${articles.map((a, i) => `
${i + 1}. Title: ${a.title}
   Source: ${a.source}
   Date: ${a.publishedAt}
   Content: ${a.content}
`).join('\n')}

Your task:
1. Determine if the event resolved as YES or NO
2. Provide confidence score (0-100)
3. Cite specific evidence from the articles
4. Explain your reasoning

CRITICAL: Only return YES if there is CLEAR, VERIFIED evidence from multiple credible sources.
For sensitive topics (politics, disasters), use higher threshold.

Return ONLY valid JSON:
{
  "outcome": "yes" or "no",
  "confidence": 95,
  "reasoning": "detailed explanation with citations",
  "evidence_sources": [
    "Article 1: ...",
    "Article 2: ..."
  ],
  "red_flags": ["any concerns or contradictions"]
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: 0.3, // Lower temperature for factual analysis
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type')
  }

  let jsonText = content.text.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  
  return JSON.parse(jsonText)
}
```

### 2. Manual Admin Resolution

**`app/admin/events/[eventId]/resolve/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { AlertTriangle, Check, X, FileText } from 'lucide-react'

export default function ManualResolutionPage({ params }: { params: { eventId: string } }) {
  const supabase = createClient()
  const [outcome, setOutcome] = useState<1 | 2 | null>(null)
  const [source, setSource] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // "Red Button" - জরুরী রেজোলিউশন
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)

  const handleResolve = async (isEmergency: boolean = false) => {
    if (!outcome) {
      toast.error('ফলাফল নির্বাচন করুন')
      return
    }

    if (!reasoning.trim()) {
      toast.error('যুক্তি লিখুন')
      return
    }

    setIsSubmitting(true)

    try {
      // ১. Maker-Checker: অন্য একজন অ্যাডমিনের অনুমোদন প্রয়োজন
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!isEmergency) {
        // প্রস্তাবনা তৈরি করুন (অন্য অ্যাডমিন approve করবেন)
        const { error } = await supabase
          .from('resolution_systems')
          .update({
            proposed_outcome: outcome,
            evidence: {
              manual_resolution: true,
              proposed_by: user?.id,
              reasoning,
              source,
              evidence_urls: evidence,
              proposed_at: new Date().toISOString()
            },
            resolution_status: 'pending_approval'
          })
          .eq('event_id', params.eventId)

        if (error) throw error

        toast.success('প্রস্তাবনা জমা দেওয়া হয়েছে। অন্য অ্যাডমিনের অনুমোদন প্রয়োজন।')
        
      } else {
        // Emergency - তাৎক্ষণিক resolve
        const { error: eventError } = await supabase
          .from('events')
          .update({
            trading_status: 'resolved',
            resolved_outcome: outcome,
            resolved_at: new Date().toISOString(),
            resolved_by: user?.id,
            resolution_source: source
          })
          .eq('id', params.eventId)

        if (eventError) throw eventError

        const { error: resError } = await supabase
          .from('resolution_systems')
          .update({
            resolution_status: 'resolved',
            proposed_outcome: outcome,
            evidence: {
              emergency_resolution: true,
              resolved_by: user?.id,
              reasoning,
              source,
              evidence_urls: evidence
            },
            resolved_at: new Date().toISOString()
          })
          .eq('event_id', params.eventId)

        if (resError) throw resError

        // Activity Log
        await supabase
          .from('admin_activity_logs')
          .insert({
            admin_id: user?.id,
            action_type: 'resolve_event',
            resource_type: 'event',
            resource_id: params.eventId,
            change_summary: `Emergency resolution: ${outcome === 1 ? 'YES' : 'NO'}`,
            reason: reasoning
          })

        toast.success('✅ ইভেন্ট resolve করা হয়েছে')
      }

    } catch (error: any) {
      toast.error(error.message || 'Resolution ব্যর্থ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">ম্যানুয়াল Resolution</h1>

      <div className="space-y-6">
        {/* Outcome Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">ফলাফল নির্বাচন করুন</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={outcome === 1 ? 'default' : 'outline'}
              size="lg"
              onClick={() => setOutcome(1)}
              className="h-24"
            >
              <Check className="w-6 h-6 mr-2" />
              YES
            </Button>
            
            <Button
              variant={outcome === 2 ? 'default' : 'outline'}
              size="lg"
              onClick={() => setOutcome(2)}
              className="h-24"
            >
              <X className="w-6 h-6 mr-2" />
              NO
            </Button>
          </div>
        </Card>

        {/* Evidence & Reasoning */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">প্রমাণ এবং যুক্তি</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                সোর্স URL/Reference *
              </label>
              <input
                type="url"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="https://example.com/official-announcement"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                যুক্তি/বিবরণ *
              </label>
              <Textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="কেন এই ফলাফল সঠিক? প্রমাণ কী?"
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                অতিরিক্ত প্রমাণ (URLs)
              </label>
              {/* TagInput for multiple evidence URLs */}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={() => handleResolve(false)}
            disabled={isSubmitting || !outcome || !reasoning}
            className="flex-1"
          >
            <FileText className="w-5 h-5 mr-2" />
            প্রস্তাবনা জমা দিন (Approval প্রয়োজন)
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={() => setShowEmergencyConfirm(true)}
            disabled={isSubmitting || !outcome || !reasoning}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Red Button (জরুরী)
          </Button>
        </div>

        {/* Emergency Confirmation Dialog */}
        {showEmergencyConfirm && (
          <Card className="p-6 border-red-500 bg-red-50 dark:bg-red-950">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              ⚠️ জরুরী Resolution নিশ্চিত করুন
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              এটি তাৎক্ষণিকভাবে ইভেন্ট resolve করবে, কোনো approval ছাড়াই।
              শুধুমাত্র জরুরী পরিস্থিতিতে ব্যবহার করুন (যেমন: ইন্টারনেট ব্ল্যাকআউট, সুস্পষ্ট সরকারি ঘোষণা)।
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={() => handleResolve(true)}
                disabled={isSubmitting}
              >
                নিশ্চিত করুন এবং Resolve করুন
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEmergencyConfirm(false)}
              >
                বাতিল করুন
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
```

চলবে পরের ফাইলে...
