"use client";

import {useState, useEffect, useCallback, useMemo} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {createClient} from "@/lib/supabase/client";
import {useToast} from "@/components/ui/use-toast";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";
import {Switch} from "@/components/ui/switch";
import {Slider} from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Settings,
  Eye,
  Trash2,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Users,
  Droplets,
  Wallet,
  Percent,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  BarChart3,
  Sparkles,
  Link as LinkIcon,
  Zap,
  Shield,
  Scale,
  Coins,
  Gavel,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Check,
} from "lucide-react";

import {Label} from "@/components/ui/label";
import {EventLinkingPanel} from "@/components/admin/EventLinkingPanel";
import {marketService} from "@/lib/services/MarketService";
import {eventMarketSync} from "@/lib/services/EventMarketSync";

//─── Types ───────────────────────────────────────────────────────────────────

interface Market {
  id: string;
  event_id: string | null;
  event_name: string | null;
  question: string;
  category: string;
  market_type: "binary" | "multi_outcome" | "scalar";
  status: "draft" | "pending_review" | "active" | "paused" | "resolved" | "rejected";
  current_stage: string;
  stages_completed: string[];
  yes_price: number;
  no_price: number;
  liquidity: number;
  trading_fee_percent: number;
  total_volume: number;
  resolution_deadline: string;
  trading_closes_at: string;
  oracle_type: "MANUAL" | "AI" | "CHAINLINK" | "UMA" | "MULTI";
  resolution_source: string;
  traders: number;
  created_at: string;
  image_url: string | null;
  risk_score: number;
  confidence: number;
  min_trade_amount?: number;
  max_trade_amount?: number;
  tick_size?: number;
  circuit_breaker_enabled?: boolean;
  initial_liquidity?: number;
}

interface Event {
  id: string;
  name: string;
  name_en: string;
  category: string;
  status: string;
  event_date: string;
  hasMarket: boolean;
}

interface MarketStats {
  volume: number;
  volume24h: number;
  tradeCount: number;
  uniqueTraders: number;
  liquidityScore: number;
  openBuyOrders: number;
  openSellOrders: number;
}

//─── Constants ───────────────────────────────────────────────────────────────

const STAGES = [
  {id: "template_selection", short: "টেমপ্লেট", full: "টেমপ্লেট নির্বাচন"},
  {id: "parameter_configuration", short: "কনফিগ", full: "প্যারামিটার কনফিগারেশন"},
  {id: "liquidity_commitment", short: "তারল্য", full: "তারল্য কমিটমেন্ট"},
  {id: "legal_review", short: "আইনি", full: "আইনি পর্যালোচনা"},
  {id: "preview_simulation", short: "প্রিভিউ", full: "প্রিভিউ সিমুলেশন"},
  {id: "deployment", short: "ডিপ্লয়", full: "ডিপ্লয়মেন্ট"},
];

const CATEGORY_META: Record<string, {color: string; bg: string; icon: string; gradient: string}> = {
  Sports: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    icon: "⚽",
    gradient: "from-green-500/20 to-emerald-500/10"
 },
  Crypto: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    icon: "₿",
    gradient: "from-amber-500/20 to-orange-500/10"
 },
  Politics: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    icon: "🗳️",
    gradient: "from-red-500/20 to-rose-500/10"
 },
  Finance: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: "📈",
    gradient: "from-blue-500/20 to-cyan-500/10"
 },
  Entertainment: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
    icon: "🎬",
    gradient: "from-purple-500/20 to-violet-500/10"
 },
  Technology: {
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
    icon: "💻",
    gradient: "from-cyan-500/20 to-sky-500/10"
 },
  Categorical: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: "🔮",
    gradient: "from-violet-500/20 to-purple-500/10"
 },
  Other: {
    color: "#64748b",
    bg: "rgba(100,116,139,0.12)",
    icon: "📋",
    gradient: "from-slate-500/20 to-gray-500/10"
 },
};

const STATUS_META: Record<string, {label: string; color: string; bg: string; icon: any}> = {
  draft: {
    label: "খসড়া",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.15)",
    icon: Minus
 },
  pending_review: {
    label: "পর্যালোচনা",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: AlertTriangle
 },
  active: {
    label: "লাইভ",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.15)",
    icon: Play
 },
  paused: {
    label: "বিরতি",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: Pause
 },
  resolved: {
    label: "সমাধান",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.15)",
    icon: CheckCircle2
 },
  rejected: {
    label: "প্রত্যাখ্যাত",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.15)",
    icon: XCircle
 },
};

const ORACLE_LABELS: Record<string, string> = {
  MANUAL: "ম্যানুয়াল",
  AI: "AI ওরাকল",
  CHAINLINK: "Chainlink",
  UMA: "UMA",
  MULTI: "মাল্টি-সোর্স",
};

//─── Utilities ───────────────────────────────────────────────────────────────

function formatBDT(n: number): string {
  if (!n || n === 0) return "৳0";
  if (n >= 10000000) return `৳${(n/10000000).toFixed(2)} কোটি`;
  if (n >= 100000) return `৳${(n/100000).toFixed(1)} লাখ`;
  if (n >= 1000) return `৳${(n/1000).toFixed(1)}K`;
  return `৳${n.toLocaleString("bn-BD")}`;
}

