import { createClient } from "@/lib/supabase/server";

export interface AIProviderConfig {
    provider_name: string;
    model: string;
    base_url: string;
    temperature: number;
    max_tokens: number;
    is_active: boolean;
}

export interface AIPromptConfig {
    agent_name: string;
    system_prompt: string;
    is_active: boolean;
}

export interface FeatureFlag {
    key: string;
    enabled: boolean;
    fallback: boolean; // safe default when DB is unreachable
}

let cachedProviders: Record<string, AIProviderConfig> | null = null;
let cachedPrompts: Record<string, AIPromptConfig> | null = null;
let cachedFlags: Record<string, FeatureFlag> | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

/** Safe defaults when the database is unreachable — all features OFF */
const SAFE_DEFAULT_FLAGS: Record<string, FeatureFlag> = {
    ai_oracle: { key: "ai_oracle", enabled: false, fallback: true },
    ai_market_maker: { key: "ai_market_maker", enabled: false, fallback: true },
    binance_p2p: { key: "binance_p2p", enabled: false, fallback: true },
    manual_agent_deposit: { key: "manual_agent_deposit", enabled: false, fallback: true },
    live_events: { key: "live_events", enabled: true, fallback: true },
    conditional_orders: { key: "conditional_orders", enabled: false, fallback: true },
};

export async function getAIConfigs(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedProviders && cachedPrompts && (now - lastFetch < CACHE_TTL)) {
        return { providers: cachedProviders, prompts: cachedPrompts, flags: cachedFlags || SAFE_DEFAULT_FLAGS };
    }

    try {
        const supabase = await createClient();

        const [providersRes, promptsRes, flagsRes] = await Promise.all([
            supabase.from("ai_providers").select("*").eq("is_active", true),
            supabase.from("ai_prompts").select("*").eq("is_active", true),
            supabase.from("feature_flags").select("*"),
        ]);

        const newProviders: Record<string, AIProviderConfig> = {};
        const newPrompts: Record<string, AIPromptConfig> = {};
        const newFlags: Record<string, FeatureFlag> = {};

        if (providersRes.data) {
            providersRes.data.forEach((p) => {
                newProviders[p.provider_name] = p;
            });
        }

        if (promptsRes.data) {
            promptsRes.data.forEach((p) => {
                newPrompts[p.agent_name] = p;
            });
        }

        if (flagsRes.data) {
            flagsRes.data.forEach((f) => {
                newFlags[f.key] = {
                    key: f.key,
                    enabled: f.enabled ?? SAFE_DEFAULT_FLAGS[f.key]?.fallback ?? false,
                    fallback: SAFE_DEFAULT_FLAGS[f.key]?.fallback ?? false,
                };
            });
        }

        // Merge with safe defaults for any missing flags
        for (const [key, def] of Object.entries(SAFE_DEFAULT_FLAGS)) {
            if (!newFlags[key]) newFlags[key] = def;
        }

        cachedProviders = newProviders;
        cachedPrompts = newPrompts;
        cachedFlags = newFlags;
        lastFetch = now;

        return { providers: newProviders, prompts: newPrompts, flags: newFlags };
    } catch (error) {
        console.error("[getAIConfigs] Failed to fetch configs from DB — returning safe defaults", error);
        // FAIL LOUD: return safe defaults, never crash
        return {
            providers: cachedProviders || {},
            prompts: cachedPrompts || {},
            flags: cachedFlags || SAFE_DEFAULT_FLAGS,
        };
    }
}

/**
 * Check a single feature flag with safe fallback.
 * Returns `false` (OFF) if the flag is unknown or the DB is down.
 */
export async function getFeatureFlag(flagKey: string): Promise<boolean> {
    const { flags } = await getAIConfigs();
    return flags[flagKey]?.enabled ?? SAFE_DEFAULT_FLAGS[flagKey]?.fallback ?? false;
}
