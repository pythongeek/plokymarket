// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, Trash2, ChevronRight, Clock, TrendingUp, Users,
  BarChart3, RefreshCw, MoreHorizontal, Play, Pause,
  CheckCircle2, XCircle, AlertTriangle, Edit2, Gavel, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Market {
  id: string; slug: string; status: string;
  title: string; question: string; description: string;
  category: string; subcategory: string; tags: any;
  image_url: string | null; is_featured: boolean;
  trading_closes_at: string | null; event_date: string | null;
  current_yes_price: number; current_no_price: number;
  total_volume: number; volume_24h: number; liquidity: number;
  unique_traders: number; resolution_method: string;
  resolved_at: string | null; winning_outcome: string | null;
  event_id: string | null; creator_id: string | null;
  created_at: string; answer_type: string;
  source_url: string | null; event_answer_type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META = {
  sports:      { color: "#22c55e", icon: "⚽" },
  crypto:     { color: "#f59e0b", icon: "₿"  },
  politics:   { color: "#ef4444", icon: "🗳️" },
  finance:    { color: "#3b82f6", icon: "📈" },
  entertainment: { color: "#a855f7", icon: "🎬" },
  technology: { color: "#06b6d4", icon: "💻" },
  other:      { color: "#64748b", icon: "📋" },
};

const STATUS_CONFIG = {
  draft:     { label: "Draft",    color: "#94a3b8", icon: AlertTriangle },
  active:    { label: "Active",   color: "#22c55e", icon: Play },
  paused:    { label: "Paused",   color: "#f59e0b", icon: Pause },
  closed:    { label: "Closed",   color: "#6b7280", icon: X },
  resolved:  { label: "Resolved", color: "#3b82f6", icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",color: "#ef4444", icon: XCircle },
  disputed:  { label: "Disputed", color: "#ef4444", icon: AlertTriangle },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatVolume(n) {
  if (!n) return "0";
  if (n >= 1e7) return (n / 1e7).toFixed(1) + "Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(1) + "L";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

function timeLeft(d) {
  if (!d) return "—";
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  if (days > 30) return Math.floor(days / 30) + "mo left";
  if (days > 0) return days + "d left";
  const hrs = Math.floor((diff % 86400000) / 3600000);
  return hrs + "h left";
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function fetchMarkets(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch("/api/admin/markets?" + params);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

async function createMarket(data) {
  const res = await fetch("/api/admin/markets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function updateMarket(id, data) {
  const res = await fetch("/api/admin/markets/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteMarket(id) {
  await fetch("/api/admin/markets/" + id, { method: "DELETE" });
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────

function MarketDialog({ open, onClose, onSaved, editMarket }) {
  const [form, setForm] = useState({
    title: "", question: "", description: "",
    category: "general", tags: "", image_url: "",
    source_url: "", trading_closes_at: "", event_date: "",
    is_featured: false, initial_liquidity: "1000",
    answer_type: "binary", resolution_method: "manual_admin",
    publish_status: "draft", starts_at: "",
    answers: ["YES", "NO"],
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editMarket) {
      setForm({
        title: editMarket.title || editMarket.question || "",
        question: editMarket.question || "",
        description: editMarket.description || "",
        category: (editMarket.category || "general").toLowerCase(),
        tags: Array.isArray(editMarket.tags) ? editMarket.tags.join(", ") : "",
        image_url: editMarket.image_url || "",
        source_url: editMarket.source_url || "",
        trading_closes_at: editMarket.trading_closes_at ? new Date(editMarket.trading_closes_at).toISOString().slice(0, 16) : "",
        event_date: editMarket.event_date ? new Date(editMarket.event_date).toISOString().slice(0, 16) : "",
        is_featured: editMarket.is_featured || false,
        initial_liquidity: "1000",
        answer_type: editMarket.answer_type || "binary",
        resolution_method: editMarket.resolution_method || "manual_admin",
        publish_status: editMarket.publish_status || "draft",
        starts_at: editMarket.starts_at ? new Date(editMarket.starts_at).toISOString().slice(0, 16) : "",
        answers: editMarket.answer_type === 'multi_choice' && editMarket.answers
          ? editMarket.answers
          : [editMarket.answer1 || "YES", editMarket.answer2 || "NO"],
      });
    } else {
      setForm({ title: "", question: "", description: "", category: "general", tags: "", image_url: "", source_url: "", trading_closes_at: "", event_date: "", is_featured: false, initial_liquidity: "1000", answer_type: "binary", resolution_method: "manual_admin", publish_status: "draft", starts_at: "", answers: ["YES", "NO"] });
    }
  }, [editMarket, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        answer1: form.answers[0] || "YES",
        answer2: form.answers[1] || "NO",
        answer3: form.answers[2] || null,
        answer4: form.answers[3] || null,
      };
      let ok;
      if (editMarket) { const r = await updateMarket(editMarket.id, payload); ok = r.success; }
      else { const r = await createMarket(payload); ok = r.success; }
      if (ok) { toast({ title: editMarket ? "Market updated" : "Market created" }); onSaved(); onClose(); }
      else { toast({ title: "Error", description: "Failed to save market.", variant: "destructive" }); }
    } finally { setLoading(false); }
  };

  const field = (id) => (e) => setForm(f => ({ ...f, [id]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1e] border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-100">{editMarket ? "Edit Market" : "Create New Market"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-slate-400 text-xs uppercase">Event Title *</Label>
              <Input value={form.title} onChange={field("title")} placeholder="e.g. Bangladesh wins the toss" className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" required />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-400 text-xs uppercase">Question (Market Question) *</Label>
              <Input value={form.question} onChange={field("question")} placeholder="Will Bangladesh win the toss?" className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" required />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-400 text-xs uppercase">Description</Label>
              <textarea value={form.description} onChange={field("description")} rows={3}
                placeholder="Background context for this event..."
                className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 mt-1 rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Category</Label>
              <select value={form.category} onChange={field("category")}
                className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 mt-1 rounded-md px-3 py-2 text-sm">
                <option value="sports">Sports</option><option value="crypto">Crypto</option>
                <option value="politics">Politics</option><option value="finance">Finance</option>
                <option value="entertainment">Entertainment</option><option value="technology">Technology</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Resolution Method</Label>
              <select value={form.resolution_method} onChange={field("resolution_method")}
                className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 mt-1 rounded-md px-3 py-2 text-sm">
                <option value="manual_admin">Manual / Admin</option>
                <option value="ai_oracle">AI Oracle</option>
                <option value="expert_panel">Expert Panel</option>
                <option value="external_api">External API</option>
                <option value="community_vote">Community Vote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Publish Status</Label>
              <select value={form.publish_status} onChange={field("publish_status")}
                className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 mt-1 rounded-md px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active Now</option>
              </select>
            </div>
            {form.publish_status === 'scheduled' && (
              <div>
                <Label className="text-slate-400 text-xs uppercase">Publish At (Starts)</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={field("starts_at")}
                  className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
              </div>
            )}
            <div>
              <Label className="text-slate-400 text-xs uppercase">Answer Type</Label>
              <select value={form.answer_type} onChange={e => {
                const val = e.target.value;
                setForm(f => ({
                  ...f,
                  answer_type: val,
                  answers: val === 'multi_choice' ? ['Option 1', 'Option 2', 'Option 3'] : ['YES', 'NO']
                }));
              }}
                className="w-full bg-slate-900/60 border border-slate-700 text-slate-100 mt-1 rounded-md px-3 py-2 text-sm">
                <option value="binary">Binary (Yes/No)</option>
                <option value="multi_choice">Multi-Choice (3+ options)</option>
              </select>
            </div>
            {form.answer_type === 'multi_choice' && (
              <div className="col-span-2">
                <Label className="text-slate-400 text-xs uppercase">Answer Options</Label>
                <div className="space-y-2 mt-1">
                  {form.answers.map((ans, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={ans} onChange={e => {
                        const newAnswers = [...form.answers];
                        newAnswers[i] = e.target.value;
                        setForm(f => ({ ...f, answers: newAnswers }));
                      }}
                        placeholder={`Option ${i + 1}`}
                        className="bg-slate-900/60 border-slate-700 text-slate-100 flex-1" />
                      {form.answers.length > 2 && (
                        <Button type="button" variant="ghost" size="sm" className="text-red-400"
                          onClick={() => setForm(f => ({ ...f, answers: f.answers.filter((_, idx) => idx !== i) }))}>
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  {form.answers.length < 6 && (
                    <Button type="button" variant="outline" size="sm" className="border-slate-700 text-slate-400"
                      onClick={() => setForm(f => ({ ...f, answers: [...f.answers, `Option ${f.answers.length + 1}`] }))}>
                      + Add Option
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label className="text-slate-400 text-xs uppercase">Trading Closes At</Label>
              <Input type="datetime-local" value={form.trading_closes_at} onChange={field("trading_closes_at")}
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Event Date</Label>
              <Input type="datetime-local" value={form.event_date} onChange={field("event_date")}
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Initial Liquidity</Label>
              <Input type="number" value={form.initial_liquidity} onChange={field("initial_liquidity")}
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase">Tags (comma-sep)</Label>
              <Input value={form.tags} onChange={field("tags")} placeholder="bangladesh, cricket"
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-400 text-xs uppercase">Image URL</Label>
              <Input value={form.image_url} onChange={field("image_url")} placeholder="https://..."
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-400 text-xs uppercase">Source URL</Label>
              <Input value={form.source_url} onChange={field("source_url")} placeholder="https://..."
                className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <Label className="text-slate-400 text-xs uppercase">Featured Market</Label>
              <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "Saving..." : editMarket ? "Update" : "Create Market"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Resolve Dialog ───────────────────────────────────────────────────────────

function ResolveDialog({ open, onClose, onResolved, market }) {
  const [outcome, setOutcome] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResolve = async () => {
    if (!market || !outcome) return;
    setLoading(true);
    try {
      const r = await updateMarket(market.id, {
        status: "resolved", winning_outcome: outcome,
        resolution_source: source, resolved_at: new Date().toISOString(),
      });
      if (r.success) { toast({ title: "Market resolved", description: "Winning: " + outcome }); onResolved(); onClose(); }
    } finally { setLoading(false); }
  };

  const getOutcomes = () => {
    if (market?.event_answer_type === 'multi_choice' || market?.answer_type === 'multi_choice') {
      return [market?.answer1, market?.answer2, market?.answer3, market?.answer4].filter(Boolean);
    }
    return ["YES", "NO"];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1e] border-slate-800 text-slate-100">
        <DialogHeader><DialogTitle className="text-slate-100">Resolve Market</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <p className="text-sm text-slate-300 font-medium">{market?.title || market?.question}</p>
            <Badge variant="outline" className="mt-1 text-xs border-slate-700">
              {(market?.event_answer_type || market?.answer_type) === 'multi_choice' ? 'Multi-Choice' : 'Binary'}
            </Badge>
          </div>
          <div>
            <Label className="text-slate-400 text-xs uppercase mb-2 block">Winning Outcome *</Label>
            <div className={"grid gap-3 " + (getOutcomes().length > 2 ? "grid-cols-2" : "grid-cols-2")}>
              {getOutcomes().map(o => (
                <button key={o} onClick={() => setOutcome(o)}
                  className={"p-3 rounded-lg border text-sm font-semibold transition-all " + (
                    outcome === o
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600")}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-slate-400 text-xs uppercase">Resolution Source</Label>
            <Input value={source} onChange={e => setSource(e.target.value)}
              placeholder="e.g. Official BPL website"
              className="bg-slate-900/60 border-slate-700 text-slate-100 mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
          <Button onClick={handleResolve} disabled={!outcome || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Resolving..." : "Resolve Market"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Market Card ──────────────────────────────────────────────────────────────

function MarketCard({ market, onEdit, onDelete, onResolve }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const st = STATUS_CONFIG[market.status] || STATUS_CONFIG.draft;
  const catMeta = CATEGORY_META[market.category?.toLowerCase()] || CATEGORY_META.other;
  const StatusIcon = st.icon;
  const yesPct = (market.current_yes_price ?? 0.5) * 100;
  const noPct = (market.current_no_price ?? 0.5) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#0d1220] border border-slate-800/60 rounded-xl overflow-hidden hover:border-slate-700/80 transition-all">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <Badge variant="outline" className="text-xs gap-1"
              style={{ borderColor: catMeta.color + "50", color: catMeta.color }}>
              <span>{catMeta.icon}</span><span className="capitalize">{market.category}</span>
            </Badge>
            <Badge variant="outline" className="text-xs gap-1"
              style={{ borderColor: st.color + "40", color: st.color }}>
              <StatusIcon className="w-3 h-3" /><span>{st.label}</span>
            </Badge>
            {market.is_featured && <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/40">⭐ Featured</Badge>}
            {market.publish_status && market.publish_status !== 'active' && (
              <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                {market.publish_status === 'draft' ? '📝 Draft' : market.publish_status === 'scheduled' ? '⏰ Scheduled' : market.publish_status}
              </Badge>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 bg-[#111827] border border-slate-700 rounded-lg shadow-xl z-50 py-1 w-40">
                  <button onClick={() => { onEdit(market); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  {market.publish_status === 'draft' && (
                    <button onClick={async () => {
                      await updateMarket(market.id, { status: 'active', publish_status: 'active' });
                      setMenuOpen(false); window.location.reload();
                    }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800"><Play className="w-3.5 h-3.5" /> Publish Now</button>
                  )}
                  <button onClick={() => { onResolve(market); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-slate-800"><Gavel className="w-3.5 h-3.5" /> Resolve</button>
                  <Separator className="my-1 border-slate-800" />
                  <button onClick={() => { onDelete(market.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug mb-1">
          {market.title || market.question}
        </h3>
        {(market.event_answer_type === 'multi_choice' || market.answer_type === 'multi_choice') ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {[market.answer1, market.answer2, market.answer3, market.answer4].filter(Boolean).map((ans, i) => (
              <Badge key={i} variant="outline" className="text-xs border-slate-700 text-slate-300">
                {ans}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="text-green-400 font-semibold">YES {yesPct.toFixed(1)}%</span>
              <span className="text-slate-500">vs</span>
              <span className="text-red-400 font-semibold">NO {noPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex">
              <div className="bg-green-500/80 h-full" style={{ width: yesPct + "%" }} />
              <div className="bg-red-500/80 h-full" style={{ width: noPct + "%" }} />
            </div>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Volume</p>
          <p className="text-sm font-bold text-slate-200">{formatVolume(market.total_volume)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Liquidity</p>
          <p className="text-sm font-bold text-slate-200">{formatVolume(market.liquidity)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-slate-500 uppercase">Closes</p>
          <p className="text-xs font-bold text-slate-300">{timeLeft(market.trading_closes_at)}</p>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" /><span>{formatDate(market.created_at)}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-blue-400 cursor-pointer">
          View <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editMarket, setEditMarket] = useState(null);
  const [resolveMarket, setResolveMarket] = useState(null);
  const { toast } = useToast();

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    const filters = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (categoryFilter !== "all") filters.category = categoryFilter;
    if (search.trim()) filters.search = search.trim();
    const data = await fetchMarkets(filters);
    setMarkets(data);
    setLoading(false);
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this market? This cannot be undone.")) return;
    await deleteMarket(id);
    toast({ title: "Market deleted" });
    loadMarkets();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Markets & Events</h1>
          <p className="text-sm text-slate-400 mt-0.5">Unified management — market = event (industry standard)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" /> New Market
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search markets..."
            className="pl-9 bg-[#0d1220] border-slate-800 text-slate-200" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-[#0d1220] border border-slate-800">
            {["all", "active", "draft", "resolved", "paused", "closed"].map(s => (
              <TabsTrigger key={s} value={s} className={"text-xs capitalize " + (s !== "all" ? "px-2" : "")}>{s === "all" ? "All" : s}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-[#0d1220] border-slate-800 text-slate-200 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1220] border-slate-800">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-slate-200 text-xs">{v.icon} {k.charAt(0).toUpperCase() + k.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={loadMarkets} className="text-slate-400 hover:text-slate-100">
          <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Markets", value: markets.length, icon: BarChart3, color: "#3b82f6" },
          { label: "Active", value: markets.filter(m => m.status === "active").length, icon: Play, color: "#22c55e" },
          { label: "Total Volume", value: formatVolume(markets.reduce((s, m) => s + (m.total_volume || 0), 0)), icon: TrendingUp, color: "#a855f7" },
          { label: "Unique Traders", value: markets.reduce((s, m) => s + (m.unique_traders || 0), 0), icon: Users, color: "#06b6d4" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d1220] border border-slate-800/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-100">{value}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0d1220] border border-slate-800/60 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No markets found</p>
          <Button variant="link" onClick={() => setShowCreate(true)} className="text-blue-400 mt-2">Create the first market</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {markets.map(market => (
            <MarketCard key={market.id} market={market}
              onEdit={m => setEditMarket(m)}
              onDelete={handleDelete}
              onResolve={m => setResolveMarket(m)} />
          ))}
        </div>
      )}
      <MarketDialog open={showCreate || !!editMarket}
        onClose={() => { setShowCreate(false); setEditMarket(null); }}
        onSaved={loadMarkets} editMarket={editMarket} />
      <ResolveDialog open={!!resolveMarket} onClose={() => setResolveMarket(null)}
        onResolved={loadMarkets} market={resolveMarket} />
    </div>
  );
}
