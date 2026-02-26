'use client';

/**
 * AI Agent Status Component
 * Real-time visualization of multi-agent orchestration
 * Shows processing state for each agent
 */

import React from 'react';
import { Sparkles, Brain, ShieldCheck, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AgentType, AgentStatus, AgentState } from '@/lib/ai-agents/types';
import { cn } from '@/lib/utils';

interface AIAgentStatusProps {
  agents: AgentState[];
  currentStep: number;
  isProcessing: boolean;
  providerUsed?: 'vertex' | 'kimi' | 'rule-based';
  onRotateProvider?: () => void;
  className?: string;
}

interface AgentMetadata {
  name: string;
  nameBn: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const agentMetadata: Record<AgentType, AgentMetadata> = {
  content: {
    name: 'Content Agent',
    nameBn: 'কন্টেন্ট এজেন্ট',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'NLP & SEO Optimization',
  },
  logic: {
    name: 'Market Logic',
    nameBn: 'মার্কেট লজিক',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Binary/Categorical Detection',
  },
  timing: {
    name: 'Chronos Agent',
    nameBn: 'টাইমিং এজেন্ট',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Asia/Dhaka Timezone',
  },
  risk: {
    name: 'Compliance',
    nameBn: 'কমপ্লায়েন্স',
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Policy Verification',
  },
  idle: {
    name: 'Waiting...',
    nameBn: 'অপেক্ষমান...',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    description: 'Ready to start',
  },
};

const statusIcons: Record<AgentStatus, React.ReactNode> = {
  idle: <div className="w-2 h-2 rounded-full bg-gray-300" />,
  processing: <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <AlertCircle className="w-4 h-4 text-red-500" />,
};

const providerLabels: Record<string, { name: string; color: string }> = {
  vertex: { name: 'Vertex AI', color: 'text-blue-600 bg-blue-50' },
  kimi: { name: 'Kimi API', color: 'text-purple-600 bg-purple-50' },
  'rule-based': { name: 'Rule-Based', color: 'text-gray-600 bg-gray-50' },
};

export const AIAgentStatus: React.FC<AIAgentStatusProps> = ({
  agents,
  currentStep,
  isProcessing,
  providerUsed,
  onRotateProvider,
  className,
}) => {
  // Ensure all agent types are represented
  const allAgentTypes: AgentType[] = ['content', 'logic', 'timing', 'risk'];
  const agentMap = new Map(agents.map(a => [a.type, a]));
  
  const displayAgents = allAgentTypes.map(type => {
    const existing = agentMap.get(type);
    if (existing) return existing;
    return {
      type,
      status: 'idle' as AgentStatus,
      progress: 0,
    };
  });

  return (
    <div
      className={cn(
        'fixed right-6 top-24 w-72 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-indigo-100 overflow-hidden transition-all duration-500',
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              AI Co-Pilot
            </h3>
            <p className="text-[10px] text-indigo-100 mt-0.5">
              মাল্টি-এজেন্ট অর্কেস্ট্রেশন
            </p>
          </div>
          {isProcessing && (
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${(currentStep / allAgentTypes.length) * 100}%` }}
        />
      </div>

      {/* Agent List */}
      <div className="p-4 space-y-3">
        {displayAgents.map((agent, index) => {
          const meta = agentMetadata[agent.type];
          const isActive = agent.status === 'processing';
          const isCompleted = agent.status === 'completed';
          const isError = agent.status === 'error';

          return (
            <div
              key={agent.type}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border',
                isActive && `${meta.bgColor} ${meta.borderColor} shadow-sm`,
                isCompleted && 'bg-green-50/50 border-green-100',
                isError && 'bg-red-50 border-red-200',
                !isActive && !isCompleted && !isError && 'bg-gray-50/50 border-transparent opacity-60'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
                  isActive ? `${meta.bgColor} ${meta.color} scale-110` : 'bg-gray-100 text-gray-400',
                  isCompleted && 'bg-green-100 text-green-600',
                  isError && 'bg-red-100 text-red-600'
                )}
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  meta.icon
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-bold',
                    isActive ? meta.color : 'text-gray-600',
                    isCompleted && 'text-green-700',
                    isError && 'text-red-700'
                  )}>
                    {meta.nameBn}
                  </span>
                  {statusIcons[agent.status]}
                </div>
                <p className="text-[10px] text-gray-400 truncate">
                  {agent.message || meta.description}
                </p>
                {agent.progress > 0 && agent.progress < 100 && (
                  <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isError ? 'bg-red-400' : 'bg-indigo-400'
                      )}
                      style={{ width: `${agent.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Step Number */}
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isCompleted
                    ? 'bg-green-100 text-green-600'
                    : isActive
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  index + 1
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Badge */}
      {providerUsed && (
        <div className="px-4 pb-3">
          <div className={cn(
            'text-[10px] font-medium px-2 py-1 rounded-md inline-flex items-center gap-1.5',
            providerLabels[providerUsed]?.color || 'text-gray-600 bg-gray-50'
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {providerLabels[providerUsed]?.name || providerUsed}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-100 p-3 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Step {currentStep} of {allAgentTypes.length}
          </span>
          {onRotateProvider && (
            <button
              onClick={onRotateProvider}
              disabled={isProcessing}
              className="text-[10px] font-bold bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Rotate API
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgentStatus;
