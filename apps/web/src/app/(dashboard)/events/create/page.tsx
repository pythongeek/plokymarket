'use client';

/**
 * Enhanced Event Creation Page
 * Features:
 * - Custom category creation and management
 * - Image upload with preview
 * - Rich text description editor
 * - Market outcome configuration
 * - Duplicate event detection
 * - Draft auto-save
 * - Real-time validation
 * - Bangladesh-context optimized
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Save,           // Used: Submit button icon
  Eye,            // Used: Preview toggle button, Final Summary header
  AlertCircle,    // Used: Error messages, Validation checklist
  CheckCircle,    // Used: Success states, Validation checklist
  Calendar,       // Used: Step 3 timing section
  Tag,            // Used: Step 2 tags section
  FileText,       // Used: Step 1 basic info header
  Image as ImageIcon, // Used: Step 2 image section
  Settings,       // Used: Step 4 resolution settings header
  Loader2,        // Used: Submit button loading spinner, Draft saving indicator
  Clock,          // Used: Time settings display
  Coins,          // Used: Liquidity settings section
  Sparkles,       // Used: Hybrid resolution method card
  Zap,            // Preserved — may be used in future steps
  Plus,           // Used: Add tag, keyword, outcome, subcategory buttons
  X,              // Preserved — may be used in future steps (currently using × character)
  Trash2,         // Used: Remove outcome button
  Edit3,          // Preserved — may be used in future steps
  Upload,         // Used: Image upload placeholder
  Search,         // Preserved — may be used in future steps
  Copy,           // Used: Draft save button
  RotateCcw,      // Preserved — may be used in future steps
  Info,           // Used: Duplicate warning alert
  Globe,          // Preserved — may be used in future steps
  TrendingUp,     // Used: Step 3 Market Outcomes header
  Shield,         // Used: Manual Admin resolution method card
  Bot,            // Used: AI Oracle resolution method card, AI settings
  Users,          // Used: Expert Panel resolution method card
  Hash,           // Preserved — may be used in future steps
  Link as LinkIcon, // Used: Source URL section
  Check           // Used: Resolution method selection checkmark
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Category {
  id: string;
  value: string;
  label: string;
  icon: string;
  color: string;
  is_custom: boolean;
  subcategories: string[];
}

// Resolution method type - 6 methods total including POS-Oracle and UMA
type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'hybrid' | 'pos_oracle' | 'uma';

interface FormData {
  name: string;
  question: string;
  description: string;
  category: string;
  custom_category: string;  // For user-defined custom categories
  subcategory: string;
  tags: string[];
  outcomes: { label: string; color: string }[];
  trading_closes_at: string;
  resolution_date: string;
  resolution_delay: number;
  initial_liquidity: number;
  image_url: string;
  is_featured: boolean;
  is_private: boolean;
  allow_multiple_outcomes: boolean;
  min_bet_amount: number;
  max_bet_amount: number;
  fee_percentage: number;
  slug: string;  // Auto-generated URL slug
}

// AI Verdict result for hybrid method
interface AIVerdict {
  outcome: string;
  confidence: number;
  evidence: string[];
  sources: string[];
  reasoning: string;
  timestamp: string;
}

// Human review input for hybrid method
interface HumanReview {
  reviewer_id: string;
  reviewer_role: 'admin' | 'expert' | 'moderator';
  verdict: string;
  confidence: number;
  notes: string;
  timestamp: string;
  override_ai: boolean;
}

// Hybrid consensus configuration
interface HybridConsensusConfig {
  ai_weight: number;           // AI vote weight (0-1)
  human_weight: number;        // Human vote weight (0-1)
  min_human_reviewers: number; // Minimum human reviewers required
  consensus_threshold: number; // % agreement needed for consensus
  auto_resolve_if_agreement: boolean; // Auto-resolve if AI+Human agree
}

// POS-Oracle (Optimistic Oracle) Configuration
interface POSOracleConfig {
  bond_amount: number;              // Bond amount in BDT
  challenge_window_hours: number;   // Challenge window duration
  min_stake_amount: number;         // Minimum stake to propose
  reward_percentage: number;        // Reward % for correct proposers
  penalty_percentage: number;       // Penalty % for incorrect proposers
  max_challenges: number;           // Maximum challenges allowed
  escalation_threshold: number;     // Escalation threshold
}

// UMA (Universal Market Access) Configuration
interface UMAConfig {
  liveness_period: number;          // Dispute liveness period in hours
  bond_token: 'BDT' | 'USDT';       // Bond token type
  bond_amount: number;              // Bond amount
  reward_rate: number;              // Reward rate for successful disputes
  optimistic_oracle_address?: string; // UMA Optimistic Oracle contract address
  price_identifier?: string;        // Price identifier for UMA
  ancillary_data?: string;          // Additional data for UMA
}

interface ResolutionConfig {
  primary_method: ResolutionMethod;  // Using the defined type
  ai_keywords: string[];
  ai_sources: string[];
  confidence_threshold: number;
  expert_count: number;
  resolution_criteria: string;
  source_urls: string[];
  // Hybrid-specific fields
  hybrid_config?: HybridConsensusConfig;
  ai_verdict?: AIVerdict;
  human_reviews?: HumanReview[];
  final_verdict?: {
    outcome: string;
    confidence: number;
    method: 'ai_only' | 'human_only' | 'consensus' | 'override';
    reasoning: string;
    resolved_at: string;
    resolved_by?: string;
  };
  // POS-Oracle specific fields
  pos_oracle_config?: POSOracleConfig;
  // UMA specific fields
  uma_config?: UMAConfig;
}

interface DraftData {
  formData: FormData;
  resolutionConfig: ResolutionConfig;
  savedAt: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', value: 'sports', label: 'খেলাধুলা (Sports)', icon: '🏏', color: '#22c55e', is_custom: false, subcategories: ['BPL', 'IPL', 'International Cricket', 'Football', 'Hockey', 'Kabaddi'] },
  { id: '2', value: 'politics', label: 'রাজনীতি (Politics)', icon: '🏛️', color: '#3b82f6', is_custom: false, subcategories: ['National Election', 'Local Election', 'Policy Change'] },
  { id: '3', value: 'economy', label: 'অর্থনীতি (Economy)', icon: '💰', color: '#f59e0b', is_custom: false, subcategories: ['Stock Market', 'Currency', 'Inflation'] },
  { id: '4', value: 'entertainment', label: 'বিনোদন (Entertainment)', icon: '🎬', color: '#ec4899', is_custom: false, subcategories: ['Movies', 'Music', 'Celebrity'] },
  { id: '5', value: 'technology', label: 'প্রযুক্তি (Technology)', icon: '💻', color: '#8b5cf6', is_custom: false, subcategories: ['AI', 'Crypto', 'Gadgets'] },
  { id: '6', value: 'international', label: 'আন্তর্জাতিক (International)', icon: '🌍', color: '#06b6d4', is_custom: false, subcategories: ['World News', 'Global Events'] },
  { id: '7', value: 'social', label: 'সামাজিক (Social)', icon: '👥', color: '#f97316', is_custom: false, subcategories: ['Trending', 'Viral'] },
  { id: '8', value: 'weather', label: 'আবহাওয়া (Weather)', icon: '🌦️', color: '#6366f1', is_custom: false, subcategories: ['Rain', 'Temperature', 'Storm'] },
];

// Resolution methods array with all 6 options including POS-Oracle and UMA
type ResolutionMethodConfig = {
  value: ResolutionMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const RESOLUTION_METHODS: ResolutionMethodConfig[] = [
  {
    value: 'manual_admin',
    label: 'ম্যানুয়াল অ্যাডমিন (Manual Admin)',
    description: 'অ্যাডমিন ম্যানুয়ালি রেজোলিউশন করবেন',
    icon: Shield
  },
  {
    value: 'ai_oracle',
    label: 'AI Oracle (স্বয়ংক্রিয়)',
    description: 'AI স্বয়ংক্রিয়ভাবে রেজোলিউশন করবে',
    icon: Bot
  },
  {
    value: 'expert_panel',
    label: 'বিশেষজ্ঞ প্যানেল (Expert Panel)',
    description: 'বিশেষজ্ঞদের ভোটে রেজোলিউশন',
    icon: Users
  },
  {
    value: 'hybrid',
    label: 'হাইব্রিড (Hybrid)',
    description: 'AI + ম্যানুয়াল ভেরিফিকেশন',
    icon: Sparkles
  },
  {
    value: 'pos_oracle',
    label: 'POS-Oracle (Optimistic)',
    description: 'Bond-based optimistic resolution with challenge period',
    icon: Zap
  },
  {
    value: 'uma',
    label: 'UMA (Universal Market Access)',
    description: 'Decentralized oracle with economic guarantees',
    icon: Globe
  }
];

const BD_NEWS_SOURCES = [
  'prothomalo.com',
  'banglatribune.com',
  'dhakatribune.com',
  'bdnews24.com',
  'jugantor.com',
  'ittefaq.com.bd',
  'kalerkantho.com',
  'nayadiganta.com',
  'bbc.com/bengali',
  'cnn.com'
];

const OUTCOME_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'
];

const LIQUIDITY_PRESETS = [
  { label: 'কম (৳500)', value: 500 },
  { label: 'মাঝারি (৳১,০০০)', value: 1000 },
  { label: 'বেশি (৳৫,০০০)', value: 5000 },
  { label: 'অনেক বেশি (৳১০,০০০)', value: 10000 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Hybrid Consensus Engine
 * Combines AI verdict with human reviews to determine final outcome
 */
