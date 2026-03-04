/**
 * Support Service — Concierge Mentor Pro Integration
 *
 * User-facing support chat integration for the MoAgent Garden Concierge Agent.
 * Provides `handleSupportQuery()` for the ChatWidget component.
 *
 * Usage in components/support/ChatWidget.tsx:
 *   import { handleSupportQuery } from '@/lib/support-service';
 *   const response = await handleSupportQuery(userMessage, userId);
 */

import {
    runConciergeAgent,
    type ConciergeResponse,
    type ConciergeInput,
    type UserAccountSummary,
    type ConversationTurn,
} from '@/lib/ai-agents/vertex-concierge-agent';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SupportQueryResult {
    text_bn: string;
    suggested_actions: Array<{
        label_bn: string;
        action: string;
        url?: string;
    }>;
    category: string;
    needsHumanAdmin: boolean;
    responsibleGamingAlert?: string;
}

// ── Fetch user account summary from Supabase ──────────────────────────────

async function getUserAccountSummary(
    userId: string
): Promise<UserAccountSummary> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Get wallet balance
        const { data: wallet } = await (supabase
            .from('wallets') as any)
            .select('balance, locked_balance')
            .eq('user_id', userId)
            .single();

        // Get trade count & win/loss stats
        const { count: totalTrades } = await (supabase
            .from('trades') as any)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Get user profile for membership date
        const { data: profile } = await (supabase
            .from('profiles') as any)
            .select('created_at, preferred_payment')
            .eq('id', userId)
            .single();

        return {
            balance: wallet?.balance ?? 0,
            lockedBalance: wallet?.locked_balance ?? 0,
            totalTrades: totalTrades ?? 0,
            recentWins: 0,   // Can be enriched later
            recentLosses: 0, // Can be enriched later
            depositMethod: profile?.preferred_payment || 'bKash',
            memberSince: profile?.created_at || undefined,
        };
    } catch (err) {
        console.warn(
            '[Support] Failed to fetch user account summary:',
            err instanceof Error ? err.message : err
        );
        return {};
    }
}

// ── Main support handler ────────────────────────────────────────────────────

/**
 * Handle a user support query through the Concierge Mentor Pro.
 *
 * @param userMessage - The user's message in Bengali or English
 * @param userId - Optional user ID for personalized context
 * @param conversationHistory - Optional previous conversation turns
 */
export async function handleSupportQuery(
    userMessage: string,
    userId?: string,
    conversationHistory?: ConversationTurn[]
): Promise<SupportQueryResult> {
    console.log(
        `[Support] Handling query${userId ? ` for user ${userId}` : ''}: "${userMessage.substring(0, 50)}"`
    );

    // Fetch user context if userId is provided
    let userContext: UserAccountSummary | undefined;
    if (userId) {
        userContext = await getUserAccountSummary(userId);
    }

    const conciergeInput: ConciergeInput = {
        message: userMessage,
        userId,
        userContext,
        conversationHistory,
        dataStore: 'plokymarket-docs-v1',
    };

    const conciergeResponse = await runConciergeAgent(conciergeInput);

    // Log if escalation is needed
    if (conciergeResponse.is_escalation_needed) {
        console.warn(
            `[Support] ⚠️ User ${userId || 'anonymous'} needs human admin escalation`
        );
    }

    // Log responsible gaming alerts
    if (conciergeResponse.responsible_gaming_alert) {
        console.warn(
            `[Support] 🎰 Responsible gaming alert for user ${userId || 'anonymous'}: ${conciergeResponse.responsible_gaming_alert}`
        );
    }

    return {
        text_bn: conciergeResponse.text_bn,
        suggested_actions: conciergeResponse.suggested_actions,
        category: conciergeResponse.category,
        needsHumanAdmin: conciergeResponse.is_escalation_needed,
        responsibleGamingAlert: conciergeResponse.responsible_gaming_alert,
    };
}

// Re-export types
export type { ConciergeResponse, ConversationTurn } from '@/lib/ai-agents/vertex-concierge-agent';
