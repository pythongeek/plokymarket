'use client';

/**
 * =====================================================================
 * PLOKYMARKET — Event & Market Creation Page (PRODUCTION-READY FIX)
 * =====================================================================
 * ✅ Fixed: All dropdowns now visible (z-index, contrast, portal)
 * ✅ Fixed: Bangladesh categories with Bangla/English labels
 * ✅ Fixed: Resolution config always saved to DB
 * ✅ Fixed: Image URL validation + preview
 * ✅ Fixed: Slug generation handles Bengali text
 * ✅ Fixed: Form validation with clear error messages (Bangla)
 * ✅ Added: Rich subcategory dropdown (context-aware)
 * ✅ Added: Resolution method full config panel
 * ✅ Added: Liquidity seeding confirmation
 * ✅ Added: Event preview before submit
 * =====================================================================
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Loader2, Eye, Save,
  Image as ImageIcon, Tag, Calendar, Settings, Shield, Zap,
  Users, Bot, Star, Clock, TrendingUp, X, Plus, CheckCircle2,
  Info, Globe, FileText, ChevronDown, Sparkles
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'external_api' | 'community_vote' | 'hybrid';
type EventStatus = 'pending' | 'active';

interface FormData {
  // Step 1 — Core
  title: string;
  question: string;
  description: string;
  // Step 2 — Category
  category: string;
  subcategory: string;
  tags: string[];
  imageUrl: string;
  // Step 3 — Timing
  tradingClosesAt: string;
  resolutionDelayHours: number;
  // Step 4 — Answers
  answer1: string;
  answer2: string;
  // Step 5 — Resolution
  resolutionMethod: ResolutionMethod;
  aiKeywords: string[];
  aiSources: string[];
  confidenceThreshold: number;
  // Step 6 — Market
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
      { value: 'foreign_policy', label: 'বৈদেশিক নীতি (Foreign Policy)' },
      { value: 'constitutional', label: 'সাংবিধানিক বিষয় (Constitutional)' },
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
      { value: 'kabaddi', label: 'কাবাডি (Kabaddi)' },
      { value: 'chess', label: 'দাবা (Chess)' },
    ],
  },
  {
    value: 'economy',
    label: 'অর্থনীতি (Economy)',
    icon: '💰',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    subcategories: [
      { value: 'taka_exchange', label: 'টাকার বিনিময় হার (BDT Exchange)' },
      { value: 'garments', label: 'গার্মেন্টস (RMG Sector)' },
      { value: 'remittance', label: 'রেমিট্যান্স (Remittance)' },
      { value: 'stock_market', label: 'শেয়ার বাজার (DSE/CSE)' },
      { value: 'budget', label: 'জাতীয় বাজেট (National Budget)' },
      { value: 'inflation', label: 'মূল্যস্ফীতি (Inflation)' },
      { value: 'imports_exports', label: 'আমদানি-রপ্তানি (Trade)' },
    ],
  },
  {
    value: 'technology',
    label: 'প্রযুক্তি (Technology)',
    icon: '💻',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    subcategories: [
      { value: 'startup', label: 'স্টার্টআপ (Startup)' },
      { value: 'fintech', label: 'ফিনটেক (Fintech)' },
      { value: 'mobile_banking', label: 'মোবাইল ব্যাংকিং (bKash/Nagad)' },
      { value: 'ai_ml', label: 'কৃত্রিম বুদ্ধিমত্তা (AI/ML)' },
      { value: 'internet', label: 'ইন্টারনেট সংযোগ (Internet)' },
      { value: 'platform', label: 'প্ল্যাটফর্ম মেট্রিক্স (Platform)' },
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
      { value: 'awards', label: 'পুরস্কার অনুষ্ঠান (Awards)' },
      { value: 'reality_show', label: 'রিয়েলিটি শো (Reality Show)' },
    ],
  },
  {
    value: 'health',
    label: 'স্বাস্থ্য (Health)',
    icon: '🏥',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    subcategories: [
      { value: 'public_health', label: 'জনস্বাস্থ্য (Public Health)' },
      { value: 'disease', label: 'রোগ-বালাই (Disease)' },
      { value: 'hospital', label: 'হাসপাতাল (Hospital)' },
      { value: 'medicine', label: 'ওষুধ (Medicine)' },
    ],
  },
  {
    value: 'environment',
    label: 'পরিবেশ (Environment)',
    icon: '🌿',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    subcategories: [
      { value: 'climate', label: 'জলবায়ু পরিবর্তন (Climate Change)' },
      { value: 'cyclone', label: 'ঘূর্ণিঝড়/বন্যা (Cyclone/Flood)' },
      { value: 'pollution', label: 'দূষণ (Pollution)' },
      { value: 'river', label: 'নদী (Rivers)' },
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
      { value: 'regulation', label: 'Crypto Regulation' },
    ],
  },
  {
    value: 'global',
    label: 'আন্তর্জাতিক (Global)',
    icon: '🌍',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    subcategories: [
      { value: 'us_politics', label: 'মার্কিন রাজনীতি (US Politics)' },
      { value: 'india', label: 'ভারত (India)' },
      { value: 'middle_east', label: 'মধ্যপ্রাচ্য (Middle East)' },
      { value: 'war_conflict', label: 'যুদ্ধ-সংঘাত (War/Conflict)' },
      { value: 'international_org', label: 'আন্তর্জাতিক সংস্থা (UN/WB/IMF)' },
    ],
  },
  {
    value: 'other',
    label: 'অন্যান্য (Other)',
    icon: '📋',
    color: 'bg-gray-50 border-gray-200 text-gray-700',
    subcategories: [
      { value: 'education', label: 'শিক্ষা (Education)' },
      { value: 'religion', label: 'ধর্ম (Religion)' },
      { value: 'social', label: 'সামাজিক (Social)' },
      { value: 'miscellaneous', label: 'বিবিধ (Miscellaneous)' },
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
    description: 'অ্যাডমিন টিম সরাসরি ফলাফল নির্ধারণ করবে। সবচেয়ে নির্ভরযোগ্য।',
    badge: 'সবচেয়ে নির্ভরযোগ্য',
    badgeColor: 'bg-blue-100 text-blue-700',
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
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'expert_panel' as ResolutionMethod,
    label: 'Expert Panel',
    labelEn: 'Expert Panel',
    icon: Star,
    color: 'border-amber-300 bg-amber-50',
    activeColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-300',
    description: 'বিশেষজ্ঞ প্যানেল ভোট দিয়ে ফলাফল নির্ধারণ করবে।',
    badge: 'বিশেষজ্ঞ',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    value: 'external_api' as ResolutionMethod,
    label: 'External API',
    labelEn: 'External API',
    icon: Globe,
    color: 'border-cyan-300 bg-cyan-50',
    activeColor: 'border-cyan-500 bg-cyan-100 ring-2 ring-cyan-300',
    description: 'বাহ্যিক API বা ডেটা সোর্স থেকে স্বয়ংক্রিয় ফলাফল নির্ধারণ।',
    badge: 'API ভিত্তিক',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    value: 'community_vote' as ResolutionMethod,
    label: 'Community Vote',
    labelEn: 'Community Vote',
    icon: CheckCircle2,
    color: 'border-emerald-300 bg-emerald-50',
    activeColor: 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300',
    description: 'কমিউনিটি ভোটের মাধ্যমে ফলাফল নির্ধারণ।',
    badge: 'কমিউনিটি',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    value: 'hybrid' as ResolutionMethod,
    label: 'হাইব্রিড (Hybrid)',
    labelEn: 'Hybrid',
    icon: Sparkles,
    color: 'border-rose-300 bg-rose-50',
    activeColor: 'border-rose-500 bg-rose-100 ring-2 ring-rose-300',
    description: 'AI + Manual + Expert একসাথে - সবচেয়ে সুষম পদ্ধতি।',
    badge: 'স্মার্ট মিক্স',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
];

const NEWS_SOURCES_BD = [
  { value: 'prothomalo.com', label: 'প্রথম আলো (Prothom Alo)' },
  { value: 'bdnews24.com', label: 'BDNews24' },
  { value: 'thedailystar.net', label: 'The Daily Star' },
  { value: 'samakal.com', label: 'সমকাল (Samakal)' },
  { value: 'kalerkantho.com', label: 'কালের কণ্ঠ (Kaler Kantho)' },
  { value: 'jugantor.com', label: 'যুগান্তর (Jugantor)' },
  { value: 'ittefaq.com.bd', label: 'ইত্তেফাক (Ittefaq)' },
  { value: 'banglatribune.com', label: 'বাংলা ট্রিবিউন (Bangla Tribune)' },
  { value: 'reuters.com', label: 'Reuters' },
  { value: 'bbc.com/bengali', label: 'BBC Bangla' },
  { value: 'dw.com/bn', label: 'DW Bangla' },
];

const LIQUIDITY_PRESETS = [
  { value: 1000, label: '৳১,০০০', desc: 'Starter' },
  { value: 5000, label: '৳৫,০০০', desc: 'Standard' },
  { value: 10000, label: '৳১০,০০০', desc: 'Recommended ✓' },
  { value: 25000, label: '৳২৫,০০০', desc: 'Premium' },
  { value: 50000, label: '৳৫০,০০০', desc: 'High Volume' },
];

// ─── Slug Helper ──────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  // Transliteration map for common Bengali characters
  const bnMap: Record<string, string> = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
    'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u',
    'ে': 'e', 'ো': 'o', 'ৌ': 'ou', 'ং': 'ng', 'ঃ': 'h',
    'ঁ': 'n', '।': '', '০': '0', '১': '1', '২': '2',
    '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7',
    '৮': '8', '৯': '9',
  };

  let slug = title.toLowerCase().trim();

  // Replace Bengali characters
  for (const [bn, en] of Object.entries(bnMap)) {
    slug = slug.split(bn).join(en);
  }

  // Convert non-ASCII to empty, replace spaces/special chars with hyphens
  slug = slug
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = Date.now().toString(36).slice(-4);
  return slug.length > 5 ? `${slug}-${timestamp}` : `event-${timestamp}`;
}

// ─── Reusable Dropdown (FIXED — always visible) ───────────────────────────────

interface DropdownProps {
  value: string;
  placeholder: string;
  options: { value: string; label: string; icon?: string }[];
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

function NativeDropdown({ value, placeholder, options, onChange, label, required, error }: DropdownProps) {
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

// ─── Tag Input ────────────────────────────────────────────────────────────────

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

// ─── Step Indicator ───────────────────────────────────────────────────────────

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
  const [showDebug, setShowDebug] = useState(false);
  const [successData, setSuccessData] = useState<{ eventId: string; marketId: string | null; slug: string; title: string } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [tagInput, setTagInput] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<Array<{ value: string; label: string; icon: string; color: string; subcategories: Array<{ value: string; label: string }> }>>([]);

  // 🔍 DEBUG: Add log function
  const addDebugLog = (msg: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = data ? `[${timestamp}] ${msg}: ${JSON.stringify(data)}` : `[${timestamp}] ${msg}`;
    setDebugLogs(prev => [...prev.slice(-20), logEntry]); // Keep last 20 logs
    console.log(`🔥 [DEBUG PANEL] ${logEntry}`);
  };

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

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  // Auto-generate slug when title changes
  useEffect(() => {
    if (form.title) set('slug', generateSlug(form.title));
  }, [form.title]);

  // Get subcategories for selected category (including custom categories)
  const allCategories = [...BD_CATEGORIES, ...customCategories];
  const subcategories = allCategories.find((c) => c.value === form.category)?.subcategories ?? [];

  // Add custom category handler
  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    // Generate slug from input
    const slug = trimmed.toLowerCase()
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `custom-${Date.now()}`;

    // Check if already exists
    if (allCategories.some(c => c.value === slug)) {
      toast.error('এই ক্যাটাগরি ইতিমধ্যে বিদ্যমান');
      return;
    }

    const newCategory = {
      value: slug,
      label: `${trimmed} (${trimmed})`,
      icon: '📁',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      subcategories: [
        { value: 'general', label: 'সাধারণ (General)' },
        { value: 'other', label: 'অন্যান্য (Other)' },
      ],
    };

    setCustomCategories(prev => [...prev, newCategory]);
    set('category', slug);
    set('subcategory', '');
    setCustomCategoryInput('');
    toast.success(`✅ "${trimmed}" ক্যাটাগরি যোগ হয়েছে`);
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep = useCallback((s: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.title.trim()) e.title = 'ইভেন্টের শিরোনাম আবশ্যক';
      else if (form.title.length < 10) e.title = 'শিরোনাম কমপক্ষে ১০ অক্ষরের হতে হবে';
      if (!form.question.trim()) e.question = 'প্রশ্ন আবশ্যক';
      else if (form.question.length < 15) e.question = 'প্রশ্ন কমপক্ষে ১৫ অক্ষরের হতে হবে';
    }
    if (s === 2) {
      if (!form.category) e.category = 'ক্যাটাগরি নির্বাচন করুন';
    }
    if (s === 3) {
      if (!form.tradingClosesAt) e.tradingClosesAt = 'ট্রেডিং বন্ধের তারিখ আবশ্যক';
      else if (new Date(form.tradingClosesAt) <= new Date()) e.tradingClosesAt = 'তারিখ ভবিষ্যতের হতে হবে';
    }
    if (s === 4) {
      if (!form.answer1.trim()) e.answer1 = 'প্রথম উত্তর আবশ্যক';
      if (!form.answer2.trim()) e.answer2 = 'দ্বিতীয় উত্তর আবশ্যক';
    }
    if (s === 5) {
      if (form.resolutionMethod === 'ai_oracle' && form.aiKeywords.length === 0) {
        e.aiKeywords = 'AI Oracle-এর জন্য কমপক্ষে একটি keyword দিন';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 6)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    setIsSubmitting(true);

    // 🔍 DEBUG: Log submission start
    console.log('🔥 [DEBUG] Event submission started');
    console.log('🔥 [DEBUG] Current form state:', JSON.stringify(form, null, 2));

    try {
      // NOTE: Auth is verified server-side via cookies in the API route.
      // Do NOT call createClient() here — it triggers a navigator.lock conflict
      // that causes "AbortError: signal is aborted without reason".

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
        starts_at: new Date().toISOString(),
        ends_at: new Date(form.tradingClosesAt).toISOString(),
      };

      // 🔍 DEBUG: Log payload before sending
      console.log('🔥 [DEBUG] Payload to API:', JSON.stringify(payload, null, 2));

      // Send the request without AbortController — Next.js App Router
      // internally patches fetch and conflicts with external abort signals
      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 🔍 DEBUG: Log response status
      console.log('🔥 [DEBUG] API Response status:', response.status, response.statusText);

      const result = await response.json();

      // 🔍 DEBUG: Log response data
      console.log('🔥 [DEBUG] API Response data:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('🔥 [DEBUG] API Error:', result);
        throw new Error(result.error || 'ইভেন্ট তৈরি করা সম্ভব হয়নি');
      }

      // 🔍 DEBUG: Log success
      console.log('🔥 [DEBUG] Event created successfully:', {
        eventId: result.event_id,
        marketId: result.market_id,
        slug: result.slug,
        executionTime: result.execution_time_ms
      });

      // Show success modal instead of redirect
      setSuccessData({
        eventId: result.event_id,
        marketId: result.market_id,
        slug: result.slug,
        title: form.title,
      });
    } catch (err: any) {
      console.error('🔥 [DEBUG] Submission error:', err);
      toast.error(err.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setIsSubmitting(false);
      console.log('🔥 [DEBUG] Submission completed');
    }
  };

  // ─── Render Steps ─────────────────────────────────────────────────────────────

  const selectedCategory = allCategories.find((c) => c.value === form.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">নতুন ইভেন্ট তৈরি করুন</h1>
              <p className="text-xs text-gray-500">Create New Prediction Market Event</p>
            </div>
          </div>
          n          <div className="flex items-center gap-2">
            {/* 🔍 DEBUG Toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${showDebug
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <AlertCircle className="h-4 w-4" />
              {showDebug ? 'Debug On' : 'Debug'}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'ফর্ম দেখুন' : 'Preview'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Step Indicator ── */}
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
          <div className="mt-3 text-xs text-gray-500 text-right">
            ধাপ {step} / {STEPS.length} — {STEPS[step - 1].label} ({STEPS[step - 1].labelEn})
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            LIVE PREVIEW — Exact PolymarketCard replica
        ══════════════════════════════════════════════════════════════════════ */}
        {showPreview && (() => {
          const displayTitle = form.title || form.question || 'ইভেন্টের শিরোনাম এখানে দেখা যাবে';
          const catInfo = allCategories.find((c) => c.value === form.category);
          const catLabel = catInfo?.label?.split(' (')[0] || form.category || 'ক্যাটাগরি';
          const catIcon = catInfo?.icon || '📊';
          const yesPrice = 50;
          const noPrice = 50;
          const volume = form.initialLiquidity || 10000;
          const resMethod = RESOLUTION_METHODS.find((r) => r.value === form.resolutionMethod);

          // Time left helper
          const getPreviewTimeLeft = () => {
            if (!form.tradingClosesAt) return '';
            const diff = new Date(form.tradingClosesAt).getTime() - Date.now();
            if (diff <= 0) return 'শেষ';
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (days > 30) return `${Math.floor(days / 30)} মাস`;
            if (days > 0) return `${days}দি`;
            return `${hours}ঘ`;
          };
          const timeLeft = getPreviewTimeLeft();

          // Volume formatter
          const formatVol = (vol: number) => {
            if (vol >= 100000) return `৳${(vol / 100000).toFixed(1)} লাখ`;
            if (vol >= 1000) return `৳${(vol / 1000).toFixed(1)}K`;
            return `৳${vol}`;
          };

          return (
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-500" />
                  লাইভ প্রিভিউ — ফ্রন্টেন্ডে যেভাবে দেখাবে
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Homepage Card View</span>
              </div>

              {/* ── Exact PolymarketCard Replica ── */}
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <div className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col shadow-sm">
                    {/* Top: Round Thumbnail + Title */}
                    <div className="flex items-start gap-3 mb-3 flex-1">
                      {/* Shiny Round Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 ring-2 ring-white shadow-lg">
                          {form.imageUrl ? (
                            <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">
                              <TrendingUp className="w-5 h-5 text-white/90" />
                            </div>
                          )}
                        </div>
                        {/* Shiny ring effect */}
                        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/60 pointer-events-none" />
                        <div className="absolute -inset-[1px] rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-purple-400/20 pointer-events-none" />
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">
                          {displayTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          {form.category && (
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">
                              {form.category}
                            </span>
                          )}
                          {timeLeft && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {timeLeft}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Yes/No + Volume */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                        <span className="text-[10px] text-emerald-600 font-bold">{form.answer1?.split(' ')[0] || 'হ্যাঁ'}</span>
                        <span className="text-[13px] font-black text-emerald-600">{yesPrice}%</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 border border-red-100">
                        <span className="text-[10px] text-red-500 font-bold">{form.answer2?.split(' ')[0] || 'না'}</span>
                        <span className="text-[13px] font-black text-red-500">{noPrice}%</span>
                      </div>
                      <div className="flex flex-col items-center px-2 min-w-[50px]">
                        <span className="text-[11px] font-semibold text-gray-600">{formatVol(volume)}</span>
                        <span className="text-[9px] text-gray-400">ভলিউম</span>
                      </div>
                    </div>
                  </div>

                  {/* Featured badge indicator */}
                  {form.isFeatured && (
                    <div className="text-center mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                        <Star className="w-3 h-3" /> Featured ইভেন্ট
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Full Event Details Summary ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                  <Settings className="h-4 w-4 text-gray-400" /> ইভেন্ট বিবরণ
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">শিরোনাম</p>
                      <p className="font-medium text-gray-900 line-clamp-2">{form.title || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">ক্যাটাগরি</p>
                      <p className="font-medium text-gray-900">{catIcon} {catLabel}</p>
                      {form.subcategory && (
                        <p className="text-xs text-gray-500">{form.subcategory}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">ট্রেডিং বন্ধ</p>
                      <p className="font-medium text-gray-900">
                        {form.tradingClosesAt
                          ? new Date(form.tradingClosesAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </p>
                      {timeLeft && <p className="text-xs text-blue-600">{timeLeft} বাকি</p>}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">রেজোলিউশন</p>
                      <p className="font-medium text-gray-900">{resMethod?.label || form.resolutionMethod}</p>
                      <p className="text-xs text-gray-500">{form.resolutionDelayHours}ঘ বিলম্ব</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <Zap className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">উত্তর</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">{form.answer1 || 'হ্যাঁ'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">{form.answer2 || 'না'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">তারল্য</p>
                      <p className="font-medium text-gray-900">৳{form.initialLiquidity.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                    {form.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {form.description && (
                  <div className="pt-2 border-t">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">বিবরণ</p>
                    <p className="text-sm text-gray-700 line-clamp-3">{form.description}</p>
                  </div>
                )}

                {/* Slug */}
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">URL Slug</p>
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">/markets/{form.slug || 'auto-generated'}</code>
                </div>
              </div>

              {/* Back to form hint */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  &quot;Preview&quot; বাটনে ক্লিক করে ফর্মে ফিরে যান এবং পরিবর্তন করুন।
                </p>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — মূল তথ্য (Core Info)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                ধাপ ১: মূল তথ্য (Core Information)
              </h2>
              <p className="text-sm text-gray-500 mt-1">ইভেন্টের শিরোনাম ও মূল প্রশ্নটি সুস্পষ্টভাবে লিখুন।</p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                ইভেন্টের শিরোনাম (Title) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="যেমন: বাংলাদেশ ক্রিকেট দল কি ২০২৬ বিশ্বকাপ সেমিফাইনালে যাবে?"
                maxLength={150}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
              />
              <div className="flex justify-between">
                {errors.title ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.title}</p>
                ) : <span />}
                <span className="text-xs text-gray-400">{form.title.length}/150</span>
              </div>
            </div>

            {/* Question */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                মূল প্রশ্ন (Main Question) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">
                💡 প্রশ্নটি YES/NO উত্তরযোগ্য হতে হবে। পরিষ্কার, একটিমাত্র শর্ত রাখুন।
              </p>
              <textarea
                value={form.question}
                onChange={(e) => set('question', e.target.value)}
                placeholder="যেমন: ২০২৬ সালের মার্চ মাসের মধ্যে কি বাংলাদেশের মাথাপিছু আয় $৩,০০০ ছাড়িয়ে যাবে?"
                rows={3}
                maxLength={500}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none
                  focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${errors.question ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
              />
              <div className="flex justify-between">
                {errors.question ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.question}</p>
                ) : <span />}
                <span className="text-xs text-gray-400">{form.question.length}/500</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                বিস্তারিত বিবরণ (Description)
                <span className="ml-2 text-xs font-normal text-gray-400">(ঐচ্ছিক / Optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="ইভেন্টের প্রেক্ষাপট, নিয়মকানুন, রেজোলিউশনের শর্তাবলি ব্যাখ্যা করুন..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 hover:border-gray-400 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Slug preview */}
            {form.slug && (
              <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Auto-generated URL Slug</p>
                  <p className="text-sm font-mono text-indigo-600 truncate">/markets/{form.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const custom = prompt('Custom slug লিখুন (শুধু a-z, 0-9, hyphen):', form.slug);
                    if (custom) set('slug', custom.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }}
                  className="text-xs text-gray-500 hover:text-indigo-600 underline flex-shrink-0"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — ক্যাটাগরি (Category)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="h-5 w-5 text-indigo-500" />
                ধাপ ২: ক্যাটাগরি ও ছবি (Category & Image)
              </h2>
            </div>

            {/* Category — Card Grid (NOT dropdown, for visibility) */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ক্যাটাগরি <span className="text-red-500">*</span>
              </label>
              {errors.category && (
                <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
                  <AlertCircle className="h-3 w-3" />{errors.category}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => { set('category', cat.value); set('subcategory', ''); }}
                    className={`
                      flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all cursor-pointer
                      ${form.category === cat.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                    `}
                  >
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className={`text-xs font-medium leading-tight ${form.category === cat.value ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {cat.label.split(' (')[0]}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{cat.label.match(/\((.+)\)/)?.[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Category Input */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                নতুন ক্যাটাগরি যোগ করুন (Add Custom Category)
                <span className="ml-2 text-xs font-normal text-gray-400">(ঐচ্ছিক)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } }}
                  placeholder="যেমন: শিক্ষা, কৃষি, পর্যটন..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={!customCategoryInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  যোগ করুন
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 নতুন ক্যাটাগরি যোগ করতে টাইপ করে Enter চাপুন বা "যোগ করুন" বাটনে ক্লিক করুন
              </p>
            </div>

            {/* Subcategory — native select (always visible) */}
            {form.category && subcategories.length > 0 && (
              <NativeDropdown
                label="সাবক্যাটাগরি (Subcategory)"
                value={form.subcategory}
                placeholder="সাবক্যাটাগরি নির্বাচন করুন..."
                options={subcategories}
                onChange={(v) => set('subcategory', v)}
              />
            )}

            {/* Tags */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                ট্যাগ (Tags)
                <span className="ml-2 text-xs font-normal text-gray-400">(ঐচ্ছিক — সর্বোচ্চ ৮টি)</span>
              </label>
              <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />
            </div>

            {/* Image URL */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                ইভেন্ট ছবি (Image URL)
                <span className="ml-2 text-xs font-normal text-gray-400">(ঐচ্ছিক)</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => set('imageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/... বা অন্য কোনো ছবির URL"
                  className="flex-1 rounded-lg border border-gray-300 hover:border-gray-400 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {form.imageUrl && (
                  <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>'; }}
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Unsplash থেকে বিনামূল্যে ছবি: <a href="https://unsplash.com" target="_blank" className="text-indigo-500 underline">unsplash.com</a>
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — সময়সীমা (Timing)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 3 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                ধাপ ৩: সময়সীমা (Timing)
              </h2>
              <p className="text-sm text-gray-500 mt-1">ট্রেডিং বন্ধের তারিখ এবং রেজোলিউশনের সময় নির্ধারণ করুন।</p>
            </div>

            {/* Trading Closes At */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                ট্রেডিং বন্ধের তারিখ ও সময় <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">এর পরে নতুন কোনো শেয়ার কেনা-বেচা করা যাবে না।</p>
              <input
                type="datetime-local"
                value={form.tradingClosesAt}
                min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                onChange={(e) => set('tradingClosesAt', e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-indigo-400
                  ${errors.tradingClosesAt ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.tradingClosesAt && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{errors.tradingClosesAt}
                </p>
              )}
            </div>

            {/* Resolution Delay */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                রেজোলিউশন অপেক্ষার সময় (Resolution Delay)
              </label>
              <p className="text-xs text-gray-500">ট্রেডিং বন্ধ হওয়ার কত ঘণ্টা পরে ফলাফল ঘোষণা করা হবে?</p>
              <div className="grid grid-cols-4 gap-2">
                {[6, 12, 24, 48].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => set('resolutionDelayHours', h)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-all
                      ${form.resolutionDelayHours === h
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {h} ঘণ্টা
                    {h === 24 && <span className="block text-[10px] text-green-600">✓ প্রস্তাবিত</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {form.tradingClosesAt && (
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> সময়রেখা সারসংক্ষেপ (Timeline Summary)
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-2 text-gray-700">
                    <span className="text-green-500">●</span>
                    <span>ট্রেডিং শুরু: এখনই (immediately)</span>
                  </div>
                  <div className="flex gap-2 text-gray-700">
                    <span className="text-yellow-500">●</span>
                    <span>ট্রেডিং বন্ধ: {new Date(form.tradingClosesAt).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="flex gap-2 text-gray-700">
                    <span className="text-red-500">●</span>
                    <span>রেজোলিউশন: ট্রেডিং বন্ধের {form.resolutionDelayHours} ঘণ্টা পরে</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 4 — উত্তর (Answers)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 4 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                ধাপ ৪: উত্তরের বিকল্প (Answer Options)
              </h2>
              <p className="text-sm text-gray-500 mt-1">দুটি সম্ভাব্য উত্তর লিখুন। সাধারণত YES/NO ব্যবহার করা হয়।</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Answer 1 — YES */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  উত্তর ১ (Answer 1 — YES) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.answer1}
                  onChange={(e) => set('answer1', e.target.value)}
                  placeholder="হ্যাঁ (YES)"
                  className={`w-full rounded-lg border px-4 py-3 text-sm font-medium text-green-700 bg-green-50
                    focus:outline-none focus:ring-2 focus:ring-green-400
                    ${errors.answer1 ? 'border-red-400' : 'border-green-200 hover:border-green-300'}`}
                />
                {errors.answer1 && <p className="text-xs text-red-500">{errors.answer1}</p>}
                <p className="text-xs text-gray-500">💡 বাংলায়: "হ্যাঁ" বা "হবে" বা সুনির্দিষ্ট উত্তর</p>
              </div>

              {/* Answer 2 — NO */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  উত্তর ২ (Answer 2 — NO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.answer2}
                  onChange={(e) => set('answer2', e.target.value)}
                  placeholder="না (NO)"
                  className={`w-full rounded-lg border px-4 py-3 text-sm font-medium text-red-700 bg-red-50
                    focus:outline-none focus:ring-2 focus:ring-red-400
                    ${errors.answer2 ? 'border-red-400' : 'border-red-200 hover:border-red-300'}`}
                />
                {errors.answer2 && <p className="text-xs text-red-500">{errors.answer2}</p>}
                <p className="text-xs text-gray-500">💡 বাংলায়: "না" বা "হবে না" বা বিপরীত উত্তর</p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-3">ব্যবহারকারী এভাবে দেখবে (User Preview):</p>
              <p className="text-sm font-medium text-gray-800 mb-3">{form.question || 'আপনার প্রশ্ন এখানে দেখাবে...'}</p>
              <div className="flex gap-3">
                <div className="flex-1 bg-green-500 text-white text-center py-2 rounded-lg text-sm font-bold">
                  {form.answer1 || 'YES'} — ৳০.৫০
                </div>
                <div className="flex-1 bg-red-500 text-white text-center py-2 rounded-lg text-sm font-bold">
                  {form.answer2 || 'NO'} — ৳০.৫০
                </div>
              </div>
            </div>

            {/* Common Templates */}
            <div>
              <p className="text-xs text-gray-500 mb-2">দ্রুত template (Quick Templates):</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['হ্যাঁ (YES)', 'না (NO)'],
                  ['হবে', 'হবে না'],
                  ['জিতবে', 'হারবে'],
                  ['পাস করবে', 'ফেল করবে'],
                  ['বাড়বে ↑', 'কমবে ↓'],
                ].map(([a1, a2]) => (
                  <button
                    key={a1}
                    type="button"
                    onClick={() => { set('answer1', a1); set('answer2', a2); }}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {a1} / {a2}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 5 — রেজোলিউশন (Resolution)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 5 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                ধাপ ৫: রেজোলিউশন পদ্ধতি (Resolution Method)
              </h2>
              <p className="text-sm text-gray-500 mt-1">ইভেন্টের ফলাফল কীভাবে নির্ধারণ হবে তা বেছে নিন।</p>
            </div>

            {/* Method Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {RESOLUTION_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = form.resolutionMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => set('resolutionMethod', method.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all
                      ${isSelected ? method.activeColor : method.color + ' hover:shadow-sm'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-current' : 'text-gray-500'}`} />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${method.badgeColor}`}>
                        {method.badge}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{method.description}</p>
                  </button>
                );
              })}
            </div>

            {/* AI Oracle Config */}
            {form.resolutionMethod === 'ai_oracle' && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 space-y-4">
                <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                  <Bot className="h-4 w-4" /> AI Oracle Configuration
                </h4>

                {/* Keywords */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    সার্চ Keywords <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">AI এই keywords দিয়ে সংবাদ খুঁজবে।</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newKeyword.trim()) {
                          e.preventDefault();
                          set('aiKeywords', [...form.aiKeywords, newKeyword.trim()]);
                          setNewKeyword('');
                        }
                      }}
                      placeholder="keyword লিখুন, Enter দিন..."
                      className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKeyword.trim()) {
                          set('aiKeywords', [...form.aiKeywords, newKeyword.trim()]);
                          setNewKeyword('');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.aiKeywords.map((kw) => (
                      <span key={kw} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        {kw}
                        <button type="button" onClick={() => set('aiKeywords', form.aiKeywords.filter((k) => k !== kw))}>
                          <X className="h-3 w-3 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.aiKeywords && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{errors.aiKeywords}
                    </p>
                  )}
                </div>

                {/* News Sources — native select (FIXED) */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    সংবাদ উৎস (News Sources)
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !form.aiSources.includes(val)) {
                        set('aiSources', [...form.aiSources, val]);
                      }
                      e.target.value = '';
                    }}
                    className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                  >
                    <option value="" className="text-gray-400">সংবাদ উৎস যোগ করুন...</option>
                    {NEWS_SOURCES_BD.filter((s) => !form.aiSources.includes(s.value)).map((src) => (
                      <option key={src.value} value={src.value} className="text-gray-900 bg-white">
                        {src.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.aiSources.map((src) => {
                      const srcLabel = NEWS_SOURCES_BD.find((s) => s.value === src)?.label || src;
                      return (
                        <span key={src} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs">
                          🗞️ {srcLabel}
                          <button type="button" onClick={() => set('aiSources', form.aiSources.filter((s) => s !== src))}>
                            <X className="h-3 w-3 hover:text-red-500" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Confidence Threshold */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Confidence Threshold: <span className="font-bold text-purple-700">{form.confidenceThreshold}%</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    AI-এর confidence এই মানের উপরে থাকলে স্বয়ংক্রিয়ভাবে resolve হবে। নিচে হলে admin review লাগবে।
                  </p>
                  <input
                    type="range"
                    min={60}
                    max={99}
                    value={form.confidenceThreshold}
                    onChange={(e) => set('confidenceThreshold', parseInt(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>৬০% (নমনীয়)</span>
                    <span className="text-green-600">৮৫% ✓ প্রস্তাবিত</span>
                    <span>৯৯% (কঠোর)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Admin Info */}
            {form.resolutionMethod === 'manual_admin' && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" /> Manual Admin Resolution — কীভাবে কাজ করে
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>① ট্রেডিং বন্ধ হওয়ার পরে admin resolution page-এ যাবেন।</p>
                  <p>② প্রমাণ (evidence URL) এবং কারণ (reasoning) সহ YES বা NO নির্বাচন করবেন।</p>
                  <p>③ Super Admin অনুমোদন করলে পেআউট স্বয়ংক্রিয়ভাবে প্রক্রিয়া হবে।</p>
                </div>
              </div>
            )}

            {/* Expert Panel Info */}
            {form.resolutionMethod === 'expert_panel' && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 space-y-4">
                <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <Star className="h-4 w-4" /> Expert Panel Resolution — কীভাবে কাজ করে
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>① বিষয়ভিত্তিক বিশেষজ্ঞ প্যানেলকে ভোট দেওয়ার জন্য আমন্ত্রণ জানানো হবে।</p>
                  <p>② প্রত্যেক expert তাদের ওজন (weight) অনুযায়ী ভোট দেবেন।</p>
                  <p>③ ন্যূনতম ৫টি ভোট এবং ৬০% weighted majority পেলে ফলাফল নির্ধারিত হবে।</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>নোট:</strong> Expert panel স্বয়ংক্রিয়ভাবে ইভেন্ট ক্যাটাগরি অনুযায়ী নির্বাচিত হয়।
                  </p>
                </div>
              </div>
            )}

            {/* External API Info */}
            {form.resolutionMethod === 'external_api' && (
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200 space-y-4">
                <h4 className="text-sm font-bold text-cyan-900 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> External API Resolution — কীভাবে কাজ করে
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>① নির্দিষ্ট API endpoint থেকে স্বয়ংক্রিয়ভাবে ডেটা সংগ্রহ করা হবে।</p>
                  <p>② API response অনুযায়ী ফলাফল নির্ধারিত হবে (যেমন: sports API, election commission API)।</p>
                  <p>③ API ডেটা পাওয়া না গেলে manual admin-এর কাছে পাঠানো হবে।</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>নোট:</strong> এই মেথডের জন্য API configuration admin প্যানেলে সেটআপ করতে হবে।
                  </p>
                </div>
              </div>
            )}

            {/* Community Vote Info */}
            {form.resolutionMethod === 'community_vote' && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 space-y-4">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Community Vote Resolution — কীভাবে কাজ করে
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>① ট্রেডিং বন্ধ হওয়ার পর সক্রিয় ট্রেডারদের ভোট দেওয়ার জন্য আমন্ত্রণ জানানো হবে।</p>
                  <p>② ন্যূনতম ১০০ জন ভোট দিলে ফলাফল গণনা করা হবে (YES/NO সংখ্যাগরিষ্ঠতা)।</p>
                  <p>③ ভোটের সময়সীমা শেষে সংখ্যাগরিষ্ঠ মতামত অনুযায়ী resolve হবে।</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>নোট:</strong> কমিউনিটি ভোটে কমপক্ষে ৬০% মেজরিটি প্রয়োজন।
                  </p>
                </div>
              </div>
            )}

            {/* Hybrid Info */}
            {form.resolutionMethod === 'hybrid' && (
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 space-y-4">
                <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Hybrid Resolution — কীভাবে কাজ করে
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>① <strong>প্রাথমিক পর্যায়:</strong> AI Oracle সংবাদ বিশ্লেষণ করে প্রাথমিক ফলাফল দেয়।</p>
                  <p>② <strong>দ্বিতীয় পর্যায়:</strong> Expert Panel AI-র ফলাফল 검토 করে অনুমোদন বা সংশোধন করে।</p>
                  <p>③ <strong>চূড়ান্ত পর্যায়:</strong> দ্বন্দ্ব থাকলে Manual Admin চূড়ান্ত সিদ্ধান্ত নেয়।</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-rose-200">
                  <p className="text-xs text-rose-800">
                    <strong>সুবিধা:</strong> AI-র গতি + Expert-এর নির্ভরযোগ্যতা + Admin-এর নিয়ন্ত্রণ — সবচেয়ে সুষম পদ্ধতি।
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    <strong>নোট:</strong> এই মেথড স্বয়ংক্রিয়ভাবে বিভিন্ন সোর্স থেকে তথ্য সংগ্রহ করে সবচেয়ে নির্ভরযোগ্য ফলাফল নিশ্চিত করে।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 6 — মার্কেট সেটআপ (Market Setup)
        ══════════════════════════════════════════════════════════════════════ */}
        {!showPreview && step === 6 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="border-b pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                ধাপ ৬: মার্কেট সেটআপ (Market Setup)
              </h2>
            </div>

            {/* Liquidity */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                প্রাথমিক তারল্য (Initial Liquidity) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                মার্কেট শুরুতে orderbook-এ কত টাকার YES/NO orders রাখা হবে? বেশি হলে ভালো price stability।
              </p>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {LIQUIDITY_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set('initialLiquidity', p.value)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all
                      ${form.initialLiquidity === p.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className={`text-sm font-bold ${form.initialLiquidity === p.value ? 'text-indigo-700' : 'text-gray-700'}`}>{p.label}</p>
                    <p className={`text-[10px] mt-0.5 ${p.value === 10000 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{p.desc}</p>
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={form.initialLiquidity}
                onChange={(e) => set('initialLiquidity', Math.max(100, parseInt(e.target.value) || 0))}
                min={100}
                step={100}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">Featured ইভেন্ট 🌟</p>
                <p className="text-xs text-gray-500">Homepage-এ হাইলাইট করা হবে, বেশি ভিজিটর পাবে।</p>
              </div>
              <button
                type="button"
                onClick={() => set('isFeatured', !form.isFeatured)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isFeatured ? 'bg-indigo-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isFeatured ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Final Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" /> চূড়ান্ত সারসংক্ষেপ (Final Summary)
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><span className="text-gray-500">শিরোনাম:</span> <span className="font-medium text-gray-900 ml-1 line-clamp-1">{form.title || '—'}</span></div>
                <div><span className="text-gray-500">ক্যাটাগরি:</span> <span className="font-medium text-gray-900 ml-1">{selectedCategory?.label.split(' (')[0] || '—'}</span></div>
                <div><span className="text-gray-500">বন্ধের তারিখ:</span> <span className="font-medium text-gray-900 ml-1">{form.tradingClosesAt ? new Date(form.tradingClosesAt).toLocaleDateString('bn-BD') : '—'}</span></div>
                <div><span className="text-gray-500">রেজোলিউশন:</span> <span className="font-medium text-gray-900 ml-1">{RESOLUTION_METHODS.find((r) => r.value === form.resolutionMethod)?.label}</span></div>
                <div><span className="text-gray-500">প্রাথমিক তারল্য:</span> <span className="font-medium text-gray-900 ml-1">৳{form.initialLiquidity.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Featured:</span> <span className="font-medium text-gray-900 ml-1">{form.isFeatured ? '✅ হ্যাঁ' : '❌ না'}</span></div>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ Submit করার পরে ইভেন্টটি <strong>Pending</strong> status-এ থাকবে। Super Admin approval-এর পরেই এটি <strong>Active</strong> হবে এবং ব্যবহারকারীরা trade করতে পারবে।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 DEBUG PANEL */}
        {!showPreview && showDebug && (
          <div className="mt-6 bg-gray-900 rounded-xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-red-400 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> DEBUG CONSOLE
              </h3>
              <button
                onClick={() => setDebugLogs([])}
                className="text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>

            {/* Form State */}
            <div className="mb-3">
              <p className="text-yellow-400 font-semibold mb-1">Form State:</p>
              <pre className="text-green-400 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify({
                  step,
                  title: form.title,
                  category: form.category,
                  status: 'active',
                  slug: form.slug,
                  tradingClosesAt: form.tradingClosesAt,
                  resolutionMethod: form.resolutionMethod
                }, null, 2)}
              </pre>
            </div>

            {/* Validation Status */}
            <div className="mb-3">
              <p className="text-yellow-400 font-semibold mb-1">Validation:</p>
              <div className="text-cyan-400">
                <p>Step 1 (Core): {form.title && form.question ? '✅' : '❌'}</p>
                <p>Step 2 (Category): {form.category ? '✅' : '❌'}</p>
                <p>Step 3 (Timing): {form.tradingClosesAt ? '✅' : '❌'}</p>
                <p>Step 4 (Answers): {form.answer1 && form.answer2 ? '✅' : '❌'}</p>
                <p>Step 5 (Resolution): {form.resolutionMethod ? '✅' : '❌'}</p>
              </div>
            </div>

            {/* Logs */}
            {debugLogs.length > 0 && (
              <div>
                <p className="text-yellow-400 font-semibold mb-1">Logs:</p>
                <div className="text-gray-300 max-h-40 overflow-y-auto">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="border-b border-gray-700 py-1">{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Issues */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-orange-400 font-semibold mb-1">Common Issues:</p>
              <ul className="text-gray-400 list-disc list-inside">
                <li>Event status must be &apos;active&apos; to show on dashboard</li>
                <li>Slug must be unique</li>
                <li>Trading closes at must be in future</li>
                <li>Check browser console for API errors</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        {!showPreview && (
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" /> পূর্ববর্তী
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
              >
                পরবর্তী <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> তৈরি হচ্ছে...</>
                ) : (
                  <><Save className="h-4 w-4" /> ইভেন্ট তৈরি করুন ✓</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ Success Modal ═══════════ */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">ইভেন্ট সফলভাবে তৈরি হয়েছে! ✅</h2>
              <p className="text-green-100 text-sm mt-1">Event Created Successfully</p>
            </div>

            {/* Event Details */}
            <div className="px-6 py-5 space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">শিরোনাম:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{successData.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ক্যাটাগরি:</span>
                  <span className="font-medium text-gray-900">{form.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">স্ট্যাটাস:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    সক্রিয় (Active)
                  </span>
                </div>
                {successData.marketId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">মার্কেট:</span>
                    <span className="text-green-600 text-xs font-medium">✓ মার্কেট তৈরি হয়েছে</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Submit করার পরে ইভেন্টটি Pending status-এ থাকতো কিন্তু Super Admin approve-এর পর এটি Active হয়ে যাবে, তারপরই Trade শুরু হবে।
              </p>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 space-y-2.5">
              <button
                onClick={() => window.open(`/markets/${successData.eventId}`, '_blank')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-indigo-200 transition-all"
              >
                <Eye className="h-4 w-4" />
                রিয়েল-টাইমে প্রিভিউ দেখুন (Preview Live)
              </button>
              <button
                onClick={() => router.push('/sys-cmd-7x9k2/events')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                ইভেন্ট লিস্টে ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