interface ConsensusResult {
  outcome: string;
  confidence: number;
  method: 'ai_only' | 'human_only' | 'consensus' | 'override' | 'disagreement';
  reasoning: string;
  ai_contribution: number;
  human_contribution: number;
}

const calculateHybridConsensus = (
  aiVerdict: AIVerdict | undefined,
  humanReviews: HumanReview[],
  config: HybridConsensusConfig
): ConsensusResult => {
  // If no AI verdict and no human reviews, return disagreement
  if (!aiVerdict && humanReviews.length === 0) {
    return {
      outcome: 'pending',
      confidence: 0,
      method: 'disagreement',
      reasoning: 'AI বিশ্লেষণ এবং মানুষ রিভিউ উভয়ই অনুপস্থিত',
      ai_contribution: 0,
      human_contribution: 0
    };
  }

  // If only AI verdict exists (no human reviews yet)
  if (aiVerdict && humanReviews.length === 0) {
    return {
      outcome: aiVerdict.outcome,
      confidence: aiVerdict.confidence * config.ai_weight,
      method: 'ai_only',
      reasoning: `AI ভার্ডিক্ট: ${aiVerdict.reasoning}`,
      ai_contribution: config.ai_weight,
      human_contribution: 0
    };
  }

  // If only human reviews exist (no AI or AI failed)
  if (!aiVerdict && humanReviews.length > 0) {
    const humanConsensus = calculateHumanConsensus(humanReviews);
    return {
      outcome: humanConsensus.outcome,
      confidence: humanConsensus.confidence * config.human_weight,
      method: 'human_only',
      reasoning: `মানুষ কনসেনসাস: ${humanConsensus.reasoning}`,
      ai_contribution: 0,
      human_contribution: config.human_weight
    };
  }

  // Both AI and human reviews exist - calculate weighted consensus
  const aiVote = {
    outcome: aiVerdict!.outcome,
    weight: config.ai_weight,
    confidence: aiVerdict!.confidence / 100
  };

  // Calculate weighted human vote
  const humanConsensus = calculateHumanConsensus(humanReviews);
  const humanVote = {
    outcome: humanConsensus.outcome,
    weight: config.human_weight,
    confidence: humanConsensus.confidence
  };

  // Check if AI and Human agree
  const agreement = aiVote.outcome === humanVote.outcome;
  const agreementStrength = agreement 
    ? (aiVote.confidence * aiVote.weight + humanVote.confidence * humanVote.weight)
    : Math.abs(aiVote.confidence * aiVote.weight - humanVote.confidence * humanVote.weight);

  // If they agree and auto-resolve is enabled
  if (agreement && config.auto_resolve_if_agreement && agreementStrength >= config.consensus_threshold / 100) {
    return {
      outcome: aiVote.outcome,
      confidence: Math.round(agreementStrength * 100),
      method: 'consensus',
      reasoning: `AI (${Math.round(aiVote.confidence * 100)}%) এবং মানুষ (${Math.round(humanVote.confidence * 100)}%) একমত: ${aiVote.outcome}`,
      ai_contribution: aiVote.weight,
      human_contribution: humanVote.weight
    };
  }

  // If they disagree or threshold not met
  if (!agreement) {
    // Human override takes precedence in disagreement
    const hasOverride = humanReviews.some(r => r.override_ai);
    if (hasOverride) {
      return {
        outcome: humanVote.outcome,
        confidence: Math.round(humanVote.confidence * 100),
        method: 'override',
        reasoning: `AI এবং মানুষ ভিন্ন মত। মানুষের ওভাররাইড গৃহীত: ${humanVote.outcome}`,
        ai_contribution: aiVote.weight,
        human_contribution: humanVote.weight
      };
    }

    return {
      outcome: 'disputed',
      confidence: Math.round(agreementStrength * 100),
      method: 'disagreement',
      reasoning: `AI বলে: ${aiVote.outcome} (${Math.round(aiVote.confidence * 100)}%), মানুষ বলে: ${humanVote.outcome} (${Math.round(humanVote.confidence * 100)}%)`,
      ai_contribution: aiVote.weight,
      human_contribution: humanVote.weight
    };
  }

  // Agreement but below threshold - still use consensus
  return {
    outcome: aiVote.outcome,
    confidence: Math.round(agreementStrength * 100),
    method: 'consensus',
    reasoning: `AI এবং মানুষ একমত কিন্তু কনফিডেন্স ${config.consensus_threshold}% এর নিচে`,
    ai_contribution: aiVote.weight,
    human_contribution: humanVote.weight
  };
};

/**
 * Calculate consensus among human reviewers
 */
