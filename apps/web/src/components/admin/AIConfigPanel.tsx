'use client';

/**
 * AI Config Panel — Admin AI Agent Management
 *
 * Features:
 * - Agent cards with status toggle (active/paused)
 * - Daily token usage bar (color-coded)
 * - Prompt editor (textarea)
 * - Model selector dropdown
 * - Temperature slider
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
    Bot, Pause, Play, Settings, BarChart3, Cpu, Shield,
    MessageSquare, Scale, TrendingUp, DollarSign, RefreshCw,
    ChevronDown, ChevronUp, Save, Loader2, Zap
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentConfig {
    id: string;
    agent_key: string;
    agent_name: string;
    description: string;
    system_prompt: string;
    model_name: string;
    status: 'active' | 'paused';
    temperature: number;
    daily_token_limit: number;
    total_tokens_spent: number;
    pipeline: string;
    last_run_at: string | null;
    updated_at: string;
}

interface UsageLog {
    agent_key: string;
    usage_date: string;
    tokens_used: number;
    calls_count: number;
    estimated_cost: number;
}

// ── Pipeline Icons & Colors ────────────────────────────────────────────────────

const PIPELINE_META: Record<string, { icon: any; color: string; label: string }> = {
    market_creation: { icon: Zap, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'মার্কেট তৈরি' },
    oracle_resolution: { icon: Scale, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'ওরাকল রেজোলিউশন' },
    security: { icon: Shield, color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'সিকিউরিটি' },
    support: { icon: MessageSquare, color: 'bg-green-500/15 text-green-400 border-green-500/30', label: 'ইউজার সাপোর্ট' },
    growth: { icon: TrendingUp, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'গ্রোথ' },
    audit: { icon: DollarSign, color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', label: 'আর্থিক অডিট' },
};

const MODELS = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Latest)' },
    { value: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function AIConfigPanel() {
    const [agents, setAgents] = useState<AgentConfig[]>([]);
    const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
    const [savingAgent, setSavingAgent] = useState<string | null>(null);
    const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
    const [editedModels, setEditedModels] = useState<Record<string, string>>({});
    const [editedTemps, setEditedTemps] = useState<Record<string, number>>({});
    const [editedLimits, setEditedLimits] = useState<Record<string, number>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            const [configRes, usageRes] = await Promise.all([
                (supabase.from('ai_agent_configs') as any)
                    .select('*')
                    .order('pipeline', { ascending: true }),
                (supabase.from('ai_usage_logs') as any)
                    .select('*')
                    .gte('usage_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
                    .order('usage_date', { ascending: false }),
            ]);

            setAgents(configRes.data || []);
            setUsageLogs(usageRes.data || []);
        } catch (err) {
            console.error('[AIConfig] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Toggle agent status
    const toggleStatus = async (agent: AgentConfig) => {
        const newStatus = agent.status === 'active' ? 'paused' : 'active';
        try {
            const supabase = createClient();
            await (supabase.from('ai_agent_configs') as any)
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('agent_key', agent.agent_key);

            setAgents(prev => prev.map(a =>
                a.agent_key === agent.agent_key ? { ...a, status: newStatus } : a
            ));
            toast.success(`${agent.agent_name} ${newStatus === 'active' ? 'সক্রিয়' : 'বিরতি'} করা হয়েছে`);
        } catch {
            toast.error('স্ট্যাটাস আপডেট ব্যর্থ');
        }
    };

    // Save agent config
    const saveConfig = async (agentKey: string) => {
        setSavingAgent(agentKey);
        try {
            const updates: any = { updated_at: new Date().toISOString() };
            if (editedPrompts[agentKey] !== undefined) updates.system_prompt = editedPrompts[agentKey];
            if (editedModels[agentKey] !== undefined) updates.model_name = editedModels[agentKey];
            if (editedTemps[agentKey] !== undefined) updates.temperature = editedTemps[agentKey];
            if (editedLimits[agentKey] !== undefined) updates.daily_token_limit = editedLimits[agentKey];

            const supabase = createClient();
            await (supabase.from('ai_agent_configs') as any)
                .update(updates)
                .eq('agent_key', agentKey);

            // Clear edited state
            setEditedPrompts(p => { const n = { ...p }; delete n[agentKey]; return n; });
            setEditedModels(m => { const n = { ...m }; delete n[agentKey]; return n; });
            setEditedTemps(t => { const n = { ...t }; delete n[agentKey]; return n; });
            setEditedLimits(l => { const n = { ...l }; delete n[agentKey]; return n; });

            toast.success('কনফিগারেশন সেভ হয়েছে');
            fetchData();
        } catch {
            toast.error('সেভ ব্যর্থ');
        } finally {
            setSavingAgent(null);
        }
    };

    // Get today's usage for an agent
    const getTodayUsage = (agentKey: string) => {
        const today = new Date().toISOString().split('T')[0];
        return usageLogs.find(l => l.agent_key === agentKey && l.usage_date === today);
    };

    const hasEdits = (agentKey: string) =>
        editedPrompts[agentKey] !== undefined ||
        editedModels[agentKey] !== undefined ||
        editedTemps[agentKey] !== undefined ||
        editedLimits[agentKey] !== undefined;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="ml-2 text-slate-400">এজেন্ট কনফিগ লোড হচ্ছে...</span>
            </div>
        );
    }

    // Group by pipeline
    const grouped = agents.reduce((acc, agent) => {
        const pipe = agent.pipeline || 'other';
        if (!acc[pipe]) acc[pipe] = [];
        acc[pipe].push(agent);
        return acc;
    }, {} as Record<string, AgentConfig[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        AI এজেন্ট কনফিগারেশন
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {agents.filter(a => a.status === 'active').length}/{agents.length} এজেন্ট সক্রিয়
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    রিফ্রেশ
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="মোট এজেন্ট"
                    value={agents.length}
                    icon={<Bot className="w-4 h-4" />}
                    color="text-blue-400"
                />
                <StatCard
                    label="সক্রিয়"
                    value={agents.filter(a => a.status === 'active').length}
                    icon={<Play className="w-4 h-4" />}
                    color="text-green-400"
                />
                <StatCard
                    label="আজকের কল"
                    value={usageLogs
                        .filter(l => l.usage_date === new Date().toISOString().split('T')[0])
                        .reduce((sum, l) => sum + l.calls_count, 0)}
                    icon={<BarChart3 className="w-4 h-4" />}
                    color="text-amber-400"
                />
                <StatCard
                    label="আজকের টোকেন"
                    value={usageLogs
                        .filter(l => l.usage_date === new Date().toISOString().split('T')[0])
                        .reduce((sum, l) => sum + l.tokens_used, 0)
                        .toLocaleString()}
                    icon={<Cpu className="w-4 h-4" />}
                    color="text-cyan-400"
                />
            </div>

            {/* Agent Cards by Pipeline */}
            {Object.entries(grouped).map(([pipeline, pipeAgents]) => {
                const meta = PIPELINE_META[pipeline] || { icon: Bot, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: pipeline };
                const PipeIcon = meta.icon;
                return (
                    <div key={pipeline} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.color}`}>
                                <PipeIcon className="w-3.5 h-3.5" />
                                {meta.label}
                            </span>
                            <span className="text-xs text-slate-500">{pipeAgents.length} এজেন্ট</span>
                        </div>

                        <div className="space-y-2">
                            {pipeAgents.map(agent => {
                                const todayUsage = getTodayUsage(agent.agent_key);
                                const usagePercent = todayUsage
                                    ? Math.min(100, (todayUsage.tokens_used / agent.daily_token_limit) * 100)
                                    : 0;
                                const isExpanded = expandedAgent === agent.agent_key;

                                return (
                                    <div
                                        key={agent.agent_key}
                                        className={`bg-slate-900/60 border rounded-xl overflow-hidden transition-all ${agent.status === 'paused'
                                            ? 'border-slate-700/50 opacity-60'
                                            : 'border-slate-700'
                                            }`}
                                    >
                                        {/* Agent Header */}
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : 'bg-slate-500'
                                                    }`} />
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-white truncate">
                                                        {agent.agent_name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {agent.description || agent.agent_key}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-3">
                                                {/* Token bar */}
                                                <div className="hidden sm:flex items-center gap-2 w-32">
                                                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' :
                                                                usagePercent > 50 ? 'bg-amber-500' :
                                                                    'bg-green-500'
                                                                }`}
                                                            style={{ width: `${usagePercent}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 w-8 text-right">
                                                        {Math.round(usagePercent)}%
                                                    </span>
                                                </div>

                                                {/* Status toggle */}
                                                <button
                                                    onClick={() => toggleStatus(agent)}
                                                    className={`p-1.5 rounded-lg transition-colors ${agent.status === 'active'
                                                        ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                        }`}
                                                    title={agent.status === 'active' ? 'বিরতি দিন' : 'সক্রিয় করুন'}
                                                >
                                                    {agent.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                </button>

                                                {/* Expand */}
                                                <button
                                                    onClick={() => setExpandedAgent(isExpanded ? null : agent.agent_key)}
                                                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Settings */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-800 p-4 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Model */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-slate-400">মডেল</label>
                                                        <select
                                                            value={editedModels[agent.agent_key] ?? agent.model_name}
                                                            onChange={(e) => setEditedModels(p => ({ ...p, [agent.agent_key]: e.target.value }))}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                                            aria-label="মডেল নির্বাচন করুন"
                                                        >
                                                            {MODELS.map(m => (
                                                                <option key={m.value} value={m.value}>{m.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Temperature */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-slate-400">
                                                            Temperature: {(editedTemps[agent.agent_key] ?? agent.temperature).toFixed(2)}
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={1}
                                                            step={0.05}
                                                            value={editedTemps[agent.agent_key] ?? agent.temperature}
                                                            onChange={(e) => setEditedTemps(p => ({ ...p, [agent.agent_key]: parseFloat(e.target.value) }))}
                                                            className="w-full accent-blue-500"
                                                            title="Temperature নিয়ন্ত্রণ"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Daily Token Limit */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-400">
                                                        দৈনিক টোকেন লিমিট
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={editedLimits[agent.agent_key] ?? agent.daily_token_limit}
                                                        onChange={(e) => setEditedLimits(p => ({ ...p, [agent.agent_key]: parseInt(e.target.value) || 0 }))}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                                        title="দৈনিক টোকেন লিমিট"
                                                    />
                                                </div>

                                                {/* System Prompt */}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-400">
                                                        সিস্টেম প্রম্পট
                                                    </label>
                                                    <textarea
                                                        value={editedPrompts[agent.agent_key] ?? agent.system_prompt}
                                                        onChange={(e) => setEditedPrompts(p => ({ ...p, [agent.agent_key]: e.target.value }))}
                                                        rows={6}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono resize-y"
                                                        placeholder="সিস্টেম ইনস্ট্রাকশন লিখুন..."
                                                    />
                                                </div>

                                                {/* Usage Stats */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <p className="text-[10px] text-slate-500 uppercase">আজকের টোকেন</p>
                                                        <p className="text-sm font-bold text-white">{(todayUsage?.tokens_used || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <p className="text-[10px] text-slate-500 uppercase">আজকের কল</p>
                                                        <p className="text-sm font-bold text-white">{todayUsage?.calls_count || 0}</p>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <p className="text-[10px] text-slate-500 uppercase">মোট খরচ</p>
                                                        <p className="text-sm font-bold text-white">${(todayUsage?.estimated_cost || 0).toFixed(4)}</p>
                                                    </div>
                                                </div>

                                                {/* Save Button */}
                                                {hasEdits(agent.agent_key) && (
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => saveConfig(agent.agent_key)}
                                                            disabled={savingAgent === agent.agent_key}
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                        >
                                                            {savingAgent === agent.agent_key ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                            সেভ করুন
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Last Run */}
                                                <p className="text-[10px] text-slate-600">
                                                    শেষ রান: {agent.last_run_at
                                                        ? new Date(agent.last_run_at).toLocaleString('bn-BD')
                                                        : 'এখনো চালানো হয়নি'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
            <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
                {icon}
                <span className="text-[10px] uppercase font-medium">{label}</span>
            </div>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    );
}

export default AIConfigPanel;