function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n/10000000).toFixed(1)}কোটি`;
  if (n >= 100000) return `${(n/100000).toFixed(1)}লাখ`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toString();
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime()-Date.now();
  const days = Math.floor(diff/86400000);
  const hours = Math.floor((diff % 86400000)/3600000);

  if (days > 30) return `${Math.floor(days/30)} মাস বাকি`;
  if (days > 0) return `${days} দিন ${hours} ঘণ্টা বাকি`;
  if (hours > 0) return `${hours} ঘণ্টা বাকি`;
  if (diff > 0) return "শীঘ্রই";
  return "মেয়াদ শেষ";
}

function getRiskColor(score: number): string {
  if (score < 30) return "#22c55e";
  if (score < 60) return "#f59e0b";
  return "#ef4444";
}

function getRiskLabel(score: number): string {
  if (score < 30) return "নিরাপদ";
  if (score < 60) return "মাঝারি";
  return "উচ্চ ঝুঁকি";
}

//─── Mock Data (Replace with API calls) ──────────────────────────────────────

const MOCK_EVENTS: Event[] = [
  {
    id: "evt-001",
    name: "BPL 2026 ফাইনাল",
    name_en: "BPL 2026 Final",
    category: "Sports",
    status: "active",
    event_date: "2026-03-15",
    hasMarket: false,
 },
  {
    id: "evt-002",
    name: "বিটকয়েন মূল্য Q2 2026",
    name_en: "Bitcoin Price Q2 2026",
    category: "Crypto",
    status: "active",
    event_date: "2026-06-30",
    hasMarket: true,
 },
  {
    id: "evt-003",
    name: "বাংলাদেশ vs ভারত টেস্ট",
    name_en: "Bangladesh vs India Test",
    category: "Sports",
    status: "active",
    event_date: "2026-04-20",
    hasMarket: false,
 },
];

const MOCK_MARKETS: Market[] = [
  {
    id: "mkt-001",
    event_id: "evt-002",
    event_name: "বিটকয়েন মূল্য Q2 2026",
    question: "২০২৬ সালের জুনের মধ্যে বিটকয়েনের দাম কি $১ লাখ ছাড়াবে?",
    category: "Crypto",
    market_type: "binary",
    status: "active",
    current_stage: "deployment",
    stages_completed: ["template_selection", "parameter_configuration", "liquidity_commitment", "legal_review", "preview_simulation", "deployment"],
    yes_price: 0.68,
    no_price: 0.32,
    liquidity: 5000000,
    trading_fee_percent: 2.0,
    total_volume: 12500000,
    resolution_deadline: "2026-06-30T18:00:00",
    trading_closes_at: "2026-06-29T18:00:00",
    oracle_type: "AI",
    resolution_source: "CoinGecko",
    traders: 2847,
    created_at: "2026-02-20",
    image_url: null,
    risk_score: 25,
    confidence: 91,
    min_trade_amount: 50,
    max_trade_amount: 500000,
    tick_size: 0.01,
    circuit_breaker_enabled: true,
    initial_liquidity: 5000000,
 },
  {
    id: "mkt-002",
    event_id: null,
    event_name: null,
    question: "নতুন মার্কেট (Untitled Market)",
    category: "Politics",
    market_type: "binary",
    status: "draft",
    current_stage: "parameter_configuration",
    stages_completed: ["template_selection"],
    yes_price: 0.50,
    no_price: 0.50,
    liquidity: 0,
    trading_fee_percent: 2.5,
    total_volume: 0,
    resolution_deadline: "2026-12-01T00:00:00",
    trading_closes_at: "2026-11-30T00:00:00",
    oracle_type: "MANUAL",
    resolution_source: "Bangladesh Election Commission",
    traders: 0,
    created_at: "2026-02-26",
    image_url: null,
    risk_score: 72,
    confidence: 0,
 },
  {
    id: "mkt-003",
    event_id: "evt-001",
    event_name: "BPL 2026 ফাইনাল",
    question: "BPL 2026 ফাইনালে কোন দল জিতবে?",
    category: "Sports",
    market_type: "multi_outcome",
    status: "draft",
    current_stage: "liquidity_commitment",
    stages_completed: ["template_selection", "parameter_configuration"],
    yes_price: 0.55,
    no_price: 0.45,
    liquidity: 0,
    trading_fee_percent: 2.0,
    total_volume: 0,
    resolution_deadline: "2026-03-16T00:00:00",
    trading_closes_at: "2026-03-14T18:00:00",
    oracle_type: "MANUAL",
    resolution_source: "BPL Official",
    traders: 0,
    created_at: "2026-02-27",
    image_url: null,
    risk_score: 18,
    confidence: 0,
 },
  {
    id: "mkt-004",
    event_id: null,
    event_name: null,
    question: "২০২৬ সালের বর্ষা মৌসুমে ঢাকায় বন্যা হবে কি?",
    category: "Categorical",
    market_type: "binary",
    status: "pending_review",
    current_stage: "legal_review",
    stages_completed: ["template_selection", "parameter_configuration", "liquidity_commitment"],
    yes_price: 0.42,
    no_price: 0.58,
    liquidity: 100000,
    trading_fee_percent: 1.5,
    total_volume: 0,
    resolution_deadline: "2026-09-30T00:00:00",
    trading_closes_at: "2026-09-15T00:00:00",
    oracle_type: "MULTI",
    resolution_source: "Bangladesh Meteorological Department",
    traders: 0,
    created_at: "2026-02-25",
    image_url: null,
    risk_score: 45,
    confidence: 78,
 },
];

//─── Components ──────────────────────────────────────────────────────────────

function CategoryBadge({category}: {category: string}) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  return (
    <Badge
      variant="outline"
      className="gap-1 font-medium text-xs bg-muted/30 border-muted-foreground/20"
      style={{
        borderColor: `${meta.color}40`,
        color: meta.color,
     }}
    >
      <span>{meta.icon}</span>
      <span>{category}</span>
    </Badge>
  );
}

function StatusBadge({status}: {status: string}) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className="gap-1 font-semibold text-xs bg-muted/20"
      style={{
        borderColor: `${meta.color}40`,
        color: meta.color,
     }}
    >
      <Icon className="w-3 h-3"/>
      <span>{meta.label}</span>
    </Badge>
  );
}

function StageProgress({completed, current}: {completed: string[]; current: string}) {
  const currentIdx = STAGES.findIndex((s) => s.id === current);

  return (
    <div className="relative flex items-center justify-between w-full px-2 py-4">
      {/* Connecting Line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 z-0 mx-8">
        <motion.div
          initial={{width: 0}}
          animate={{width: `${(Math.max(0, currentIdx)/(STAGES.length-1)) * 100}%`}}
          className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
       />
      </div>

      {STAGES.map((stage, i) => {
        const isDone = completed?.includes(stage.id);
        const isCurrent = stage.id === current;
        const isPending = i > currentIdx;

        return (
          <div key={stage.id} className="relative z-10 flex flex-col items-center group">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{scale: 1.1}}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 cursor-help
                      ${isDone
                        ? "bg-green-500 border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        : isCurrent
                          ? "bg-blue-600 border-blue-400 text-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                          : "bg-slate-900 border-slate-700 text-slate-500"
                     }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4"/>
                    ) : (
                      i + 1
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-slate-200">
                  <p className="font-semibold text-xs">{stage.full}</p>
                  <p className="text-[10px] text-slate-400">
                    {isDone ? "সম্পন্ন" : isCurrent ? "চলমান" : "অপেক্ষমান"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span
              className={`text-[9px] mt-2 font-medium transition-colors duration-300 whitespace-nowrap hidden sm:block
                ${isDone
                  ? "text-green-500"
                  : isCurrent
                    ? "text-blue-400"
                    : "text-slate-600"
               }`}
            >
              {stage.short}
            </span>
          </div>
        );
     })}
    </div>
  );
}

function RiskMeter({score}: {score: number}) {
  const color = getRiskColor(score);
  const label = getRiskLabel(score);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{width: 0}}
                animate={{width: `${score}% `}}
                transition={{duration: 0.5, ease: "easeOut"}}
                className={`h-full rounded-full ${score < 30 ? "bg-green-500" : score < 60 ? "bg-amber-500" : "bg-red-500"
                 } `}
             />
            </div>
            <span className={`text-[10px] font-medium ${score < 30 ? "text-green-400" : score < 60 ? "text-amber-400" : "text-red-400"
             } `}>
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">ঝুঁকি স্কোর: {score}/100</p>
          <p className="text-[10px] text-muted-foreground">
            {score < 30
              ? "অটো-অ্যাপ্রুভ যোগ্য"
              : score < 60
                ? "ম্যানুয়াল রিভিউ প্রয়োজন"
                : "আইনি পর্যালোচনা বাধ্যতামূলক"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PriceIndicator({yesPrice, noPrice}: {yesPrice: number; noPrice: number}) {
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500"/>
        <span className="text-xs font-semibold text-green-400">{yesPercent}¢</span>
      </div>
      <div className="w-px h-3 bg-slate-700"/>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500"/>
        <span className="text-xs font-semibold text-red-400">{noPercent}¢</span>
      </div>
    </div>
  );
}

//─── Market Config Panel ─────────────────────────────────────────────────────

function MarketConfigPanel({
  market,
  onClose,
  onSave,
}: {
  market: Market;
  onClose: () => void;
  onSave: (market: Market) => void;
}) {
  const [activeTab, setActiveTab] = useState("basics");
  const [editedMarket, setEditedMarket] = useState<Market>({...market});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{outcome: string, confidence: number, reasoning: string} | null>(null);
  const {toast} = useToast();

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiResult(null);
    try {
      const response = await fetch("/api/admin/oracle", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({market_id: market.id}),
     });

      const {data, error} = await response.json();
      if (error) throw new Error(error);

      setAiResult({
        outcome: data.final_outcome,
        confidence: data.final_confidence,
        reasoning: data.explanation_output?.reasoning || "No reasoning provided.",
     });

      toast({
        title: "AI ফলাফল তৈরি হয়েছে",
        description: `প্রস্তাবিত ফলাফল: ${data.final_outcome} (${data.final_confidence}%)`,
     });
   } catch (error: any) {
      console.error("AI Generation error:", error);
      toast({
        title: "AI ফলাফল তৈরি করা যায়নি",
        description: error.message,
        variant: "destructive",
     });
   } finally {
      setIsGeneratingAI(false);
   }
 };

  const tabs = [
    {id: "basics", label: "মূল তথ্য", icon: "📋"},
    {id: "trading", label: "ট্রেডিং", icon: "📊"},
    {id: "resolution", label: "সমাধান", icon: "⚖️"},
    {id: "liquidity", label: "তারল্য", icon: "💧"},
    {id: "risk", label: "ঝুঁকি", icon: "🛡️"},
 ];

  const catMeta = CATEGORY_META[market.category] || CATEGORY_META.Other;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSave(editedMarket);
    setIsSaving(false);
 };

  const updateField = (field: keyof Market, value: any) => {
    setEditedMarket((prev) => ({...prev, [field]: value}));
 };

  return (
    <motion.div
      initial={{x: "100%"}}
      animate={{x: 0}}
      exit={{x: "100%"}}
      transition={{type: "spring", damping: 25, stiffness: 200}}
      className="fixed right-0 top-0 bottom-0 w-[500px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <div className="flex gap-3 items-center mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
                style={{
                  backgroundColor: catMeta.bg,
                  borderColor: `${catMeta.color} 30`,
               }}
              >
                {catMeta.icon}
              </div>
              <div>
                <CategoryBadge category={market.category}/>
                <div className="flex gap-2 mt-1.5">
                  <StatusBadge status={market.status}/>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {market.id}
                  </span>
                </div>
              </div>
            </div>
            <h2 className="text-slate-100 text-base font-semibold leading-snug">
              {market.question}
            </h2>
            {market.event_name && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400"/>
                <span className="text-blue-400">ইভেন্ট:</span>
                <span>{market.event_name}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-slate-200"
          >
            <XCircle className="w-5 h-5"/>
          </Button>
        </div>

        <div className="mt-4">
          <StageProgress
            completed={market.stages_completed}
            current={market.current_stage}
         />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/30">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors border-b-2 ${activeTab === t.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
             } `}
          >
            <div className="text-base mb-0.5">{t.icon}</div>
            <div>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-5">
        <AnimatePresence mode="wait">
          {activeTab === "basics" && (
            <motion.div
              key="basics"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className="space-y-4"
            >
              <ConfigField
                label="মার্কেট প্রশ্ন"
                value={editedMarket.question}
                onChange={(v) => updateField("question", v)}
                editable
                multiline
             />

              <div className="grid grid-cols-2 gap-4">
                <ConfigField
                  label="মার্কেট ধরন"
                  value={editedMarket.market_type}
                  onChange={(v) => updateField("market_type", v)}
                  editable
                  type="select"
                  options={[
                    {value: "binary", label: "বাইনারি (YES/NO)"},
                    {value: "multi_outcome", label: "মাল্টি-আউটকাম"},
                    {value: "scalar", label: "স্কেলার"},
                 ]}
               />
                <ConfigField
                  label="ক্যাটাগরি"
                  value={editedMarket.category}
                  onChange={(v) => updateField("category", v)}
                  editable
                  type="select"
                  options={Object.keys(CATEGORY_META).map((k) => ({
                    value: k,
                    label: `${CATEGORY_META[k].icon} ${k} `,
                 }))}
               />
              </div>

              <ConfigField
                label="ওরাকল ধরন"
                value={editedMarket.oracle_type}
                onChange={(v) => updateField("oracle_type", v)}
                editable
                type="select"
                options={Object.entries(ORACLE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
               }))}
             />

              <ConfigField
                label="রেজোলিউশন সোর্স"
                value={editedMarket.resolution_source}
                onChange={(v) => updateField("resolution_source", v)}
                editable
             />

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-500 mb-3">লিংকড ইভেন্ট</div>
                {editedMarket.event_name ? (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-sm flex items-center gap-2">
                      <LinkIcon className="w-4 h-4"/>
                      {editedMarket.event_name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 text-xs h-7"
                      onClick={() => {
                        updateField("event_id", null);
                        updateField("event_name", null);
                     }}
                    >
                      আনলিংক
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2"/>
                    ইভেন্টের সাথে লিংক করুন
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "trading" && (
            <motion.div
              key="trading"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="ট্রেডিং ফি %"
                  value={editedMarket.trading_fee_percent}
                  onChange={(v) => updateField("trading_fee_percent", v)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  suffix="%"
               />
                <NumberField
                  label="টিক সাইজ"
                  value={editedMarket.tick_size || 0.01}
                  onChange={(v) => updateField("tick_size", v)}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  suffix="¢"
               />
                <NumberField
                  label="মিনিমাম ট্রেড"
                  value={editedMarket.min_trade_amount || 10}
                  onChange={(v) => updateField("min_trade_amount", v)}
                  min={1}
                  suffix="৳"
               />
                <NumberField
                  label="ম্যাক্সিমাম ট্রেড"
                  value={editedMarket.max_trade_amount || 100000}
                  onChange={(v) => updateField("max_trade_amount", v)}
                  min={1000}
                  suffix="৳"
               />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-500 mb-3">বর্তমান মূল্য</div>
                <PriceIndicator yesPrice={editedMarket.yes_price} noPrice={editedMarket.no_price}/>
              </div>

              <DateField
                label="ট্রেডিং বন্ধের সময়"
                value={editedMarket.trading_closes_at}
                onChange={(v) => updateField("trading_closes_at", v)}
             />

              <ToggleField
                label="মার্কেট সার্কিট ব্রেকার"
                subtext="৫ মিনিটে >10% দাম পরিবর্তনে স্বয়ংক্রিয় বিরতি"
                checked={editedMarket.circuit_breaker_enabled ?? true}
                onChange={(v) => updateField("circuit_breaker_enabled", v)}
             />

              <ToggleField
                label="স্লিপেজ সুরক্ষা"
                subtext="৩% এর বেশি স্লিপেজে সতর্কতা"
                checked={true}
                onChange={() => {}}
             />
            </motion.div>
          )}

          {activeTab === "resolution" && (
            <motion.div
              key="resolution"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className="space-y-4"
            >
              <SelectField
                label="রেজোলিউশন পদ্ধতি"
                value={editedMarket.oracle_type}
                onChange={(v) => updateField("oracle_type", v)}
                options={[
                  {value: "MANUAL", label: "ম্যানুয়াল (অ্যাডমিন)"},
                  {value: "AI", label: "AI ওরাকল (Vertex/Kimi)"},
                  {value: "CHAINLINK", label: "Chainlink ফিড"},
                  {value: "UMA", label: "UMA অপটিমিস্টিক"},
                  {value: "MULTI", label: "মাল্টি-সোর্স"},
               ]}
             />

              <ConfigField
                label="প্রাথমিক সোর্স"
                value={editedMarket.resolution_source}
                onChange={(v) => updateField("resolution_source", v)}
                editable
             />

              <ConfigField
                label="ব্যাকআপ সোর্স"
                value={editedMarket.resolution_source || ""}
                onChange={() => {}}
                editable
                placeholder="ব্যাকআপ সোর্স যোগ করুন..."
             />

              <NumberField
                label="কনফিডেন্স থ্রেশোল্ড %"
                value={editedMarket.confidence || 80}
                onChange={(v) => updateField("confidence", v)}
                min={50}
                max={100}
                suffix="%"
             />

              <DateField
                label="রেজোলিউশন ডেডলাইন"
                value={editedMarket.resolution_deadline}
                onChange={(v) => updateField("resolution_deadline", v)}
             />

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400"/>
                    AI রেজোলিউশন অ্যাসিস্ট্যান্ট
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateAI}
                    className="h-8 bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                  >
                    {isGeneratingAI ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin"/>
                    ) : (
                      <Zap className="w-3.5 h-3.5 mr-2"/>
                    )}
                    ফলাফল জেনারেট করুন
                  </Button>
                </div>

                {aiResult ? (
                  <motion.div
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: "auto"}}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">প্রস্তাবিত আউটকাম:</span>
                      <Badge className={aiResult.outcome === "YES" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                        {aiResult.outcome}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">কনফিডেন্স স্কোর:</span>
                      <span className={aiResult.confidence >= 90 ? "text-emerald-400" : "text-amber-400"}>
                        {aiResult.confidence}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 leading-relaxed italic border-t border-slate-700 pt-2">
                      "{aiResult.reasoning}"
                    </div>
                    {aiResult.confidence >= 90 && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-500/80">
                        <CheckCircle2 className="w-3 h-3"/>
                        অটো-রেজোলিউশন থ্রেশোল্ড পার হয়েছে
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-[11px] text-slate-500 text-center py-2 border border-dashed border-slate-800 rounded-lg">
                    AI ফলাফল জেনারেট করতে উপরের বাটনে ক্লিক করুন
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-500 mb-3">এজ কেস হ্যান্ডলিং</div>
                <SelectField
                  label="টাই হলে"
                  value="NO"
                  onChange={() => {}}
                  options={[
                    {value: "NO", label: "NO জেতে"},
                    {value: "YES", label: "YES জেতে"},
                    {value: "refund", label: "রিফান্ড"},
                 ]}
               />
                <div className="mt-3">
                  <SelectField
                    label="বাতিল হলে"
                    value="refund"
                    onChange={() => {}}
                    options={[
                      {value: "refund", label: "সম্পূর্ণ রিফান্ড"},
                      {value: "extend", label: "ডেডলাইন বাড়ানো"},
                   ]}
                 />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "liquidity" && (
            <motion.div
              key="liquidity"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className="space-y-4"
            >
              <div
                className={`p-4 rounded-xl border ${(editedMarket.liquidity || 0) > 0
                    ? "bg-green-500/5 border-green-500/30"
                    : "bg-red-500/5 border-red-500/30"
                 } `}
              >
                <div className="text-xs text-slate-500 mb-1">বর্তমান তারল্য পুল</div>
                <div
                  className={`text-3xl font-bold ${(editedMarket.liquidity || 0) > 0 ? "text-green-500" : "text-red-500"
                   } `}
                >
                  {formatBDT(editedMarket.liquidity || 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  মিনিমাম ৳10,000 প্রয়োজন
                </div>
              </div>

              <NumberField
                label="প্রাথমিক তারল্য"
                value={editedMarket.initial_liquidity || 10000}
                onChange={(v) => updateField("initial_liquidity", v)}
                min={10000}
                suffix="৳"
             />

              <SelectField
                label="তারল্য সোর্স"
                value={editedMarket.liquidity_source || "platform"}
                onChange={(v) => updateField("liquidity_source", v)}
                options={[
                  {value: "platform", label: "প্ল্যাটফর্ম ট্রেজারি"},
                  {value: "creator", label: "মার্কেট ক্রিয়েটর"},
                  {value: "amm", label: "AMM বুটস্ট্র্যাপ"},
               ]}
             />

              <NumberField
                label="LP ফি শেয়ার %"
                value={50}
                onChange={() => {}}
                min={0}
                max={100}
                suffix="%"
             />

              <ToggleField
                label="অটো-রিব্যালেন্সিং"
                subtext="50/50 YES/NO ব্যালেন্স বজায় রাখুন"
                checked={true}
                onChange={() => {}}
             />
            </motion.div>
          )}

          {activeTab === "risk" && (
            <motion.div
              key="risk"
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-xs text-slate-500 mb-3">ঝুঁকি স্কোর</div>
                <div className="flex items-center gap-4">
                  <div
                    className="text-4xl font-bold"
                    style={{color: getRiskColor(editedMarket.risk_score)}}
                  >
                    {editedMarket.risk_score}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{width: 0}}
                        animate={{width: `${editedMarket.risk_score}% `}}
                        className="h-full rounded-full"
                        style={{backgroundColor: getRiskColor(editedMarket.risk_score)}}
                     />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1.5">
                      {editedMarket.risk_score < 30
                        ? "নিরাপদ — অটো-অ্যাপ্রুভ যোগ্য"
                        : editedMarket.risk_score < 60
                          ? "মাঝারি — ম্যানুয়াল রিভিউ প্রয়োজন"
                          : "উচ্চ ঝুঁকি — আইনি পর্যালোচনা বাধ্যতামূলক"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-300 pb-2 border-b border-slate-800">
                কমপ্লায়েন্স চেকলিস্ট
              </div>

              {[
                {
                  label: "বাংলাদেশ সাইবার সিকিউরিটি আইন ২০২৩",
                  pass: editedMarket.risk_score < 70,
               },
                {
                  label: "গেম্বলিং নীতি (স্কিল-বেসড)",
                  pass: true,
               },
                {
                  label: "রাজনৈতিক সংবেদনশীলতা",
                  pass:
                    editedMarket.category !== "Politics" ||
                    editedMarket.risk_score < 50,
               },
                {
                  label: "আর্থিক নিয়মকানুন",
                  pass: editedMarket.risk_score < 60,
               },
             ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-slate-800/50"
                >
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${item.pass
                        ? "border-green-500/50 text-green-400 bg-green-500/10"
                        : "border-red-500/50 text-red-400 bg-red-500/10"
                     } `}
                  >
                    {item.pass ? "✓ পাস" : "✗ ব্যর্থ"}
                  </Badge>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Actions */}
      <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin"/>
          ) : (
            <CheckCircle2 className="w-4 h-4 mr-2"/>
          )}
          সেভ করুন
        </Button>
        {editedMarket.status === "draft" && (
          <Button
            className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white"
            onClick={() => {
              handleSave();
             //Advance stage logic here
           }}
          >
            পরবর্তী ধাপ
            <ChevronRight className="w-4 h-4 ml-2"/>
          </Button>
        )}
        {editedMarket.status === "active" && (
          <Button
            variant="outline"
            className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <Pause className="w-4 h-4 mr-2"/>
            বিরতি দিন
          </Button>
        )}
      </div>
    </motion.div>
  );
}

//─── Form Field Components ───────────────────────────────────────────────────

function ConfigField({
  label,
  value,
  onChange,
  editable,
  multiline,
  type = "text",
  options,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange?: (v: any) => void;
  editable?: boolean;
  multiline?: boolean;
  type?: "text" | "select";
  options?: {value: string; label: string}[];
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
 }, [value]);

  if (!editable) {
    return (
      <div>
        <div className="text-xs text-slate-500 mb-1.5 font-medium">{label}</div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200">
          {value || "—"}
        </div>
      </div>
    );
 }

  if (type === "select" && options) {
    const fieldId = `field-${label.replace(/\s+/g, '-').toLowerCase()} `;
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId} className="text-xs text-slate-500 font-medium">{label}</Label>
        <Select
          value={String(localValue)}
          onValueChange={(v) => {
            setLocalValue(v);
            onChange?.(v);
         }}
        >
          <SelectTrigger id={fieldId} className="bg-slate-900/50 border-slate-800 text-slate-200">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            {options.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
 }

  const fieldId = `field-${label.replace(/\s+/g, '-').toLowerCase()} `;
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-xs text-slate-500 font-medium">{label}</Label>
      {multiline ? (
        <textarea
          id={fieldId}
          value={localValue as string}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange?.(e.target.value);
         }}
          rows={3}
          placeholder={placeholder || label}
          title={label}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 resize-y focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-sans"
       />
      ) : (
        <input
          id={fieldId}
          type="text"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            onChange?.(e.target.value);
         }}
          placeholder={placeholder || label}
          title={label}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
       />
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
 }, [value]);

  const fieldId = `num-${label.replace(/\s+/g, '-').toLowerCase()} `;
  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId} className="text-xs text-slate-500 font-medium">{label}</Label>
      <div className="flex items-center bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
        <input
          id={fieldId}
          type="number"
          value={localValue}
          min={min}
          max={max}
          step={step}
          title={label}
          placeholder={label}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setLocalValue(v);
            onChange?.(v);
         }}
          className="flex-1 bg-transparent border-none text-slate-200 px-3 py-2 text-sm focus:outline-none"
       />
        {suffix && (
          <span className="text-slate-500 text-xs px-3 border-l border-slate-800 bg-slate-900/80 h-full flex items-center">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  options: {value: string; label: string}[];
}) {
  return (
    <div>
      {label && (
        <div className="text-xs text-slate-500 mb-1.5 font-medium">{label}</div>
      )}
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger className="bg-slate-900/50 border-slate-800 text-slate-200 text-sm">
          <SelectValue/>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800">
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              className="text-slate-200 focus:bg-slate-800 focus:text-slate-100"
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
}) {
  const formatted = value ? new Date(value).toISOString().slice(0, 16) : "";

  return (
    <div>
      <div className="text-xs text-slate-500 mb-1.5 font-medium">{label}</div>
      <input
        type="datetime-local"
        value={formatted}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
     />
    </div>
  );
}

function ToggleField({
  label,
  subtext,
  checked,
  onChange,
}: {
  label: string;
  subtext?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
      <div>
        <div className="text-sm text-slate-200 font-medium">{label}</div>
        {subtext && (
          <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange}/>
    </div>
  );
}

//─── Market Card ─────────────────────────────────────────────────────────────

function MarketCard({
  market,
  onConfigure,
  onContinue,
  onDelete,
  onPreview,
}: {
  market: Market;
  onConfigure: (m: Market) => void;
  onContinue: (m: Market) => void;
  onDelete: (id: string) => void;
  onPreview: (m: Market) => void;
}) {
  const catMeta = CATEGORY_META[market.category] || CATEGORY_META.Other;
  const isUntitled =
    market.question?.includes("Untitled") ||
    market.question?.includes("নতুন মার্কেট");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -2}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-5 transition-all duration-200 hover:border-slate-700 hover:shadow-xl hover:shadow-black/20 group"
    >
      {/* Category accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-70"
        style={{backgroundColor: catMeta.color}}
     />

      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
            style={{
              backgroundColor: catMeta.bg,
              borderColor: `${catMeta.color} 25`,
           }}
          >
            {catMeta.icon}
          </div>
          <div>
            <div className="flex gap-2 flex-wrap">
              <CategoryBadge category={market.category}/>
              <StatusBadge status={market.status}/>
              {market.market_type === "multi_outcome" && (
                <Badge
                  variant="outline"
                  className="text-xs border-violet-500/30 text-violet-400 bg-violet-500/10"
                >
                  মাল্টি-আউটকাম
                </Badge>
              )}
            </div>
            {market.event_name && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                <LinkIcon className="w-3 h-3 text-blue-400"/>
                <span className="text-blue-400">ইভেন্ট:</span>
                <span className="truncate max-w-[200px]">{market.event_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  onClick={() => onPreview(market)}
                >
                  <Eye className="w-4 h-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>প্রিভিউ</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                  onClick={() => onConfigure(market)}
                >
                  <Settings className="w-4 h-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>কনফিগার</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => onDelete(market.id)}
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent>মুছুন</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        {isUntitled ? (
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500"/>
            <p className="text-orange-400 text-sm font-medium">
              প্রশ্ন এখনো সেট করা হয়নি
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              onClick={() => onConfigure(market)}
            >
              এখনই সেট করুন →
            </Button>
          </div>
        ) : (
          <h3 className="text-slate-100 text-[15px] font-semibold leading-snug line-clamp-2">
            {market.question}
          </h3>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <StatBox
          icon={Droplets}
          label="তারল্য"
          value={formatBDT(market.liquidity)}
          warn={market.liquidity === 0}
       />
        <StatBox
          icon={BarChart3}
          label="ভলিউম"
          value={formatBDT(market.total_volume)}
       />
        <StatBox
          icon={Users}
          label="ট্রেডার"
          value={`${formatNumber(market.traders)} +`}
       />
        <StatBox
          icon={Percent}
          label="ফি"
          value={`${market.trading_fee_percent}% `}
       />
      </div>

      {/* Price & Deadline */}
      <div className="flex items-center justify-between mb-4">
        <PriceIndicator yesPrice={market.yes_price} noPrice={market.no_price}/>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5"/>
          <span>{timeUntil(market.trading_closes_at)}</span>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            কোয়ালিটি গেট প্রগ্রেস
          </span>
          <span className="text-[10px] text-slate-400">
            {market.stages_completed?.length || 0}/{STAGES.length} সম্পূর্ণ
          </span>
        </div>
        <StageProgress
          completed={market.stages_completed}
          current={market.current_stage}
       />
      </div>

      {/* Bottom: Risk & Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <RiskMeter score={market.risk_score}/>
          {market.confidence > 0 && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3"/>
              AI {market.confidence}% আস্থা
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {market.status === "draft" && (
            <Button
              size="sm"
              onClick={() => onContinue(market)}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs h-8"
            >
              চালিয়ে যান
              <ChevronRight className="w-3.5 h-3.5 ml-1"/>
            </Button>
          )}
          {market.status === "pending_review" && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
            >
              পর্যালোচনা করুন
            </Button>
          )}
          {market.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10 text-xs h-8"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5"/>
              লাইভ ড্যাশবোর্ড
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: any;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-800/50">
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div
        className={`text-xs font-bold flex items-center gap-1 ${warn ? "text-orange-400" : "text-slate-300"
         } `}
      >
        <Icon className="w-3 h-3 opacity-70"/>
        {value}
      </div>
    </div>
  );
}

//─── Events Panel ────────────────────────────────────────────────────────────

function EventsReadyPanel({
  events,
  onCreateMarket,
}: {
  events: Event[];
  onCreateMarket: (evt: Event) => void;
}) {
  const unlinked = events.filter((e) => !e.hasMarket && e.status === "active");
  if (unlinked.length === 0) return null;

  return (
    <motion.div
      initial={{opacity: 0, height: 0}}
      animate={{opacity: 1, height: "auto"}}
      exit={{opacity: 0, height: 0}}
      className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20"
    >
      <div className="flex items-center gap-2 mb-3 text-blue-400 text-sm font-semibold">
        <motion.div
          animate={{scale: [1, 1.2, 1]}}
          transition={{duration: 1.5, repeat: Infinity}}
          className="w-2 h-2 rounded-full bg-blue-500"
       />
        <span>
          {unlinked.length}টি পাবলিশড ইভেন্টে মার্কেট নেই — মার্কেট তৈরি করুন
        </span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {unlinked.map((evt) => {
          const cat = CATEGORY_META[evt.category] || CATEGORY_META.Other;
          return (
            <motion.div
              key={evt.id}
              whileHover={{scale: 1.02}}
              className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex-1 min-w-[280px]"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{backgroundColor: cat.bg}}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200 font-medium truncate">
                  {evt.name}
                </div>
                <div className="text-xs text-slate-500">
                  {evt.event_date} · {evt.category}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onCreateMarket(evt)}
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs h-8 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1"/>
                মার্কেট তৈরি
              </Button>
            </motion.div>
          );
       })}
      </div>
    </motion.div>
  );
}

//─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminMarketDashboard() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [configuring, setConfiguring] = useState<Market | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {toast} = useToast();
  const supabase = createClient();

  const fetchMarkets = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const {data, error} = await supabase
        .from("markets")
        .select(`
  *,
  events:title
    `)
        .order("created_at", {ascending: false});

      if (error) throw error;

      const formattedMarkets: Market[] = (data || []).map((m: any) => ({
        ...m,
        event_name: m.events?.title || m.event_name,
     }));

      setMarkets(formattedMarkets);
   } catch (error) {
      console.error("Error fetching markets:", error);
      toast({
        title: "মার্কেট লোড করা যায়নি",
        variant: "destructive",
     });
   } finally {
      setIsLoading(false);
      setIsRefreshing(false);
   }
 }, [supabase, toast]);

  useEffect(() => {
    fetchMarkets();
 }, [fetchMarkets]);

  const stats = useMemo(() => ({
    total: markets.length,
    draft: markets.filter((m) => m.status === "draft").length,
    pending: markets.filter((m) => m.status === "pending_review").length,
    active: markets.filter((m) => m.status === "active").length,
    rejected: markets.filter((m) => m.status === "rejected").length,
 }), [markets]);

  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      const matchTab =
        activeTab === "all" ||
        (activeTab === "live" && m.status === "active") ||
        (activeTab === "drafts" && m.status === "draft") ||
        (activeTab === "review" && m.status === "pending_review");
      return matchSearch && matchStatus && matchTab;
   });
 }, [markets, searchQuery, statusFilter, activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি এই মার্কেটটি মুছে ফেলতে চান?")) return;

    try {
      const {error} = await supabase.from("markets").delete().eq("id", id);
      if (error) throw error;

      setMarkets((ms) => ms.filter((m) => m.id !== id));
      toast({
        title: "মার্কেট মুছে ফেলা হয়েছে",
        description: "মার্কেট সফলভাবে ডিলিট করা হয়েছে।",
     });
   } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "ডিলিট করা সম্ভব হয়নি",
        variant: "destructive",
     });
   }
 };

  const handleCreateFromEvent = async (evt: any) => {
    try {
      const newMarketData = {
        event_id: evt.id,
        question: `${evt.name} সংক্রান্ত প্রশ্ন`,
        category: evt.category || "Other",
        market_type: "binary",
        status: "draft",
        current_stage: "template_selection",
        stages_completed: [],
        yes_price: 0.5,
        no_price: 0.5,
        liquidity: 0,
        trading_fee_percent: 2.0,
        total_volume: 0,
        resolution_deadline: evt.event_date ? `${evt.event_date} T18:00:00` : new Date().toISOString(),
        trading_closes_at: evt.event_date ? `${evt.event_date} T17:00:00` : new Date().toISOString(),
        oracle_type: "MANUAL",
        resolution_source: "",
     };

      const {data, error} = await supabase
        .from("markets")
        .insert(newMarketData)
        .select()
        .single();

      if (error) throw error;

      const createdMarket = {...data, event_name: evt.name};
      setMarkets((ms) => [createdMarket, ...ms]);
      setConfiguring(createdMarket);

      toast({
        title: "✅ মার্কেট তৈরি শুরু হয়েছে",
        description: `"${evt.name}" ইভেন্টের জন্য নতুন মার্কেট তৈরি করা হয়েছে।`,
     });
   } catch (error) {
      console.error("Market creation error:", error);
      toast({
        title: "মার্কেট তৈরি সম্ভব হয়নি",
        variant: "destructive",
     });
   }
 };

  const handleSaveMarket = async (updatedMarket: Market) => {
    try {
      const {error} = await supabase
        .from("markets")
        .update({
          question: updatedMarket.question,
          category: updatedMarket.category,
          status: updatedMarket.status,
          current_stage: updatedMarket.current_stage,
          stages_completed: updatedMarket.stages_completed,
          trading_fee_percent: updatedMarket.trading_fee_percent,
          tick_size: updatedMarket.tick_size,
          min_trade_amount: updatedMarket.min_trade_amount,
          max_trade_amount: updatedMarket.max_trade_amount,
          trading_closes_at: updatedMarket.trading_closes_at,
          oracle_type: updatedMarket.oracle_type,
          resolution_source: updatedMarket.resolution_source,
          initial_liquidity: updatedMarket.initial_liquidity,
          risk_score: updatedMarket.risk_score,
       })
        .eq("id", updatedMarket.id);

      if (error) throw error;

      setMarkets((ms) =>
        ms.map((m) => (m.id === updatedMarket.id ? updatedMarket : m))
      );
      toast({
        title: "সেভ হয়েছে",
        description: "মার্কেট কনফিগারেশন সফলভাবে সেভ করা হয়েছে।",
     });
   } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "সেভ করা সম্ভব হয়নি",
        variant: "destructive",
     });
   }
 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                মার্কেট ব্যবস্থাপনা
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Market Creation & Quality Gate Management
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white gap-2">
              <Sparkles className="w-4 h-4"/>
              নতুন মার্কেট তৈরি করুন
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              {label: "মোট মার্কেট", value: stats.total, color: "slate", icon: BarChart3},
              {label: "খসড়া", value: stats.draft, color: "gray", icon: Minus},
              {label: "পর্যালোচনা মুলতুবি", value: stats.pending, color: "amber", icon: Clock},
              {label: "লাইভ মার্কেট", value: stats.active, color: "green", icon: Play},
              {label: "প্রত্যাখ্যাত", value: stats.rejected, color: "red", icon: XCircle},
           ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
              >
                <div className={`p-2 rounded-lg bg-${s.color} -500/10`}>
                  <s.icon className={`w-5 h-5 text-${s.color} -400`}/>
                </div>
                <div>
                  <div className={`text-2xl font-bold text-${s.color} -400`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
              {[
                {id: "all", label: "সব মার্কেট", count: stats.total},
                {id: "live", label: "লাইভ", count: stats.active},
                {id: "drafts", label: "খসড়া", count: stats.draft},
                {id: "review", label: "পর্যালোচনা", count: stats.pending},
             ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2"
                >
                  {tab.label}
                  <Badge
                    variant="secondary"
                    className="bg-slate-800 text-slate-400 text-[10px]"
                  >
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        {/* Dash Board Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <EventsReadyPanel events={[]} onCreateMarket={handleCreateFromEvent}/>

            {/* Real Events linking panel for more detailed control */}
            <div className="mt-4">
              <EventLinkingPanel onSelectEvent={handleCreateFromEvent}/>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-400"/>
                কুইক অ্যাকশন
              </h3>
              <div className="space-y-2">
                <Button className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 h-10">
                  <Plus className="w-4 h-4 mr-2"/>
                  নতুন ইভেন্ট তৈরি করুন
                </Button>
                <Button
                  onClick={fetchMarkets}
                  disabled={isRefreshing}
                  className="w-full justify-start bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700 h-10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''} `}/>
                  রিফ্রেশ করুন
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মার্কেট, ইভেন্ট বা ক্যাটাগরি খুঁজুন..."
              className="pl-10 bg-slate-900/50 border-slate-800 text-slate-200 placeholder:text-slate-500"
           />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800 text-slate-200">
              <Filter className="w-4 h-4 mr-2"/>
              <SelectValue placeholder="সকল স্ট্যাটাস"/>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
              <SelectItem value="draft">খসড়া</SelectItem>
              <SelectItem value="pending_review">পর্যালোচনা মুলতুবি</SelectItem>
              <SelectItem value="active">লাইভ</SelectItem>
              <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Market Grid */}
        {filteredMarkets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-300">
              কোনো মার্কেট পাওয়া যায়নি
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              অন্য ফিল্টার ব্যবহার করুন বা নতুন মার্কেট তৈরি করুন
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onConfigure={setConfiguring}
                  onContinue={setConfiguring}
                  onDelete={handleDelete}
                  onPreview={(m) =>
                    toast({
                      title: "🔍 প্রিভিউ",
                      description: `"${m.question.slice(0, 40)}..." প্রিভিউ খুলছে`,
                   })
                 }
               />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Config Panel Overlay */}
      <AnimatePresence>
        {configuring && (
          <>
            <motion.div
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              onClick={() => setConfiguring(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
           />
            <MarketConfigPanel
              market={configuring}
              onClose={() => setConfiguring(null)}
              onSave={handleSaveMarket}
           />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
