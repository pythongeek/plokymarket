'use client';

import React from 'react';
import { useAIProviderStore, ProviderMode } from '@/store/aiProviderStore';
import { cn } from '@/lib/utils';
import { Zap, Brain, Moon, Share2, Activity, ShieldAlert } from 'lucide-react';

const MODES: { value: ProviderMode; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
        value: 'vertex',
        label: 'Vertex AI',
        icon: <Brain className="w-4 h-4" />,
        color: 'text-blue-400',
        desc: 'Google Gemini Pro'
    },
    {
        value: 'kimi',
        label: 'Kimi API',
        icon: <Moon className="w-4 h-4" />,
        color: 'text-purple-400',
        desc: 'Moonshot-V1'
    },
    {
        value: 'combine',
        label: 'Combine Mode',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-yellow-400',
        desc: 'Dual-processing'
    },
    {
        value: 'race',
        label: 'Race Mode',
        icon: <Activity className="w-4 h-4" />,
        color: 'text-green-400',
        desc: 'Speed optimized'
    },
];

export function AIRotationToggle() {
    const { mode, setMode, vertexHealth, kimiHealth } = useAIProviderStore();

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 shadow-xl w-full max-w-xs transition-all hover:border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5" /> AI Rotation System
                </h3>
                <div className="flex gap-1.5">
                    <div className="h-1.5 w-6 bg-slate-800 rounded-full overflow-hidden" title={`Vertex Health: ${vertexHealth}%`}>
                        <div
                            className={cn("h-full transition-all duration-500", vertexHealth > 70 ? "bg-blue-500" : "bg-red-500")}
                            style={{ width: `${vertexHealth}%` }}
                        />
                    </div>
                    <div className="h-1.5 w-6 bg-slate-800 rounded-full overflow-hidden" title={`Kimi Health: ${kimiHealth}%`}>
                        <div
                            className={cn("h-full transition-all duration-500", kimiHealth > 70 ? "bg-purple-500" : "bg-red-500")}
                            style={{ width: `${kimiHealth}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {MODES.map((m) => {
                    const isActive = mode === m.value;
                    return (
                        <button
                            key={m.value}
                            onClick={() => setMode(m.value)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-left",
                                isActive
                                    ? "bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10"
                                    : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center mb-1",
                                isActive ? m.color + " bg-slate-900" : "text-slate-500 bg-slate-900/50"
                            )}>
                                {m.icon}
                            </div>
                            <div className="text-center">
                                <span className={cn(
                                    "text-[10px] font-bold block leading-tight",
                                    isActive ? "text-white" : "text-slate-400"
                                )}>
                                    {m.label}
                                </span>
                                <span className="text-[8px] text-slate-500 font-medium">
                                    {m.desc}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {(vertexHealth < 50 || kimiHealth < 50) && (
                <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-red-400" />
                    <p className="text-[9px] text-red-400 font-medium italic">
                        Degraded performance detected. Auto-failover active.
                    </p>
                </div>
            )}
        </div>
    );
}
