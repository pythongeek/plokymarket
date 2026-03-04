/**
 * Agent Factory — Unified AI Agent Engine
 *
 * Central dispatcher that reads agent configuration from the database,
 * routes to the correct MoAgent implementation, and logs token usage.
 *
 * Usage:
 *   import { runAgent } from '@/lib/ai/agent-factory';
 *   const result = await runAgent('content-v2', 'বিপিএল ২০২৭');
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AgentConfig {
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
}

export interface AgentRunResult {
    success: boolean;
    agentKey: string;
    agentName: string;
    result: any;
    tokensUsed: number;
}

// ── Agent Registry (maps agent_key → dynamic import path) ─────────────────

type AgentRunner = (input: any, config?: AgentConfig) => Promise<any>;

const AGENT_REGISTRY: Record<string, () => Promise<AgentRunner>> = {
    'content-v2': async () => {
        const { runVertexContentAgent } = await import('@/lib/ai-agents/vertex-content-agent');
        return (input) => runVertexContentAgent(input);
    },
    'osint': async () => {
        const { runOSINTAgent } = await import('@/lib/oracle/ai/agents/VertexOSINTAgent');
        return (input) => runOSINTAgent(
            input.query || input.rawInput || '',
            input.existingSources
        );
    },
    'quant-logic': async () => {
        const { runQuantLogicAgent } = await import('@/lib/ai-agents/vertex-quant-logic-agent');
        return (input) => runQuantLogicAgent(input);
    },
    'chronos': async () => {
        const { runChronosAgent } = await import('@/lib/ai-agents/vertex-timing-agent');
        return (input) => runChronosAgent(input);
    },
    'sentinel': async () => {
        const { runSentinelAgent } = await import('@/lib/ai-agents/vertex-sentinel-agent');
        return (input) => runSentinelAgent(input);
    },
    'oracle-resolve': async () => {
        const { runOracleGuardianAgent } = await import('@/lib/oracle/ai/agents/VertexOracleGuardianAgent');
        return (input) => runOracleGuardianAgent(
            input.marketQuestion || input.rawInput || '',
            input.resolutionCriteria,
            input.existingSources
        );
    },
    'concierge': async () => {
        const { runConciergeAgent } = await import('@/lib/ai-agents/vertex-concierge-agent');
        return (input) => runConciergeAgent(input);
    },
    'tribunal': async () => {
        const { runTribunalAgent } = await import('@/lib/oracle/ai/agents/VertexTribunalAgent');
        return (input) => runTribunalAgent(input);
    },
    'growth': async () => {
        const { runGrowthAgent } = await import('@/lib/ai-agents/vertex-growth-agent');
        return (input) => runGrowthAgent(input);
    },
    'audit': async () => {
        const { runAuditAgent } = await import('@/lib/ai-agents/vertex-audit-agent');
        return (input) => runAuditAgent(input);
    },
};

// ── Config fetcher ────────────────────────────────────────────────────────────

async function getAgentConfig(agentKey: string): Promise<AgentConfig | null> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data, error } = await (supabase
            .from('ai_agent_configs') as any)
            .select('*')
            .eq('agent_key', agentKey)
            .single();

        if (error || !data) return null;
        return data as AgentConfig;
    } catch {
        return null;
    }
}

async function logTokenUsage(agentKey: string, tokens: number): Promise<void> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        await (supabase.rpc as any)('increment_agent_usage', {
            p_agent_key: agentKey,
            p_tokens: tokens,
        });
    } catch (err) {
        console.warn(`[AgentFactory] Failed to log token usage for ${agentKey}:`, err);
    }
}

// ── Check daily limit ─────────────────────────────────────────────────────────

async function checkDailyLimit(agentKey: string, dailyLimit: number): Promise<boolean> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data } = await (supabase
            .from('ai_usage_logs') as any)
            .select('tokens_used')
            .eq('agent_key', agentKey)
            .eq('usage_date', new Date().toISOString().split('T')[0])
            .single();

        return (data?.tokens_used || 0) < dailyLimit;
    } catch {
        return true; // Allow if can't check
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run an AI agent by key through the unified factory.
 *
 * 1. Reads config from DB (checks status, daily limit)
 * 2. Routes to correct MoAgent implementation
 * 3. Logs token usage
 *
 * @param agentKey - Agent key (e.g., 'content-v2', 'sentinel', 'growth')
 * @param input - Agent-specific input (varies by agent)
 */
export async function runAgent(
    agentKey: string,
    input: any
): Promise<AgentRunResult> {
    console.log(`[AgentFactory] Running agent: ${agentKey}`);

    // 1. Check if agent exists in registry
    const loader = AGENT_REGISTRY[agentKey];
    if (!loader) {
        throw new Error(`Unknown agent: ${agentKey}. Valid: ${Object.keys(AGENT_REGISTRY).join(', ')}`);
    }

    // 2. Fetch config from database
    const config = await getAgentConfig(agentKey);

    if (config) {
        // Check if agent is paused
        if (config.status === 'paused') {
            throw new Error(`Agent "${config.agent_name}" (${agentKey}) is currently paused by admin.`);
        }

        // Check daily token limit
        const withinLimit = await checkDailyLimit(agentKey, config.daily_token_limit);
        if (!withinLimit) {
            throw new Error(
                `Agent "${config.agent_name}" has exceeded daily token limit (${config.daily_token_limit}).`
            );
        }
    }

    // 3. Load and run the agent
    const runner = await loader();
    const startTime = Date.now();
    const result = await runner(input, config || undefined);
    const elapsed = Date.now() - startTime;

    // 4. Estimate tokens (rough: ~4 chars per token for mixed Bengali/English)
    const estimatedTokens = Math.ceil(
        (JSON.stringify(input).length + JSON.stringify(result).length) / 4
    );

    // 5. Log usage
    await logTokenUsage(agentKey, estimatedTokens);

    console.log(
        `[AgentFactory] ${agentKey} complete in ${elapsed}ms, ~${estimatedTokens} tokens`
    );

    return {
        success: true,
        agentKey,
        agentName: config?.agent_name || agentKey,
        result,
        tokensUsed: estimatedTokens,
    };
}

/**
 * Get all agent configs for admin panel.
 */
export async function getAllAgentConfigs(): Promise<AgentConfig[]> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data } = await (supabase
            .from('ai_agent_configs') as any)
            .select('*')
            .order('pipeline', { ascending: true });

        return (data || []) as AgentConfig[];
    } catch {
        return [];
    }
}

/**
 * Update agent config (admin only).
 */
export async function updateAgentConfig(
    agentKey: string,
    updates: Partial<Pick<AgentConfig, 'status' | 'system_prompt' | 'model_name' | 'temperature' | 'daily_token_limit'>>
): Promise<boolean> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { error } = await (supabase
            .from('ai_agent_configs') as any)
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('agent_key', agentKey);

        return !error;
    } catch {
        return false;
    }
}

/**
 * Get usage stats for all agents (last 7 days).
 */
export async function getAgentUsageStats(): Promise<any[]> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data } = await (supabase
            .from('ai_usage_logs') as any)
            .select('*')
            .gte('usage_date', sevenDaysAgo.toISOString().split('T')[0])
            .order('usage_date', { ascending: false });

        return data || [];
    } catch {
        return [];
    }
}
