'use client';

/**
 * MoAgent Tools Panel — Collapsible AI sidebar for event creation
 *
 * Non-blocking: sits beside the form, doesn't prevent manual field entry.
 * Each agent button runs via the API and auto-fills relevant form fields.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    Bot, Sparkles, Brain, Clock, TrendingUp, Shield, Scale,
    MessageSquare, DollarSign, ChevronDown, ChevronUp,
    Loader2, CheckCircle2, XCircle, Zap, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AgentTool {
    key: string;
    name: string;
    nameBn: string;
    icon: any;
    color: string;
    bgColor: string;
    description: string;
    autoFillsFields: string[];
}

interface AgentRunState {
    status: 'idle' | 'running' | 'done' | 'error';
    result?: any;
    error?: string;
}

interface MoAgentToolsPanelProps {
    formData: {
        title: string;
        question: string;
        description: string;
        category: string;
        subcategory: string;
        tradingClosesAt: string;
        answer1: string;
        answer2: string;
        initialLiquidity: number;
        tags: string[];
    };
    onApplyResult: (field: string, value: any) => void;
    onApplyMultiple: (updates: Record<string, any>) => void;
    className?: string;
}

// ── Agent definitions ──────────────────────────────────────────────────────────

const MOAGENT_TOOLS: AgentTool[] = [
    {
        key: 'content-v2',
        name: 'Content Architect',
        nameBn: 'কন্টেন্ট এজেন্ট',
        icon: Sparkles,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        description: 'শিরোনাম, বিবরণ, ক্যাটাগরি, ট্যাগ জেনারেট করে',
        autoFillsFields: ['title', 'description', 'category', 'tags'],
    },
    {
        key: 'quant-logic',
        name: 'Quant Logic',
        nameBn: 'কোয়ান্ট লজিক',
        icon: Brain,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        description: 'LMSR প্যারামিটার, আউটকাম, লিকুইডিটি ডিজাইন করে',
        autoFillsFields: ['answer1', 'answer2', 'initialLiquidity'],
    },
    {
        key: 'chronos',
        name: 'Chronos Timing',
        nameBn: 'ক্রোনোস টাইমিং',
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        description: 'BD timezone অনুযায়ী ট্রেডিং উইন্ডো নির্ধারণ',
        autoFillsFields: ['tradingClosesAt'],
    },
    {
        key: 'growth',
        name: 'Growth Machine',
        nameBn: 'গ্রোথ মেশিন',
        icon: TrendingUp,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        description: 'ভাইরাল ট্রেন্ড থেকে নতুন মার্কেট সাজেশন',
        autoFillsFields: ['title', 'description', 'tags'],
    },
    {
        key: 'osint',
        name: 'OSINT Architect',
        nameBn: 'ওসিন্ট আর্কিটেক্ট',
        icon: Search,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        description: 'গ্রাউন্ডেড রিসার্চ ও ভেরিফিকেশন',
        autoFillsFields: [],
    },
    {
        key: 'sentinel',
        name: 'Sentinel Shield',
        nameBn: 'সেন্টিনেল শিল্ড',
        icon: Shield,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        description: 'রিস্ক স্কোর ও ফ্রড ডিটেকশন',
        autoFillsFields: [],
    },
    {
        key: 'audit',
        name: 'Fiscal Audit',
        nameBn: 'আর্থিক অডিট',
        icon: DollarSign,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        description: 'ব্যালেন্স রিকনসিলিয়েশন ও লিকুইডিটি চেক',
        autoFillsFields: [],
    },
];

// ── API Caller ────────────────────────────────────────────────────────────────

async function callMoAgent(agentKey: string, context: any): Promise<any> {
    const baseUrl = typeof window !== 'undefined'
        ? ''
        : (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000');

    const response = await fetch(`${baseUrl}/api/ai/vertex-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: agentKey, context }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.message || err.error || `Agent ${agentKey} failed`);
    }

    const data = await response.json();
    return data.result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MoAgentToolsPanel({
    formData,
    onApplyResult,
    onApplyMultiple,
    className,
}: MoAgentToolsPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [agentStates, setAgentStates] = useState<Record<string, AgentRunState>>({});
    const [expandedResult, setExpandedResult] = useState<string | null>(null);

    const setAgentState = (key: string, state: Partial<AgentRunState>) => {
        setAgentStates(prev => ({
            ...prev,
            [key]: { ...(prev[key] || { status: 'idle' }), ...state },
        }));
    };

    // Run a specific agent
    const runAgent = useCallback(async (agent: AgentTool) => {
        if (!formData.title && !formData.question) {
            toast.error('প্রথমে শিরোনাম বা প্রশ্ন লিখুন');
            return;
        }

        setAgentState(agent.key, { status: 'running', error: undefined });

        try {
            const context = {
                title: formData.title || formData.question,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory,
                outcomes: [formData.answer1, formData.answer2],
                tradingClosesAt: formData.tradingClosesAt,
                tags: formData.tags,
                rawInput: formData.title || formData.question,
            };

            const result = await callMoAgent(agent.key, context);
            setAgentState(agent.key, { status: 'done', result });

            // Auto-apply results based on agent type
            applyAgentResult(agent.key, result);

            toast.success(`✅ ${agent.nameBn} সফল!`);
        } catch (err: any) {
            setAgentState(agent.key, { status: 'error', error: err.message });
            toast.error(`${agent.nameBn} ব্যর্থ: ${err.message}`);
        }
    }, [formData]);

    // Apply results to form
    const applyAgentResult = (agentKey: string, result: any) => {
        if (!result) return;

        switch (agentKey) {
            case 'content-v2': {
                const updates: Record<string, any> = {};
                if (result.seo_title_bn) updates.title = result.seo_title_bn;
                if (result.seo_description_bn) updates.description = result.seo_description_bn;
                if (result.category) updates.category = result.category.toLowerCase();
                if (result.tags) updates.tags = result.tags;
                if (Object.keys(updates).length > 0) onApplyMultiple(updates);
                break;
            }
            case 'quant-logic': {
                const updates: Record<string, any> = {};
                if (result.market_design?.outcomes?.[0]) updates.answer1 = result.market_design.outcomes[0];
                if (result.market_design?.outcomes?.[1]) updates.answer2 = result.market_design.outcomes[1];
                if (result.market_design?.initial_liquidity) updates.initialLiquidity = result.market_design.initial_liquidity;
                if (Object.keys(updates).length > 0) onApplyMultiple(updates);
                break;
            }
            case 'chronos': {
                if (result.timing?.trading_closes_at) {
                    onApplyResult('tradingClosesAt', result.timing.trading_closes_at.slice(0, 16));
                }
                break;
            }
            case 'growth': {
                if (result.market_suggestions?.[0]) {
                    const topSuggestion = result.market_suggestions[0];
                    const updates: Record<string, any> = {};
                    if (topSuggestion.title_bn) updates.title = topSuggestion.title_bn;
                    if (topSuggestion.description_bn) updates.description = topSuggestion.description_bn;
                    if (topSuggestion.tags) updates.tags = topSuggestion.tags;
                    if (Object.keys(updates).length > 0) onApplyMultiple(updates);
                }
                break;
            }
            // Other agents (osint, sentinel, audit) don't auto-fill form fields
            default:
                break;
        }
    };

    const activeCount = Object.values(agentStates).filter(s => s.status === 'running').length;
    const doneCount = Object.values(agentStates).filter(s => s.status === 'done').length;

    return (
        <div className={cn(
            'bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl overflow-hidden transition-all',
            className
        )}>
            {/* Header — always visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
            >
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-sm font-bold">🤖 MoAgent AI Tools</span>
                    {activeCount > 0 && (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                            {activeCount} চলছে
                        </span>
                    )}
                    {doneCount > 0 && (
                        <span className="text-[10px] bg-green-400/20 px-1.5 py-0.5 rounded-full">
                            ✓ {doneCount}
                        </span>
                    )}
                </div>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {/* Collapsed hint */}
            {isCollapsed && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                    ক্লিক করে AI টুলস ব্যবহার করুন — ফর্ম ফিল্ড অটো-ফিল হবে
                </div>
            )}

            {/* Agent Grid */}
            {!isCollapsed && (
                <div className="p-3 space-y-2">
                    {/* Quick Run All (Content + Logic + Timing) */}
                    <button
                        onClick={async () => {
                            const coreAgents = MOAGENT_TOOLS.filter(a => ['content-v2', 'quant-logic', 'chronos'].includes(a.key));
                            for (const agent of coreAgents) {
                                await runAgent(agent);
                            }
                        }}
                        disabled={activeCount > 0 || (!formData.title && !formData.question)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Zap className="w-4 h-4" />
                        ⚡ সব এজেন্ট চালান (Content + Logic + Timing)
                    </button>

                    {/* Individual Agents */}
                    <div className="grid grid-cols-1 gap-1.5">
                        {MOAGENT_TOOLS.map(agent => {
                            const state = agentStates[agent.key] || { status: 'idle' };
                            const Icon = agent.icon;
                            const isRunning = state.status === 'running';
                            const isDone = state.status === 'done';
                            const isError = state.status === 'error';

                            return (
                                <div key={agent.key} className="group">
                                    <button
                                        onClick={() => runAgent(agent)}
                                        disabled={isRunning || (!formData.title && !formData.question)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all border',
                                            isDone && 'bg-green-50 border-green-200',
                                            isError && 'bg-red-50 border-red-200',
                                            isRunning && `${agent.bgColor} border-transparent`,
                                            !isDone && !isError && !isRunning && 'bg-gray-50 border-transparent hover:bg-gray-100',
                                            'disabled:opacity-50 disabled:cursor-not-allowed'
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                            isDone ? 'bg-green-100' : isError ? 'bg-red-100' : agent.bgColor
                                        )}>
                                            {isRunning ? (
                                                <Loader2 className={cn('w-4 h-4 animate-spin', agent.color)} />
                                            ) : isDone ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            ) : isError ? (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            ) : (
                                                <Icon className={cn('w-4 h-4', agent.color)} />
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-800">{agent.nameBn}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{agent.description}</p>
                                        </div>

                                        {/* Fields badge */}
                                        {agent.autoFillsFields.length > 0 && !isDone && (
                                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                {agent.autoFillsFields.length} ফিল্ড
                                            </span>
                                        )}
                                    </button>

                                    {/* Result preview */}
                                    {isDone && state.result && (
                                        <button
                                            onClick={() => setExpandedResult(expandedResult === agent.key ? null : agent.key)}
                                            className="w-full text-left px-3 py-1 text-[10px] text-green-600 hover:text-green-700"
                                        >
                                            {expandedResult === agent.key ? '▼ রেজাল্ট লুকান' : '▶ রেজাল্ট দেখুন'}
                                        </button>
                                    )}
                                    {expandedResult === agent.key && state.result && (
                                        <pre className="mx-3 mb-2 p-2 bg-gray-900 text-green-400 text-[9px] rounded-lg overflow-auto max-h-40">
                                            {JSON.stringify(state.result, null, 2).slice(0, 1000)}
                                        </pre>
                                    )}

                                    {/* Error message */}
                                    {isError && state.error && (
                                        <p className="mx-3 mb-1 text-[10px] text-red-500">{state.error}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MoAgentToolsPanel;
