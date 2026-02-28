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

let cachedProviders: Record<string, AIProviderConfig> | null = null;
let cachedPrompts: Record<string, AIPromptConfig> | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

export async function getAIConfigs(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedProviders && cachedPrompts && (now - lastFetch < CACHE_TTL)) {
        return { providers: cachedProviders, prompts: cachedPrompts };
    }

    try {
        const supabase = await createClient();

        const [providersRes, promptsRes] = await Promise.all([
            supabase.from("ai_providers").select("*").eq("is_active", true),
            supabase.from("ai_prompts").select("*").eq("is_active", true)
        ]);

        const newProviders: Record<string, AIProviderConfig> = {};
        const newPrompts: Record<string, AIPromptConfig> = {};

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

        cachedProviders = newProviders;
        cachedPrompts = newPrompts;
        lastFetch = now;

        return { providers: newProviders, prompts: newPrompts };
    } catch (error) {
        console.error("[getAIConfigs] Failed to fetch configs from DB", error);
        // Return empty on failure to trigger fallback to default constants
        return { providers: cachedProviders || {}, prompts: cachedPrompts || {} };
    }
}