const calculateHumanConsensus = (reviews: HumanReview[]): { outcome: string; confidence: number; reasoning: string } => {
  if (reviews.length === 0) {
    return { outcome: 'pending', confidence: 0, reasoning: 'কোনো রিভিউ নেই' };
  }

  if (reviews.length === 1) {
    return {
      outcome: reviews[0].verdict,
      confidence: reviews[0].confidence / 100,
      reasoning: `একজন রিভিউয়ার: ${reviews[0].notes || 'কোনো নোট নেই'}`
    };
  }

  // Count votes for each outcome
  const voteCounts: Record<string, { count: number; totalConfidence: number; reviewers: string[] }> = {};
  
  reviews.forEach(review => {
    if (!voteCounts[review.verdict]) {
      voteCounts[review.verdict] = { count: 0, totalConfidence: 0, reviewers: [] };
    }
    voteCounts[review.verdict].count++;
    voteCounts[review.verdict].totalConfidence += review.confidence;
    voteCounts[review.verdict].reviewers.push(review.reviewer_role);
  });

  // Find majority
  let maxVotes = 0;
  let majorityOutcome = '';
  let majorityConfidence = 0;

  Object.entries(voteCounts).forEach(([outcome, data]) => {
    if (data.count > maxVotes) {
      maxVotes = data.count;
      majorityOutcome = outcome;
      majorityConfidence = data.totalConfidence / data.count;
    }
  });

  const agreementPercentage = (maxVotes / reviews.length) * 100;

  return {
    outcome: majorityOutcome,
    confidence: (majorityConfidence / 100) * (agreementPercentage / 100),
    reasoning: `${reviews.length} জনের মধ্যে ${maxVotes} জন (${Math.round(agreementPercentage)}%) ${majorityOutcome} বলেছেন`
  };
};

/**
 * Generate AI verdict (simulated - in production this would call an AI service)
 */
const generateAIVerdict = async (
  eventQuestion: string,
  keywords: string[],
  sources: string[],
  criteria: string
): Promise<AIVerdict> => {
  // This is a placeholder - in production, this would call your AI service
  // For now, return a simulated response
  return {
    outcome: 'pending',
    confidence: 0,
    evidence: [],
    sources: [],
    reasoning: 'AI বিশ্লেষণ এখনো সম্পন্ন হয়নি',
    timestamp: new Date().toISOString()
  };
};

