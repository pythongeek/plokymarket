'use client';

/**
 * =====================================================================
 * PLOKYMARKET — Event & Market Creation Page with AI Multi-Agent System
 * =====================================================================
 * ✅ AI Co-Pilot: Content, Logic, Timing, Risk agents
 * ✅ Provider Rotation: Vertex AI ↔ Kimi API
 * ✅ Real-time duplicate detection (Levenshtein)
 * ✅ Bangladesh timezone (Asia/Dhaka) handling
 * ✅ Atomic transaction for event+market creation
 * =====================================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, Eye, Save,
  Image as ImageIcon, Tag, Calendar, Settings, Shield, Zap,
  Users, Bot, Star, Clock, TrendingUp, X, Plus, CheckCircle2,
  Info, Globe, FileText, ChevronDown, Sparkles, Brain, RefreshCw
} from 'lucide-react';

// AI Agent Components
import { AIAgentStatus } from '@/components/admin/AIAgentStatus';
import { AIProposalPanel } from '@/components/admin/AIProposalPanel';
import { useAIAgents, useQuickEnhance, useDuplicateCheck, useRiskCheck } from '@/hooks/useAIAgents';
import { useMarketProposals } from '@/hooks/useMarketProposals';
import { AgentState, AgentOrchestrationResult } from '@/lib/ai-agents/types';
import { ProposedMarket } from '@/lib/ai-agents/market-proposal-agent';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'external_api' | 'community_vote' | 'hybrid';
type EventStatus = 'pending' | 'active';

interface FormData {
  title: string;
  question: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  imageUrl: string;
  tradingClosesAt: string;
  resolutionDelayHours: number;
  answer1: string;
  answer2: string;
  resolutionMethod: ResolutionMethod;
  aiKeywords: string[];
  aiSources: string[];
  confidenceThreshold: number;
  initialLiquidity: number;
  isFeatured: boolean;
  slug: string;
}

// ─── Bangladesh-Specific Data ─────────────────────────────────────────────────

const BD_CATEGORIES = [
  {
    value: 'politics',
    label: 'রাজনীতি (Politics)',
    icon: '🏛️',
    color: 'bg-red-50 border-red-200 text-red-700',
    subcategories: [
      { value: 'national_election', label: 'জাতীয় নির্বাচন (National Election)' },
      { value: 'parliament', label: 'জাতীয় সংসদ (Parliament)' },
      { value: 'local_govt', label: 'স্থানীয় সরকার (Local Govt)' },
      { value: 'party_politics', label: 'দলীয় রাজনীতি (Party Politics)' },
    ],
  },
  {
    value: 'sports',
    label: 'খেলাধুলা (Sports)',
    icon: '🏏',
    color: 'bg-green-50 border-green-200 text-green-700',
    subcategories: [
      { value: 'cricket', label: 'ক্রিকেট (Cricket)' },
      { value: 'football', label: 'ফুটবল (Football)' },
      { value: 'ipl', label: 'IPL' },
      { value: 'world_cup', label: 'বিশ্বকাপ (World Cup)' },
      { value: 'bpl', label: 'বিপিএল (BPL)' },
    ],
  },
  {
    value: 'crypto',
    label: 'ক্রিপ্টো (Crypto)',
    icon: '₿',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    subcategories: [
      { value: 'bitcoin', label: 'Bitcoin (BTC)' },
      { value: 'ethereum', label: 'Ethereum (ETH)' },
      { value: 'altcoins', label: 'Altcoins' },
      { value: 'defi', label: 'DeFi' },
    ],
  },
  {
    value: 'entertainment',
    label: 'বিনোদন (Entertainment)',
    icon: '🎬',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    subcategories: [
      { value: 'dhallywood', label: 'ঢালিউড (Dhallywood)' },
      { value: 'music', label: 'সংগীত (Music)' },
      { value: 'ott', label: 'OTT / স্ট্রিমিং' },
    ],
  },
  {
    value: 'other',
    label: 'অন্যান্য (Other)',
    icon: '📋',
    color: 'bg-gray-50 border-gray-200 text-gray-700',
    subcategories: [
      { value: 'education', label: 'শিক্ষা (Education)' },
      { value: 'technology', label: 'প্রযুক্তি (Technology)' },
      { value: 'weather', label: 'আবহাওয়া (Weather)' },
    ],
  },
];

const RESOLUTION_METHODS = [
  {
    value: 'manual_admin' as ResolutionMethod,
    label: 'ম্যানুয়াল (Admin)',
    labelEn: 'Manual Admin',
    icon: Users,
    color: 'border-blue-300 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-300',
    description: 'অ্যাডমিন টিম সরাসরি ফলাফল নির্ধারণ করবে।',
    badge: 'সবচেয়ে নির্ভরযোগ্য',
  },
  {
    value: 'ai_oracle' as ResolutionMethod,
    label: 'AI Oracle',
    labelEn: 'AI Oracle',
    icon: Bot,
    color: 'border-purple-300 bg-purple-50',
    activeColor: 'border-purple-500 bg-purple-100 ring-2 ring-purple-300',
    description: 'AI সংবাদ বিশ্লেষণ করে স্বয়ংক্রিয়ভাবে ফলাফল নির্ধারণ করবে।',
    badge: 'স্বয়ংক্রিয়',
  },
  {
    value: 'hybrid' as ResolutionMethod,
    label: 'হাইব্রিড (Hybrid)',
    labelEn: 'Hybrid',
    icon: Sparkles,
    color: 'border-rose-300 bg-rose-50',
    activeColor: 'border-rose-500 bg-rose-100 ring-2 ring-rose-300',
    description: 'AI + Manual + Expert একসাথে।',
    badge: 'স্মার্ট মিক্স',
  },
];

const LIQUIDITY_PRESETS = [
  { value: 1000, label: '৳১,০০০', desc: 'Starter' },
  { value: 5000, label: '৳৫,০০০', desc: 'Standard' },
  { value: 10000, label: '৳১০,০০০', desc: 'Recommended ✓' },
  { value: 25000, label: '৳২৫,০০০', desc: 'Premium' },
  { value: 50000, label: '৳৫০,০০০', desc: 'High Volume' },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  const bnMap: Record<string, string> = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
    'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };

  let slug = title.toLowerCase().trim();
  for (const [bn, en] of Object.entries(bnMap)) {
    slug = slug.split(bn).join(en);
  }

  slug = slug
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = Date.now().toString(36).slice(-4);
  return slug.length > 5 ? `${slug}-${timestamp}` : `event-${timestamp}`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function NativeDropdown({ value, placeholder, options, onChange, label, required, error }: {
  value: string;
  placeholder: string;
  options: { value: string; label: string; icon?: string }[];
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full appearance-none rounded-lg border px-3 py-2.5 pr-10 text-sm
            bg-white text-gray-900 font-medium
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
            ${!value ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <option value="" disabled className="text-gray-400">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
              {opt.icon ? `${opt.icon} ` : ''}{opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag) && tags.length < 8) {
      onChange([...tags, tag]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-gray-300 bg-white min-h-[44px]">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
          placeholder={tags.length === 0 ? 'ট্যাগ লিখুন, Enter দিন...' : 'আরও যোগ করুন...'}
          className="flex-1 min-w-[120px] outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
        />
      </div>
      <p className="text-xs text-gray-500">{tags.length}/8 ট্যাগ। Enter বা কমা দিয়ে যোগ করুন।</p>
    </div>
  );
}

const STEPS = [
  { id: 1, label: 'মূল তথ্য', labelEn: 'Core Info', icon: FileText },
  { id: 2, label: 'ক্যাটাগরি', labelEn: 'Category', icon: Tag },
  { id: 3, label: 'সময়সীমা', labelEn: 'Timing', icon: Calendar },
  { id: 4, label: 'উত্তর', labelEn: 'Answers', icon: CheckCircle2 },
  { id: 5, label: 'রেজোলিউশন', labelEn: 'Resolution', icon: Shield },
  { id: 6, label: 'মার্কেট', labelEn: 'Market', icon: TrendingUp },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function EventCreationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [successData, setSuccessData] = useState<{ eventId: string; marketId: string | null; slug: string; title: string } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showAIAgents, setShowAIAgents] = useState(true);
  const [existingEvents, setExistingEvents] = useState<string[]>([]);

  // AI Agent Hook
  const {
    agents,
    currentStep: agentStep,
    isProcessing: isAIProcessing,
    result: aiResult,
    error: aiError,
    runWorkflow,
    reset: resetAI,
    rotateProvider,
  } = useAIAgents({
    onComplete: (result) => {
      applyAIResult(result);
      toast.success('✨ AI এজেন্ট সাজেশন প্রস্তুত!');
    },
    onError: (error) => {
      toast.error(`AI Error: ${error.message}`);
    },
  });

  // Quick enhance hook
  const { suggestion: enhancedTitle, isLoading: isEnhancing, enhance } = useQuickEnhance(500);

  // Duplicate check hook
  const { result: duplicateResult, isChecking: isCheckingDuplicate, check: checkDuplicate } = useDuplicateCheck(800);

  // Risk check hook
  const { risk: riskCheck, check: checkRisk } = useRiskCheck();

  const [form, setForm] = useState<FormData>({
    title: '',
    question: '',
    description: '',
    category: '',
    subcategory: '',
    tags: [],
    imageUrl: '',
    tradingClosesAt: '',
    resolutionDelayHours: 24,
    answer1: 'হ্যাঁ (YES)',
    answer2: 'না (NO)',
    resolutionMethod: 'manual_admin',
    aiKeywords: [],
    aiSources: [],
    confidenceThreshold: 85,
    initialLiquidity: 10000,
    isFeatured: false,
    slug: '',
  });

  // Fetch existing events for duplicate detection
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('events')
          .select('title')
          .limit(100);
        if (data) {
          setExistingEvents(data.map((e: any) => e.title));
        }
      } catch (e: any) {
        console.warn('Could not fetch existing events:', e);
      }
    };
    fetchEvents();
  }, []);

  // Auto-enhance title
  useEffect(() => {
    if (form.title.length >= 5) {
      enhance(form.title);
      checkDuplicate(form.title, existingEvents);
      checkRisk(form.title);
    }
  }, [form.title, enhance, checkDuplicate, checkRisk, existingEvents]);

  // Auto-generate slug
  useEffect(() => {
    if (form.title) set('slug', generateSlug(form.title));
  }, [form.title]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  // Apply AI result to form
  const applyAIResult = (result: AgentOrchestrationResult) => {
    if (result.content) {
      set('title', result.content.title);
      set('description', result.content.description);
      set('category', result.content.category.toLowerCase());
      set('tags', result.content.tags);
    }
    if (result.marketLogic) {
      set('answer1', result.marketLogic.outcomes[0] || 'হ্যাঁ');
      set('answer2', result.marketLogic.outcomes[1] || 'না');
      set('initialLiquidity', result.marketLogic.liquidityRecommendation);
    }
    if (result.timing) {
      set('tradingClosesAt', result.timing.tradingClosesAt.slice(0, 16));
    }
  };

  // Run AI workflow
  const handleRunAI = async () => {
    if (!form.title && !form.question) {
      toast.error('টাইটেল বা প্রশ্ন লিখুন');
      return;
    }

    await runWorkflow({
      title: form.title || form.question,
      description: form.description,
      category: form.category,
      outcomes: [form.answer1, form.answer2],
      trading_closes_at: form.tradingClosesAt,
      resolution_date: form.tradingClosesAt,
      existing_events: existingEvents,
    });
  };

  // Market Proposals Hook
  const {
    proposals: marketProposals,
    isGenerating: isGeneratingProposals,
    isCreating: isCreatingEventMarkets,
    error: proposalError,
    generateProposals,
    createEventWithMarkets,
    reset: resetProposals,
  } = useMarketProposals({
    onSuccess: (result) => {
      toast.success(`✅ ইভেন্ট এবং ${result.marketIds?.length || 1}টি মার্কেট তৈরি হয়েছে!`);
      setSuccessData({
        eventId: result.eventId!,
        marketId: result.marketIds?.[0] || null,
        slug: result.slug!,
        title: form.title,
      });
    },
    onError: (error) => {
      toast.error(`তৈরি ব্যর্থ: ${error.message}`);
    },
  });

  // Generate market proposals
  const handleGenerateProposals = async () => {
    if (!form.title) {
      toast.error('টাইটেল লিখুন');
      return;
    }
    await generateProposals({
      title: form.title,
      description: form.description,
      category: form.category,
    });
  };

  // Approve and create markets
  const handleApproveProposals = async (markets: ProposedMarket[]) => {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) {
      toast.error('লগইন প্রয়োজন');
      return;
    }

    await createEventWithMarkets({
      event: {
        title: form.title,
        question: form.question,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        tags: form.tags,
        image_url: form.imageUrl,
        trading_closes_at: form.tradingClosesAt,
        resolution_method: form.resolutionMethod,
        resolution_delay_hours: form.resolutionDelayHours,
        initial_liquidity: form.initialLiquidity,
        is_featured: form.isFeatured,
        answer1: form.answer1,
        answer2: form.answer2,
      },
      markets,
      createdBy: user.id,
    });
  };

  // Validation
  const validateStep = useCallback((s: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = 'ইভেন্টের শিরোনাম আবশ্যক';
      else if (form.title.length < 10) e.title = 'শিরোনাম কমপক্ষে ১০ অক্ষরের হতে হবে';
      if (!form.question.trim()) e.question = 'প্রশ্ন আবশ্যক';
    }
    if (s === 2) {
      if (!form.category) e.category = 'ক্যাটাগরি নির্বাচন করুন';
    }
    if (s === 3) {
      if (!form.tradingClosesAt) {
        e.tradingClosesAt = 'ট্রেডিং বন্ধের তারিখ আবশ্যক';
      } else {
        const date = new Date(form.tradingClosesAt);
        if (isNaN(date.getTime())) {
          e.tradingClosesAt = 'সঠিক তারিখ ও সময় প্রদান করুন';
        } else if (date.getFullYear() > 2100) {
          e.tradingClosesAt = 'সাল ২১০০ এর বেশি হতে পারে না';
        }
      }
    }
    if (s === 4) {
      if (!form.answer1.trim()) e.answer1 = 'প্রথম উত্তর আবশ্যক';
      if (!form.answer2.trim()) e.answer2 = 'দ্বিতীয় উত্তর আবশ্যক';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 6)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // Submit
  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('অনুগ্রহ করে লগইন করুন');
      }

      const payload = {
        title: form.title.trim(),
        question: form.question.trim(),
        description: form.description.trim() || null,
        category: form.category,
        subcategory: form.subcategory || null,
        tags: form.tags,
        image_url: form.imageUrl.trim() || null,
        slug: form.slug,
        trading_closes_at: new Date(form.tradingClosesAt).toISOString(),
        resolution_delay_hours: form.resolutionDelayHours,
        answer1: form.answer1,
        answer2: form.answer2,
        resolution_method: form.resolutionMethod,
        resolution_config: {
          method: form.resolutionMethod,
          ai_keywords: form.aiKeywords,
          ai_sources: form.aiSources,
          confidence_threshold: form.confidenceThreshold,
        },
        initial_liquidity: form.initialLiquidity,
        is_featured: form.isFeatured,
        status: 'active' as EventStatus,
      };

      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করা সম্ভব হয়নি (API Error)');
      }

      setSuccessData({
        eventId: result.event_id,
        marketId: result.market_id,
        slug: result.slug,
        title: form.title,
      });

      toast.success('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!');
    } catch (err: any) {
      toast.error(err.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = BD_CATEGORIES.find((c) => c.value === form.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Agent Status Panel */}
      {showAIAgents && (
        <AIAgentStatus
          agents={agents}
          currentStep={agentStep}
          isProcessing={isAIProcessing}
          onRotateProvider={rotateProvider}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">নতুন ইভেন্ট তৈরি করুন</h1>
              <p className="text-xs text-gray-500">AI-Assisted Event Creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIAgents(!showAIAgents)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${showAIAgents ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-300 text-gray-600'
                }`}
            >
              <Bot className="h-4 w-4" />
              AI Agents
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => isDone && setStep(s.id)}
                      disabled={!isDone && step !== s.id}
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                        transition-all duration-200
                        ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''}
                        ${isDone ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' : ''}
                        ${!isActive && !isDone ? 'bg-gray-200 text-gray-400' : ''}
                      `}
                    >
                      {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </button>
                    <span className={`mt-1 text-[10px] font-medium text-center leading-tight hidden sm:block
                      ${isActive ? 'text-indigo-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 transition-all ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {enhancedTitle && enhancedTitle !== form.title && !isAIProcessing && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-700">AI Suggestion: {enhancedTitle}</span>
              </div>
              <button
                onClick={() => set('title', enhancedTitle)}
                className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateResult?.isDuplicate && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                Similar event exists ({Math.round(duplicateResult.similarity * 100)}% match)
              </span>
            </div>
            {duplicateResult.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {duplicateResult.suggestions.slice(0, 3).map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => set('title', suggestion)}
                    className="text-xs bg-white border border-amber-300 px-2 py-1 rounded hover:bg-amber-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Risk Warning */}
        {riskCheck && riskCheck.riskLevel !== 'low' && (
          <div className={`mb-4 p-3 rounded-lg border ${riskCheck.riskLevel === 'high'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
            }`}>
            <div className="flex items-center gap-2">
              <Shield className={`h-4 w-4 ${riskCheck.riskLevel === 'high' ? 'text-red-500' : 'text-yellow-500'
                }`} />
              <span className={`text-sm ${riskCheck.riskLevel === 'high' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                Risk Level: {riskCheck.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* AI Market Proposal Panel */}
        {step === 1 && form.title.length > 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">AI মার্কেট প্রস্তাবনা</h3>
              <button
                onClick={handleGenerateProposals}
                disabled={isGeneratingProposals}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50 text-sm"
              >
                {isGeneratingProposals ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {isGeneratingProposals ? 'জেনারেট হচ্ছে...' : 'মার্কেট প্রস্তাবনা'}
              </button>
            </div>

            <AIProposalPanel
              proposals={marketProposals}
              isLoading={isGeneratingProposals}
              error={proposalError}
              onApprove={handleApproveProposals}
              onReject={resetProposals}
              onRegenerate={handleGenerateProposals}
            />
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Step 1: Core Info */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">মূল তথ্য (Core Information)</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateProposals}
                    disabled={isGeneratingProposals || !form.title}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGeneratingProposals ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    AI মার্কেট
                  </button>
                  <button
                    onClick={handleRunAI}
                    disabled={isAIProcessing || (!form.title && !form.question)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isAIProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    {isAIProcessing ? 'Processing...' : 'Run AI Agents'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ইভেন্টের শিরোনাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="যেমন: বিপিএল ২০২৭-এ চ্যাম্পিয়ন কে হবে?"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                  <p className="mt-1 text-xs text-gray-500">SEO-optimized title for better visibility</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    প্রশ্ন (Question) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.question}
                    onChange={(e) => set('question', e.target.value)}
                    placeholder="যেমন: ২০২৭ সালের বিপিএল চ্যাম্পিয়ন কোন দল হবে?"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${errors.question ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.question && <p className="mt-1 text-xs text-red-500">{errors.question}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ (Description)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    placeholder="ইভেন্টের বিস্তারিত বিবরণ দিন..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ছবির URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => set('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {form.imageUrl && (
                      <img src={form.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">ক্যাটাগরি নির্বাচন</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => { set('category', cat.value); set('subcategory', ''); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.category === cat.value
                      ? `${cat.color} border-current ring-2 ring-offset-1`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}

              {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <div className="mt-4">
                  <NativeDropdown
                    label="সাব-ক্যাটাগরি"
                    value={form.subcategory}
                    placeholder="সাব-ক্যাটাগরি নির্বাচন করুন"
                    options={selectedCategory.subcategories}
                    onChange={(v) => set('subcategory', v)}
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">ট্যাগ</label>
                <TagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
              </div>
            </div>
          )}

          {/* Step 3: Timing */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">সময়সীমা (Timing)</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ট্রেডিং বন্ধের সময় <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    max="2100-12-31T23:59"
                    value={form.tradingClosesAt}
                    onChange={(e) => set('tradingClosesAt', e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${errors.tradingClosesAt ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.tradingClosesAt && <p className="mt-1 text-xs text-red-500">{errors.tradingClosesAt}</p>}
                  <p className="mt-1 text-xs text-gray-500">Asia/Dhaka timezone (UTC+6)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    রেজোলিউশন ডিলে (ঘণ্টা)
                  </label>
                  <input
                    type="number"
                    value={form.resolutionDelayHours}
                    onChange={(e) => set('resolutionDelayHours', parseInt(e.target.value) || 0)}
                    min={0}
                    max={168}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">ইভেন্ট শেষ হওয়ার কত ঘণ্টা পরে ফলাফল নির্ধারণ হবে</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Answers */}
          {step === 4 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">উত্তরসমূহ (Outcomes)</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    প্রথম উত্তর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.answer1}
                    onChange={(e) => set('answer1', e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${errors.answer1 ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.answer1 && <p className="mt-1 text-xs text-red-500">{errors.answer1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    দ্বিতীয় উত্তর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.answer2}
                    onChange={(e) => set('answer2', e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${errors.answer2 ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.answer2 && <p className="mt-1 text-xs text-red-500">{errors.answer2}</p>}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Info className="h-4 w-4 inline mr-1" />
                  বাইনারি মার্কেট: দুটি উত্তর (হ্যাঁ/না) — সবচেয়ে জনপ্রিয় ফরম্যাট
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Resolution */}
          {step === 5 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">রেজোলিউশন পদ্ধতি</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESOLUTION_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = form.resolutionMethod === method.value;
                  return (
                    <button
                      key={method.value}
                      onClick={() => set('resolutionMethod', method.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected ? method.activeColor : `${method.color} hover:opacity-80`
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5" />
                        <div>
                          <span className="font-medium text-sm">{method.label}</span>
                          <p className="text-xs mt-1 opacity-80">{method.description}</p>
                          {method.badge && (
                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/50">
                              {method.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.resolutionMethod === 'ai_oracle' && (
                <div className="space-y-3 mt-4 p-4 bg-purple-50 rounded-lg">
                  <label className="block text-sm font-medium text-purple-900">AI Keywords</label>
                  <TagInput tags={form.aiKeywords} onChange={(tags) => set('aiKeywords', tags)} />
                  <p className="text-xs text-purple-700">AI কী কী শব্দ খুঁজবে তা নির্ধারণ করুন</p>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Market */}
          {step === 6 && (
            <div className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">মার্কেট সেটিংস</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">প্রাথমিক লিকুইডিটি</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {LIQUIDITY_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => set('initialLiquidity', preset.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${form.initialLiquidity === preset.value
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <span className="block text-sm font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-gray-500">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  ফিচার্ড ইভেন্ট হিসেবে দেখান (হোমপেজে হাইলাইট)
                </label>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Slug (Auto-generated)</p>
                <code className="text-xs text-gray-500">{form.slug || '...'}</code>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              পেছনে
            </button>

            {step < 6 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                পরবর্তী
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isSubmitting ? 'তৈরি হচ্ছে...' : 'ইভেন্ট তৈরি করুন'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ইভেন্ট তৈরি সফল!</h3>
              <p className="text-gray-600 mb-4">{successData.title}</p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <p>Event ID: <code className="bg-gray-100 px-2 py-1 rounded">{successData.eventId}</code></p>
                <p>Slug: <code className="bg-gray-100 px-2 py-1 rounded">{successData.slug}</code></p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/markets/${successData.slug}`)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  মার্কেট দেখুন
                </button>
                <button
                  onClick={() => router.push('/sys-cmd-7x9k2/events')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ইভেন্ট লিস্ট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