const generateSlug = (title: string): string => {
  const bnMap: Record<string, string> = {
    'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'r', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y'
  };

  const transliterated = title
    .split('')
    .map(char => bnMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
  
  // Append 4-character timestamp suffix
  const timestamp = Date.now().toString(36).slice(-4);
  const slug = `${transliterated}-${timestamp}`;
  
  // Fallback if slug is too short (≤5 chars)
  if (slug.length <= 5) {
    return `event-${timestamp}`;
  }
  
  return slug;
};

const formatDateForInput = (date: Date): string => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function EventCreationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================
  // STATE
  // ============================================
  
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    question: '',
    description: '',
    category: 'sports',
    custom_category: '',  // User-defined custom category name
    subcategory: '',
    tags: [],
    outcomes: [
      { label: 'হ্যাঁ (Yes)', color: '#22c55e' },
      { label: 'না (No)', color: '#ef4444' }
    ],
    trading_closes_at: formatDateForInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    resolution_date: formatDateForInput(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)),
    resolution_delay: 1440,
    initial_liquidity: 1000,
    image_url: '',
    is_featured: false,
    is_private: false,
    allow_multiple_outcomes: false,
    min_bet_amount: 10,
    max_bet_amount: 10000,
    fee_percentage: 2,
    slug: ''  // Auto-generated from name
  });

  const [resolutionConfig, setResolutionConfig] = useState<ResolutionConfig>({
    primary_method: 'manual_admin' as ResolutionMethod,  // Default to manual admin
    ai_keywords: [],
    ai_sources: ['prothomalo.com', 'bdnews24.com'],
    confidence_threshold: 85,
    expert_count: 3,
    resolution_criteria: '',
    source_urls: [],
    // Default hybrid configuration
    hybrid_config: {
      ai_weight: 0.4,           // 40% weight to AI
      human_weight: 0.6,        // 60% weight to Human (humans have final say)
      min_human_reviewers: 1,   // At least 1 human review required
      consensus_threshold: 75,  // 75% agreement needed
      auto_resolve_if_agreement: true  // Auto-resolve if both agree
    },
    // Default POS-Oracle configuration
    pos_oracle_config: {
      bond_amount: 1000,           // ৳1000 default bond
      challenge_window_hours: 24,  // 24 hour challenge window
      min_stake_amount: 500,       // ৳500 minimum stake
      reward_percentage: 10,       // 10% reward
      penalty_percentage: 20,      // 20% penalty
      max_challenges: 3,           // Max 3 challenges
      escalation_threshold: 5000   // Escalate after ৳5000
    },
    // Default UMA configuration
    uma_config: {
      liveness_period: 48,         // 48 hour liveness
      bond_token: 'BDT',           // BDT default token
      bond_amount: 2000,           // 2000 BDT bond
      reward_rate: 5               // 5% reward rate
    }
  });

  // Step management
  const [step, setStep] = useState(1);
  
  const [tagInput, setTagInput] = useState('');         // May be declared but UI uses TagInput component
  const [newKeyword, setNewKeyword] = useState('');     // Used in Step 5 AI keyword input
  const [keywordInput, setKeywordInput] = useState(''); // Alternative keyword input state
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showPreview, setShowPreview] = useState(false);
  
  // Per-field errors state (Record<keyof FormData, string>)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  // Derived state (computed, not useState)
  const selectedCategory = DEFAULT_CATEGORIES.find((c) => c.value === formData.category);
  const subcategories = DEFAULT_CATEGORIES.find((c) => c.value === formData.category)?.subcategories ?? [];
  
  // Helper function to update form fields with type safety
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for the field being updated
    setErrors((e) => {
      const newErrors = { ...e };
      delete newErrors[key];
      return newErrors;
    });
  };
  
  // Auto-generate slug when title changes
  useEffect(() => {
    if (formData.name) set('slug', generateSlug(formData.name));
  }, [formData.name]);
  
  // Category Management
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ label: '', icon: '📌', color: '#6366f1' });
  const [newSubcategory, setNewSubcategory] = useState('');
  const [customSubcategories, setCustomSubcategories] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Image Upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Duplicate Detection
  const [duplicateCheck, setDuplicateCheck] = useState<{ isChecking: boolean; matches: any[] }>({
    isChecking: false,
    matches: []
  });
  
  // Draft Auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  // Load categories from localStorage/API on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Try to load from localStorage first
        const saved = localStorage.getItem('custom_categories');
        if (saved) {
          const customCats = JSON.parse(saved);
          setCategories([...DEFAULT_CATEGORIES, ...customCats]);
        }
        
        // TODO: Load from API if user is authenticated
        // const { data } = await supabase.from('categories').select('*');
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [formData, resolutionConfig]);

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem('event_draft');
    if (saved) {
      try {
        const draft: DraftData = JSON.parse(saved);
        const savedTime = new Date(draft.savedAt);
        const hoursSince = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only restore if less than 24 hours old
        if (hoursSince < 24) {
          setFormData(draft.formData);
          setResolutionConfig(draft.resolutionConfig);
          setLastSaved(savedTime);
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

  // Check for duplicates when name changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (formData.name.length >= 10) {
        checkDuplicates();
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [formData.name]);

  // ============================================
  // HANDLERS
  // ============================================

  const saveDraft = useCallback(() => {
    setIsDraftSaving(true);
    
    const draft: DraftData = {
      formData,
      resolutionConfig,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('event_draft', JSON.stringify(draft));
    setLastSaved(new Date());
    setIsDraftSaving(false);
  }, [formData, resolutionConfig]);

  const checkDuplicates = async () => {
    setDuplicateCheck(prev => ({ ...prev, isChecking: true }));
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, created_at')
        .ilike('name', `%${formData.name}%`)
        .limit(5);
        
      if (!error && data) {
        setDuplicateCheck({ isChecking: false, matches: data });
      }
    } catch (err) {
      console.error('Duplicate check failed:', err);
    } finally {
      setDuplicateCheck(prev => ({ ...prev, isChecking: false }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name || formData.name.length < 10) {
      setError('শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে');
      return false;
    }
    if (!formData.question || formData.question.length < 20) {
      setError('প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে');
      return false;
    }
    if (!formData.question.includes('?') && !formData.question.includes('কি') && !formData.question.includes('হবে')) {
      setError('প্রশ্নে "?" বা "কি" বা "হবে" থাকতে হবে');
      return false;
    }
    if (!formData.trading_closes_at) {
      setError('ট্রেডিং শেষের তারিখ প্রয়োজন');
      return false;
    }
    
    const endDate = new Date(formData.trading_closes_at);
    const now = new Date();
    if (endDate <= now) {
      setError('শেষের তারিখ বর্তমান সময়ের পরে হতে হবে');
      return false;
    }
    
    if (formData.tags.length === 0) {
      setError('কমপক্ষে ১টি ট্যাগ যোগ করুন');
      return false;
    }
    
    if (formData.outcomes.length < 2) {
      setError('কমপক্ষে ২টি আউটকাম থাকতে হবে');
      return false;
    }
    
    if (formData.outcomes.some(o => !o.label.trim())) {
      setError('সব আউটকামের লেবেল পূরণ করুন');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('অনুগ্রহ করে লগইন করুন');
      }

      const slug = generateSlug(formData.name);

      const response = await fetch('/api/admin/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          event_data: {
            ...formData,
            slug,
            status: 'pending'
          },
          resolution_config: resolutionConfig
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ইভেন্ট তৈরি করতে ব্যর্থ');
      }

      // Clear draft after successful creation
      localStorage.removeItem('event_draft');
      
      setSuccess('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!');

      setTimeout(() => {
        router.push(`/events/${result.event_id}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category Management
  const handleAddCategory = () => {
    if (!newCategory.label.trim()) return;
    
    const category: Category = {
      id: `custom_${Date.now()}`,
      value: newCategory.label.toLowerCase().replace(/\s+/g, '_'),
      label: newCategory.label,
      icon: newCategory.icon,
      color: newCategory.color,
      is_custom: true,
      subcategories: customSubcategories
    };
    
    const updated = [...categories, category];
    setCategories(updated);
    
    // Save to localStorage
    const customCats = updated.filter(c => c.is_custom);
    localStorage.setItem('custom_categories', JSON.stringify(customCats));
    
    // Reset form
    setNewCategory({ label: '', icon: '📌', color: '#6366f1' });
    setCustomSubcategories([]);
    setShowCategoryDialog(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = categories.filter(c => c.id !== categoryId);
    setCategories(updated);
    
    const customCats = updated.filter(c => c.is_custom);
    localStorage.setItem('custom_categories', JSON.stringify(customCats));
  };

  // Tag Management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // Outcome Management
  const addOutcome = () => {
    if (formData.outcomes.length >= 8) {
      setError('সর্বোচ্চ ৮টি আউটকাম যোগ করা যাবে');
      return;
    }
    setFormData({
      ...formData,
      outcomes: [...formData.outcomes, { label: '', color: OUTCOME_COLORS[formData.outcomes.length % OUTCOME_COLORS.length] }]
    });
  };

  const removeOutcome = (index: number) => {
    if (formData.outcomes.length <= 2) {
      setError('কমপক্ষে ২টি আউটকাম থাকতে হবে');
      return;
    }
    const newOutcomes = formData.outcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const updateOutcome = (index: number, field: 'label' | 'color', value: string) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = { ...newOutcomes[index], [field]: value };
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('শুধুমাত্র ইমেজ ফাইল আপলোড করুন');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('ইমেজ সাইজ ৫MB এর কম হতে হবে');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('লগইন প্রয়োজন');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (err: any) {
      setError(`ইমেজ আপলোড ব্যর্থ: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Keyword Management
  const addKeyword = () => {
    if (keywordInput.trim() && !resolutionConfig.ai_keywords.includes(keywordInput.trim())) {
      setResolutionConfig({
        ...resolutionConfig,
        ai_keywords: [...resolutionConfig.ai_keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setResolutionConfig({
      ...resolutionConfig,
      ai_keywords: resolutionConfig.ai_keywords.filter(k => k !== keyword)
    });
  };

  // Source URL Management
  const addSourceUrl = () => {
    if (sourceUrlInput.trim() && !resolutionConfig.source_urls.includes(sourceUrlInput.trim())) {
      setResolutionConfig({
        ...resolutionConfig,
        source_urls: [...resolutionConfig.source_urls, sourceUrlInput.trim()]
      });
      setSourceUrlInput('');
    }
  };

  const removeSourceUrl = (url: string) => {
    setResolutionConfig({
      ...resolutionConfig,
      source_urls: resolutionConfig.source_urls.filter(u => u !== url)
    });
  };

  // Get current category
  const currentCategory = categories.find(c => c.value === formData.category);

  // ============================================
  // RENDER
  // ============================================

  return (
    <TooltipProvider>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <span className="text-4xl">📝</span>
                নতুন ইভেন্ট তৈরি করুন
              </h1>
              <p className="text-muted-foreground">
                বাংলাদেশ কনটেক্স্টে অপ্টিমাইজড প্রেডিকশন মার্কেট তৈরি করুন
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isDraftSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {lastSaved && (
                <span>সর্বশেষ সংরক্ষণ: {lastSaved.toLocaleTimeString('bn-BD')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Duplicate Warning */}
        {duplicateCheck.matches.length > 0 && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <Info className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <p className="font-medium">সদৃশ ইভেন্ট পাওয়া গেছে:</p>
              <ul className="mt-1 space-y-1">
                {duplicateCheck.matches.map(match => (
                  <li key={match.id} className="text-sm">
                    • {match.name} ({match.status})
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="basic">মূল তথ্য</TabsTrigger>
            <TabsTrigger value="outcomes">আউটকাম</TabsTrigger>
            <TabsTrigger value="resolution">রেজোলিউশন</TabsTrigger>
            <TabsTrigger value="advanced">অ্যাডভান্সড</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Area */}
            <div className="lg:col-span-2">
              <TabsContent value="basic" className="space-y-6 mt-0">
                {/* Basic Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      মূল তথ্য
                    </CardTitle>
                    <CardDescription>ইভেন্টের মূল তথ্য দিন</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">শিরোনাম (বাংলা/ইংরেজি) *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="যেমন: BPL 2024 ফাইনালে কুমিল্লা জিতবে?"
                        maxLength={200}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.name.length}/200 অক্ষর | Slug: {generateSlug(formData.name) || 'auto-generated'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="question">প্রশ্ন (Yes/No ফরম্যাটে) *</Label>
                      <Textarea
                        id="question"
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        placeholder="পরিষ্কার এবং যাচাইযোগ্য প্রশ্ন লিখুন যার উত্তর হ্যাঁ বা না হবে..."
                        rows={3}
                        maxLength={500}
                        className="mt-1"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>উদাহরণ: "বিপিএল ২০২৪ ফাইনালে কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?"</span>
                        <span>{formData.question.length}/500</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">বিস্তারিত বিবরণ</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="ইভেন্ট সম্পর্কে অতিরিক্ত তথ্য, প্রেক্ষাপট, নিয়ম..."
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        ক্যাটাগরি এবং ট্যাগ
                      </CardTitle>
                      <CardDescription>ইভেন্টের ধরন নির্ধারণ করুন</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategoryDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      নতুন ক্যাটাগরি
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>ক্যাটাগরি *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: '', custom_category: '' })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg max-h-80 overflow-y-auto">
                            {categories.map((cat) => (
                              <SelectItem 
                                key={cat.id} 
                                value={cat.value}
                                className="cursor-pointer hover:bg-blue-50 focus:bg-blue-100 py-3 px-4 border-b border-gray-100 last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{cat.icon}</span>
                                  <span className="font-medium text-gray-900">{cat.label}</span>
                                  {cat.is_custom && (
                                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">কাস্টম</Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>সাবক্যাটাগরি</Label>
                        <Select
                          value={formData.subcategory}
                          onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="সাবক্যাটাগরি নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg max-h-60 overflow-y-auto">
                            {currentCategory?.subcategories.map((sub) => (
                              <SelectItem 
                                key={sub} 
                                value={sub}
                                className="cursor-pointer hover:bg-blue-50 focus:bg-blue-100 py-3 px-4 border-b border-gray-100 last:border-0"
                              >
                                <span className="font-medium text-gray-900">{sub}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Custom Category Input - Show when custom category is selected or when user wants to add custom */}
                    {(currentCategory?.is_custom || formData.category === 'custom') && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Label htmlFor="custom-category" className="text-blue-800 font-medium">
                          কাস্টম ক্যাটাগরি নাম *
                        </Label>
                        <Input
                          id="custom-category"
                          value={formData.custom_category}
                          onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                          placeholder="আপনার কাস্টম ক্যাটাগরির নাম লিখুন..."
                          className="mt-2 bg-white"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          এই ক্যাটাগরি শুধুমাত্র এই ইভেন্টের জন্য ব্যবহার হবে
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <Label>ট্যাগ *</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="ট্যাগ লিখুন এবং Enter চাপুন"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-destructive" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      ইভেন্ট ইমেজ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                        imagePreview ? "border-solid" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-cover"
                        />
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            ইমেজ আপলোড করতে ক্লিক করুন
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG, GIF (সর্বোচ্চ ৫MB)
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {isUploadingImage && (
                      <div className="flex items-center justify-center mt-4">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm">আপলোড হচ্ছে...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="outcomes" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      মার্কেট আউটকাম
                    </CardTitle>
                    <CardDescription>
                      ব্যবহারকারীরা কোন কোন ফলাফলের উপর বাজি ধরতে পারবে
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: outcome.color }}
                        />
                        <Input
                          value={outcome.label}
                          onChange={(e) => updateOutcome(index, 'label', e.target.value)}
                          placeholder={`আউটকাম ${index + 1}`}
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={outcome.color}
                          onChange={(e) => updateOutcome(index, 'color', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOutcome(index)}
                          disabled={formData.outcomes.length <= 2}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addOutcome}
                      disabled={formData.outcomes.length >= 8}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      আউটকাম যোগ করুন
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resolution" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      রেজোলিউশন কনফিগারেশন
                    </CardTitle>
                    <CardDescription>ইভেন্ট কিভাবে রেজোলভ হবে তা নির্ধারণ করুন</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {RESOLUTION_METHODS.map((method) => {
                        const Icon = method.icon;
                        return (
                          <div
                            key={method.value}
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              resolutionConfig.primary_method === method.value
                                ? "border-primary bg-primary/5"
                                : "hover:border-muted-foreground/50"
                            )}
                            onClick={() => setResolutionConfig({ ...resolutionConfig, primary_method: method.value })}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 mt-0.5" />
                              <div>
                                <h4 className="font-medium">{method.label}</h4>
                                <p className="text-sm text-muted-foreground">{method.description}</p>
                              </div>
                              {resolutionConfig.primary_method === method.value && (
                                <Check className="w-5 h-5 text-primary ml-auto" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Oracle Settings */}
                    {(resolutionConfig.primary_method === 'ai_oracle' || resolutionConfig.primary_method === 'hybrid') && (
                      <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          AI Oracle সেটিংস
                          {resolutionConfig.primary_method === 'hybrid' && (
                            <Badge variant="secondary" className="text-xs">Hybrid Mode</Badge>
                          )}
                        </h4>

                        <div>
                          <Label>কীওয়ার্ড (বাংলা + ইংরেজি)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              placeholder="যেমন: BPL, কুমিল্লা, Shakib"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addKeyword();
                                }
                              }}
                            />
                            <Button type="button" onClick={addKeyword} variant="outline">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {resolutionConfig.ai_keywords.map((kw) => (
                              <Badge key={kw} variant="outline" className="cursor-pointer" onClick={() => removeKeyword(kw)}>
                                {kw} ×
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>নিউজ সোর্স</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {BD_NEWS_SOURCES.map((source) => (
                              <Badge
                                key={source}
                                variant={resolutionConfig.ai_sources.includes(source) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                  const newSources = resolutionConfig.ai_sources.includes(source)
                                    ? resolutionConfig.ai_sources.filter(s => s !== source)
                                    : [...resolutionConfig.ai_sources, source];
                                  setResolutionConfig({ ...resolutionConfig, ai_sources: newSources });
                                }}
                              >
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Confidence Threshold: {resolutionConfig.confidence_threshold}%</Label>
                          <input
                            type="range"
                            min="70"
                            max="99"
                            value={resolutionConfig.confidence_threshold}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              confidence_threshold: parseInt(e.target.value)
                            })}
                            className="w-full mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* POS-Oracle (Optimistic Oracle) Configuration */}
                    {resolutionConfig.primary_method === 'pos_oracle' && (
                      <div className="space-y-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 text-amber-800">
                          <Zap className="w-4 h-4" />
                          POS-Oracle (Optimistic) কনফিগারেশন
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-amber-600" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p>Proof-of-Stake Optimistic Oracle ব্যবহার করে বন্ড-ভিত্তিক রেজোলিউশন। চ্যালেঞ্জ উইন্ডোতে কেউ আপত্তি না করলে প্রস্তাব গৃহীত হয়।</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>

                        {/* Bond Amount */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">বন্ড পরিমাণ (৳)</Label>
                            <span className="text-sm font-medium text-amber-700">
                              ৳{resolutionConfig.pos_oracle_config?.bond_amount || 1000}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="10000"
                            step="100"
                            value={resolutionConfig.pos_oracle_config?.bond_amount || 1000}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              pos_oracle_config: {
                                ...(resolutionConfig.pos_oracle_config || {
                                  bond_amount: 1000,
                                  challenge_window_hours: 24,
                                  min_stake_amount: 500,
                                  reward_percentage: 10,
                                  penalty_percentage: 20,
                                  max_challenges: 3,
                                  escalation_threshold: 5000
                                }),
                                bond_amount: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-amber-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            রেজোলিউশন প্রস্তাব দিতে ন্যূনতম বন্ড
                          </p>
                        </div>

                        {/* Challenge Window */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">চ্যালেঞ্জ উইন্ডো (ঘণ্টা)</Label>
                            <span className="text-sm font-medium text-amber-700">
                              {resolutionConfig.pos_oracle_config?.challenge_window_hours || 24} ঘণ্টা
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="72"
                            value={resolutionConfig.pos_oracle_config?.challenge_window_hours || 24}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              pos_oracle_config: {
                                ...(resolutionConfig.pos_oracle_config || {
                                  bond_amount: 1000,
                                  challenge_window_hours: 24,
                                  min_stake_amount: 500,
                                  reward_percentage: 10,
                                  penalty_percentage: 20,
                                  max_challenges: 3,
                                  escalation_threshold: 5000
                                }),
                                challenge_window_hours: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-amber-600"
                          />
                        </div>

                        {/* Reward/Penalty */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">রিওয়ার্ড %</Label>
                            <input
                              type="number"
                              min="5"
                              max="50"
                              value={resolutionConfig.pos_oracle_config?.reward_percentage || 10}
                              onChange={(e) => setResolutionConfig({
                                ...resolutionConfig,
                                pos_oracle_config: {
                                  ...(resolutionConfig.pos_oracle_config || {
                                    bond_amount: 1000,
                                    challenge_window_hours: 24,
                                    min_stake_amount: 500,
                                    reward_percentage: 10,
                                    penalty_percentage: 20,
                                    max_challenges: 3,
                                    escalation_threshold: 5000
                                  }),
                                  reward_percentage: parseInt(e.target.value)
                                }
                              })}
                              className="w-full mt-1 px-2 py-1 border rounded"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">পেনাল্টি %</Label>
                            <input
                              type="number"
                              min="10"
                              max="100"
                              value={resolutionConfig.pos_oracle_config?.penalty_percentage || 20}
                              onChange={(e) => setResolutionConfig({
                                ...resolutionConfig,
                                pos_oracle_config: {
                                  ...(resolutionConfig.pos_oracle_config || {
                                    bond_amount: 1000,
                                    challenge_window_hours: 24,
                                    min_stake_amount: 500,
                                    reward_percentage: 10,
                                    penalty_percentage: 20,
                                    max_challenges: 3,
                                    escalation_threshold: 5000
                                  }),
                                  penalty_percentage: parseInt(e.target.value)
                                }
                              })}
                              className="w-full mt-1 px-2 py-1 border rounded"
                            />
                          </div>
                        </div>

                        {/* Max Challenges */}
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">সর্বোচ্চ চ্যালেঞ্জ সংখ্যা</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setResolutionConfig({
                                ...resolutionConfig,
                                pos_oracle_config: {
                                  ...(resolutionConfig.pos_oracle_config || {
                                    bond_amount: 1000,
                                    challenge_window_hours: 24,
                                    min_stake_amount: 500,
                                    reward_percentage: 10,
                                    penalty_percentage: 20,
                                    max_challenges: 3,
                                    escalation_threshold: 5000
                                  }),
                                  max_challenges: Math.max(1, (resolutionConfig.pos_oracle_config?.max_challenges || 3) - 1)
                                }
                              })}
                              disabled={(resolutionConfig.pos_oracle_config?.max_challenges || 3) <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {resolutionConfig.pos_oracle_config?.max_challenges || 3}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setResolutionConfig({
                                ...resolutionConfig,
                                pos_oracle_config: {
                                  ...(resolutionConfig.pos_oracle_config || {
                                    bond_amount: 1000,
                                    challenge_window_hours: 24,
                                    min_stake_amount: 500,
                                    reward_percentage: 10,
                                    penalty_percentage: 20,
                                    max_challenges: 3,
                                    escalation_threshold: 5000
                                  }),
                                  max_challenges: Math.min(5, (resolutionConfig.pos_oracle_config?.max_challenges || 3) + 1)
                                }
                              })}
                              disabled={(resolutionConfig.pos_oracle_config?.max_challenges || 3) >= 5}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* POS Flow Preview */}
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-xs font-semibold text-amber-800 mb-2">POS-Oracle ফ্লো:</h5>
                          <ol className="text-xs space-y-1 text-muted-foreground">
                            <li>1. প্রস্তাবক বন্ড (৳{resolutionConfig.pos_oracle_config?.bond_amount || 1000}) দিয়ে রেজোলিউশন প্রস্তাব দেয়</li>
                            <li>2. {resolutionConfig.pos_oracle_config?.challenge_window_hours || 24} ঘণ্টা চ্যালেঞ্জ উইন্ডো খোলা থাকে</li>
                            <li>3. কেউ চ্যালেঞ্জ করলে উচ্চতর বন্ড দিয়ে বিরোধিতা করা যায়</li>
                            <li>4. সর্বোচ্চ {resolutionConfig.pos_oracle_config?.max_challenges || 3}টি চ্যালেঞ্জ অনুমোদিত</li>
                            <li>5. চ্যালেঞ্জ না থাকলে প্রস্তাব গৃহীত, রিওয়ার্ড পায় প্রস্তাবক</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* UMA (Universal Market Access) Configuration */}
                    {resolutionConfig.primary_method === 'uma' && (
                      <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 text-blue-800">
                          <Globe className="w-4 h-4" />
                          UMA (Universal Market Access) কনফিগারেশন
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-blue-600" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p>UMA Optimistic Oracle হলো একটি ডিসেনট্রালাইজড Oracle যা ইকনোমিক সিকিউরিটি প্রদান করে। বন্ড স্টেক করে রেজোলিউশন প্রস্তাব দেওয়া যায়।</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>

                        {/* Bond Token Selection */}
                        <div>
                          <Label className="text-sm">বন্ড টোকেন</Label>
                          <div className="flex gap-2 mt-2">
                            {(['BDT', 'USDT'] as const).map((token) => (
                              <Badge
                                key={token}
                                variant={resolutionConfig.uma_config?.bond_token === token ? 'default' : 'outline'}
                                className="cursor-pointer px-4 py-2"
                                onClick={() => setResolutionConfig({
                                  ...resolutionConfig,
                                  uma_config: {
                                    ...(resolutionConfig.uma_config || {
                                      liveness_period: 48,
                                      bond_token: 'BDT',
                                      bond_amount: 2000,
                                      reward_rate: 5
                                    }),
                                    bond_token: token
                                  }
                                })}
                              >
                                {token}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Bond Amount */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">বন্ড পরিমাণ</Label>
                            <span className="text-sm font-medium text-blue-700">
                              {resolutionConfig.uma_config?.bond_amount || 2000} {resolutionConfig.uma_config?.bond_token || 'BDT'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="500"
                            max="50000"
                            step="500"
                            value={resolutionConfig.uma_config?.bond_amount || 2000}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              uma_config: {
                                ...(resolutionConfig.uma_config || {
                                  liveness_period: 48,
                                  bond_token: 'BDT',
                                  bond_amount: 2000,
                                  reward_rate: 5
                                }),
                                bond_amount: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-blue-600"
                          />
                        </div>

                        {/* Liveness Period */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">Liveness Period (ঘণ্টা)</Label>
                            <span className="text-sm font-medium text-blue-700">
                              {resolutionConfig.uma_config?.liveness_period || 48} ঘণ্টা
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="168"
                            value={resolutionConfig.uma_config?.liveness_period || 48}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              uma_config: {
                                ...(resolutionConfig.uma_config || {
                                  liveness_period: 48,
                                  bond_token: 'BDT',
                                  bond_amount: 2000,
                                  reward_rate: 5
                                }),
                                liveness_period: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-blue-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            এই সময়ের মধ্যে কেউ ডিসপিউট করতে পারে
                          </p>
                        </div>

                        {/* Reward Rate */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">রিওয়ার্ড রেট (%)</Label>
                            <span className="text-sm font-medium text-blue-700">
                              {resolutionConfig.uma_config?.reward_rate || 5}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={resolutionConfig.uma_config?.reward_rate || 5}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              uma_config: {
                                ...(resolutionConfig.uma_config || {
                                  liveness_period: 48,
                                  bond_token: 'BDT',
                                  bond_amount: 2000,
                                  reward_rate: 5
                                }),
                                reward_rate: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-blue-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            সফল ডিসপিউটকারীরা এই হারে রিওয়ার্ড পাবে
                          </p>
                        </div>

                        {/* Price Identifier */}
                        <div>
                          <Label className="text-sm">Price Identifier (ঐচ্ছিক)</Label>
                          <Input
                            value={resolutionConfig.uma_config?.price_identifier || ''}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              uma_config: {
                                ...(resolutionConfig.uma_config || {
                                  liveness_period: 48,
                                  bond_token: 'BDT',
                                  bond_amount: 2000,
                                  reward_rate: 5
                                }),
                                price_identifier: e.target.value
                              }
                            })}
                            placeholder="যেমন: YES_NO, BINARY_EVENT"
                            className="mt-1"
                          />
                        </div>

                        {/* UMA Flow Preview */}
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-xs font-semibold text-blue-800 mb-2">UMA ফ্লো:</h5>
                          <ol className="text-xs space-y-1 text-muted-foreground">
                            <li>1. প্রস্তাবক {resolutionConfig.uma_config?.bond_amount || 2000} {resolutionConfig.uma_config?.bond_token || 'BDT'} বন্ড স্টেক করে</li>
                            <li>2. {resolutionConfig.uma_config?.liveness_period || 48} ঘণ্টা liveness period চলে</li>
                            <li>3. কেউ ডিসপিউট করলে DVM (Data Verification Mechanism) কাজ করে</li>
                            <li>4. ভোটাররা চূড়ান্ত সিদ্ধান্ত নেয়</li>
                            <li>5. সঠিক পক্ষকে রিওয়ার্ড, ভুল পক্ষকে পেনাল্টি</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Hybrid Consensus Configuration */}
                    {resolutionConfig.primary_method === 'hybrid' && resolutionConfig.hybrid_config && (
                      <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 text-purple-800">
                          <Sparkles className="w-4 h-4" />
                          হাইব্রিড কনসেনসাস কনফিগারেশন
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-purple-600" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <p>AI এবং মানুষের ভোটের ভিত্তিতে চূড়ান্ত সিদ্ধান্ত নেওয়া হবে। মানুষের ভোটকে বেশি গুরুত্ব দেওয়া হয়।</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </h4>

                        {/* AI Weight Slider */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">AI ভোটের ওজন</Label>
                            <span className="text-sm font-medium text-purple-700">
                              {Math.round(resolutionConfig.hybrid_config.ai_weight * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="50"
                            value={resolutionConfig.hybrid_config.ai_weight * 100}
                            onChange={(e) => {
                              const aiWeight = parseInt(e.target.value) / 100;
                              setResolutionConfig({
                                ...resolutionConfig,
                                hybrid_config: {
                                  ...resolutionConfig.hybrid_config!,
                                  ai_weight: aiWeight,
                                  human_weight: 1 - aiWeight
                                }
                              });
                            }}
                            className="w-full mt-2 accent-purple-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            মানুষের ভোটের ওজন: {Math.round(resolutionConfig.hybrid_config.human_weight * 100)}%
                          </p>
                        </div>

                        {/* Consensus Threshold */}
                        <div>
                          <div className="flex justify-between">
                            <Label className="text-sm">কনসেনসাস থ্রেশহোল্ড</Label>
                            <span className="text-sm font-medium text-purple-700">
                              {resolutionConfig.hybrid_config.consensus_threshold}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="51"
                            max="95"
                            value={resolutionConfig.hybrid_config.consensus_threshold}
                            onChange={(e) => setResolutionConfig({
                              ...resolutionConfig,
                              hybrid_config: {
                                ...resolutionConfig.hybrid_config!,
                                consensus_threshold: parseInt(e.target.value)
                              }
                            })}
                            className="w-full mt-2 accent-purple-600"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            এত % মিল থাকলে কনসেনসাস ধরা হবে
                          </p>
                        </div>

                        {/* Minimum Human Reviewers */}
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">ন্যূনতম মানুষ রিভিউয়ার</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setResolutionConfig({
                                ...resolutionConfig,
                                hybrid_config: {
                                  ...resolutionConfig.hybrid_config!,
                                  min_human_reviewers: Math.max(1, resolutionConfig.hybrid_config!.min_human_reviewers - 1)
                                }
                              })}
                              disabled={resolutionConfig.hybrid_config.min_human_reviewers <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {resolutionConfig.hybrid_config.min_human_reviewers}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setResolutionConfig({
                                ...resolutionConfig,
                                hybrid_config: {
                                  ...resolutionConfig.hybrid_config!,
                                  min_human_reviewers: Math.min(5, resolutionConfig.hybrid_config!.min_human_reviewers + 1)
                                }
                              })}
                              disabled={resolutionConfig.hybrid_config.min_human_reviewers >= 5}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* Auto-resolve Toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm">অটো-রেজোলিউশন</Label>
                            <p className="text-xs text-muted-foreground">
                              AI ও মানুষ একমত হলে অটো রেজোলিউশন
                            </p>
                          </div>
                          <Switch
                            checked={resolutionConfig.hybrid_config.auto_resolve_if_agreement}
                            onCheckedChange={(checked) => setResolutionConfig({
                              ...resolutionConfig,
                              hybrid_config: {
                                ...resolutionConfig.hybrid_config!,
                                auto_resolve_if_agreement: checked
                              }
                            })}
                          />
                        </div>

                        {/* Hybrid Flow Preview */}
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h5 className="text-xs font-semibold text-purple-800 mb-2">হাইব্রিড ফ্লো:</h5>
                          <ol className="text-xs space-y-1 text-muted-foreground">
                            <li>1. AI বিশ্লেষণ করে ভার্ডিক্ট দেয় ({Math.round(resolutionConfig.hybrid_config.ai_weight * 100)}% ওজন)</li>
                            <li>2. মানুষ রিভিউ করে ({Math.round(resolutionConfig.hybrid_config.human_weight * 100)}% ওজন)</li>
                            <li>3. কনসেনসাস ইঞ্জিন চূড়ান্ত সিদ্ধান্ত নেয়</li>
                            <li>4. {resolutionConfig.hybrid_config.auto_resolve_if_agreement ? 'একমত হলে অটো রেজোলিউশন' : 'সবসময় অ্যাডমিন অনুমোদন লাগবে'}</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* Resolution Criteria */}
                    <div>
                      <Label htmlFor="criteria">রেজোলিউশন ক্রাইটেরিয়া</Label>
                      <Textarea
                        id="criteria"
                        value={resolutionConfig.resolution_criteria}
                        onChange={(e) => setResolutionConfig({ ...resolutionConfig, resolution_criteria: e.target.value })}
                        placeholder="কোন শর্তে ইভেন্ট হ্যাঁ/না হবে তা বিস্তারিত লিখুন..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* Source URLs */}
                    <div>
                      <Label className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" />
                        রেফারেন্স URL
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={sourceUrlInput}
                          onChange={(e) => setSourceUrlInput(e.target.value)}
                          placeholder="https://..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSourceUrl();
                            }
                          }}
                        />
                        <Button type="button" onClick={addSourceUrl} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {resolutionConfig.source_urls.map((url) => (
                          <Badge key={url} variant="secondary" className="cursor-pointer max-w-xs truncate" onClick={() => removeSourceUrl(url)}>
                            {url} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6 mt-0">
                {/* Time Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      সময় সেটিংস
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="trading-closes">ট্রেডিং শেষ *</Label>
                        <Input
                          id="trading-closes"
                          type="datetime-local"
                          value={formData.trading_closes_at}
                          onChange={(e) => setFormData({ ...formData, trading_closes_at: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resolution-date">রেজোলিউশন তারিখ *</Label>
                        <Input
                          id="resolution-date"
                          type="datetime-local"
                          value={formData.resolution_date}
                          onChange={(e) => setFormData({ ...formData, resolution_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liquidity & Fees */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      লিকুইডিটি এবং ফি
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>প্রাথমিক লিকুইডিটি</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {LIQUIDITY_PRESETS.map((preset) => (
                          <Button
                            key={preset.value}
                            variant={formData.initial_liquidity === preset.value ? 'default' : 'outline'}
                            onClick={() => setFormData({ ...formData, initial_liquidity: preset.value })}
                            className="text-xs"
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="min-bet">সর্বনিম্ন বেট (৳ - টাকা)</Label>
                        <Input
                          id="min-bet"
                          type="number"
                          min={5}
                          value={formData.min_bet_amount}
                          onChange={(e) => setFormData({ ...formData, min_bet_amount: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-bet">সর্বোচ্চ বেট (৳ - টাকা)</Label>
                        <Input
                          id="max-bet"
                          type="number"
                          value={formData.max_bet_amount}
                          onChange={(e) => setFormData({ ...formData, max_bet_amount: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fee">প্ল্যাটফর্ম ফি (%)</Label>
                        <Input
                          id="fee"
                          type="number"
                          min={0}
                          max={10}
                          value={formData.fee_percentage}
                          onChange={(e) => setFormData({ ...formData, fee_percentage: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Visibility Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      ভিজিবিলিটি
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured">ফিচার্ড ইভেন্ট</Label>
                        <p className="text-sm text-muted-foreground">হোমপেজে প্রদর্শন করুন</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="private">প্রাইভেট ইভেন্ট</Label>
                        <p className="text-sm text-muted-foreground">শুধুমাত্র লিংকে প্রবেশযোগ্য</p>
                      </div>
                      <Switch
                        id="private"
                        checked={formData.is_private}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    লাইভ প্রিভিউ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Preview */}
                  <div className="border rounded-lg overflow-hidden bg-card">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Event"
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{currentCategory?.icon}</span>
                        <Badge variant="secondary">{currentCategory?.label}</Badge>
                        {formData.is_featured && (
                          <Badge variant="default" className="bg-yellow-500">⭐ ফিচার্ড</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold line-clamp-2">
                        {formData.name || 'ইভেন্ট শিরোনাম'}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {formData.question || 'প্রশ্ন এখানে দেখা যাবে'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded">
                            {tag}
                          </span>
                        ))}
                        {formData.tags.length > 3 && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded">
                            +{formData.tags.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>প্রাথমিক লিকুইডিটি:</span>
                          <span>৳{formData.initial_liquidity.toLocaleString('bn-BD')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ট্রেডিং শেষ:</span>
                          <span>{formData.trading_closes_at ? new Date(formData.trading_closes_at).toLocaleDateString('bn-BD') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>রেজোলিউশন পদ্ধতি:</span>
                          <span className="font-medium text-primary">
                            {(() => {
                              const method = RESOLUTION_METHODS.find(m => m.value === resolutionConfig.primary_method);
                              if (!method) return '-';
                              // Extract Bangla part before parenthesis
                              const banglaPart = method.label.split('(')[0].trim();
                              return banglaPart;
                            })()}
                          </span>
                        </div>

                        {/* POS-Oracle Summary */}
                        {resolutionConfig.primary_method === 'pos_oracle' && resolutionConfig.pos_oracle_config && (
                          <>
                            <div className="flex justify-between">
                              <span>বন্ড পরিমাণ:</span>
                              <span>৳{resolutionConfig.pos_oracle_config.bond_amount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>চ্যালেঞ্জ উইন্ডো:</span>
                              <span>{resolutionConfig.pos_oracle_config.challenge_window_hours} ঘণ্টা</span>
                            </div>
                          </>
                        )}

                        {/* UMA Summary */}
                        {resolutionConfig.primary_method === 'uma' && resolutionConfig.uma_config && (
                          <>
                            <div className="flex justify-between">
                              <span>UMA বন্ড:</span>
                              <span>{resolutionConfig.uma_config.bond_amount} {resolutionConfig.uma_config.bond_token}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Liveness Period:</span>
                              <span>{resolutionConfig.uma_config.liveness_period} ঘণ্টা</span>
                            </div>
                          </>
                        )}

                        {/* Hybrid Summary */}
                        {resolutionConfig.primary_method === 'hybrid' && resolutionConfig.hybrid_config && (
                          <>
                            <div className="flex justify-between">
                              <span>AI ওজন:</span>
                              <span>{Math.round(resolutionConfig.hybrid_config.ai_weight * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>মানুষের ওজন:</span>
                              <span>{Math.round(resolutionConfig.hybrid_config.human_weight * 100)}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outcomes Preview */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">আউটকাম</h4>
                    <div className="space-y-1">
                      {formData.outcomes.map((outcome, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded text-sm"
                          style={{ backgroundColor: `${outcome.color}20` }}
                        >
                          <span>{outcome.label || `আউটকাম ${i + 1}`}</span>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: outcome.color }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">ভ্যালিডেশন</h4>
                    {[
                      { label: 'শিরোনাম (১০+ অক্ষর)', valid: formData.name.length >= 10 },
                      { label: 'প্রশ্ন (২০+ অক্ষর)', valid: formData.question.length >= 20 },
                      { label: 'ট্রেডিং শেষ তারিখ', valid: !!formData.trading_closes_at },
                      { label: 'ক্যাটাগরি', valid: !!formData.category },
                      { label: 'ট্যাগ (১+)', valid: formData.tags.length > 0 },
                      { label: 'আউটকাম (২+)', valid: formData.outcomes.length >= 2 && formData.outcomes.every(o => o.label.trim()) },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {item.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={item.valid ? 'text-green-600' : 'text-red-600'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? 'তৈরি হচ্ছে...' : 'ইভেন্ট তৈরি করুন'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={saveDraft}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      ড্রাফট সংরক্ষণ করুন
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>

        {/* Category Management Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>নতুন ক্যাটাগরি তৈরি করুন</DialogTitle>
              <DialogDescription>
                আপনার নিজস্ব ক্যাটাগরি তৈরি করুন
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>ক্যাটাগরি নাম</Label>
                <Input
                  value={newCategory.label}
                  onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  placeholder="যেমন: শিক্ষা, স্বাস্থ্য"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>আইকন (Emoji)</Label>
                  <Input
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    placeholder="📚"
                    maxLength={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>রঙ</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground">{newCategory.color}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>সাবক্যাটাগরি</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    placeholder="সাবক্যাটাগরি নাম"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSubcategory.trim()) {
                          setCustomSubcategories([...customSubcategories, newSubcategory.trim()]);
                          setNewSubcategory('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newSubcategory.trim()) {
                        setCustomSubcategories([...customSubcategories, newSubcategory.trim()]);
                        setNewSubcategory('');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {customSubcategories.map((sub) => (
                    <Badge key={sub} variant="secondary" className="cursor-pointer" onClick={() => setCustomSubcategories(customSubcategories.filter(s => s !== sub))}>
                      {sub} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                বাতিল
              </Button>
              <Button onClick={handleAddCategory} disabled={!newCategory.label.trim()}>
                ক্যাটাগরি তৈরি করুন
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
