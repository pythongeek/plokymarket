/**
 * Fiscal Watchdog — Audit Agent Integration
 *
 * Admin-level fiscal integrity monitoring service.
 * Provides `runFiscalAudit()` for cron job integration (every 10 minutes).
 * Fetches global financial state from Supabase, runs the Audit Agent,
 * and takes emergency action on BREACHED status.
 *
 * Usage:
 *   import { runFiscalAudit } from '@/lib/admin/fiscal-watchdog';
 *   const result = await runFiscalAudit(); // cron every 10 min
 */

import {
    runAuditAgent,
    type AuditAgentResult,
    type PlatformFinancialState,
} from '@/lib/ai-agents/vertex-audit-agent';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FiscalAuditResult {
    status: string;
    emergencyTriggered: boolean;
    auditResult: AuditAgentResult;
}

// ── Fetch global financial state ────────────────────────────────────────────

async function getGlobalFinancialState(): Promise<PlatformFinancialState> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Sum of all user balances
        const { data: walletSum } = await (supabase
            .rpc('get_total_balances') as any);

        // Sum of locked escrow
        const { data: escrowSum } = await (supabase
            .rpc('get_total_escrow') as any);

        // Total deposits
        const { data: depositSum } = await (supabase
            .from('wallet_transactions') as any)
            .select('amount')
            .eq('type', 'deposit')
            .eq('status', 'completed');

        // Total withdrawals
        const { data: withdrawalSum } = await (supabase
            .from('wallet_transactions') as any)
            .select('amount')
            .eq('type', 'withdrawal')
            .eq('status', 'completed');

        // Active markets count
        const { count: activeMarkets } = await (supabase
            .from('markets') as any)
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');

        const totalDeposits = (depositSum || []).reduce(
            (sum: number, d: any) => sum + (d.amount || 0),
            0
        );
        const totalWithdrawals = (withdrawalSum || []).reduce(
            (sum: number, w: any) => sum + (w.amount || 0),
            0
        );

        return {
            total_user_balances: walletSum?.total_balance || 0,
            total_locked_escrow: escrowSum?.total_escrow || 0,
            total_platform_fees: walletSum?.total_fees || 0,
            total_deposits: totalDeposits,
            total_withdrawals: totalWithdrawals,
            total_payouts: 0, // Can be enriched later
            pending_payouts: 0,
            active_markets_count: activeMarkets || 0,
            currency: '৳',
        };
    } catch (err) {
        console.warn(
            '[FiscalWatchdog] Failed to fetch financial state:',
            err instanceof Error ? err.message : err
        );
        return {
            total_user_balances: 0,
            total_locked_escrow: 0,
            total_platform_fees: 0,
            total_deposits: 0,
            total_withdrawals: 0,
            total_payouts: 0,
            pending_payouts: 0,
            active_markets_count: 0,
            currency: '৳',
        };
    }
}

// ── Emergency actions ───────────────────────────────────────────────────────

async function emergencyShutdownPayouts(): Promise<void> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        // Set platform config to disable payouts
        await (supabase.from('platform_config') as any).upsert({
            key: 'payouts_enabled',
            value: 'false',
            updated_at: new Date().toISOString(),
        });

        console.error('[FiscalWatchdog] ⛔ EMERGENCY: Payouts disabled!');
    } catch (err) {
        console.error('[FiscalWatchdog] Failed to disable payouts:', err);
    }
}

async function logAuditResult(result: AuditAgentResult): Promise<void> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        await (supabase.from('audit_logs') as any).insert({
            audit_type: 'fiscal_integrity',
            status: result.audit_report.status,
            reserve_ratio: result.audit_report.reserve_ratio,
            variance: result.audit_report.variance_detected,
            action: result.action_plan.recommended_action,
            details: JSON.stringify({
                reasoning_bn: result.forensic_details.reasoning_bn,
                affected_nodes: result.forensic_details.affected_nodes,
                suspicious_accounts: result.forensic_details.suspicious_accounts,
            }),
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[FiscalWatchdog] Failed to log audit result:', err);
    }
}

// ── Main cron function ──────────────────────────────────────────────────────

/**
 * Run the fiscal integrity audit.
 * Designed to run every 10 minutes via cron job.
 *
 * If BREACHED: disables payouts and logs emergency event.
 * If UNSTABLE: logs warning for admin review.
 * If HEALTHY: logs clean audit.
 */
export async function runFiscalAudit(): Promise<FiscalAuditResult> {
    console.log('[FiscalWatchdog] Starting scheduled fiscal audit');

    try {
        const platformStats = await getGlobalFinancialState();
        const auditResult = await runAuditAgent({ platformStats });

        let emergencyTriggered = false;

        if (auditResult.audit_report.status === 'BREACHED') {
            console.error(
                `[FiscalWatchdog] ⛔ FISCAL BREACH DETECTED — variance: ${auditResult.audit_report.variance_detected}`
            );
            await emergencyShutdownPayouts();
            emergencyTriggered = true;
        } else if (auditResult.audit_report.status === 'UNSTABLE') {
            console.warn(
                `[FiscalWatchdog] ⚠️ Fiscal instability — reserve ratio: ${auditResult.audit_report.reserve_ratio}`
            );
        } else {
            console.log(
                `[FiscalWatchdog] ✅ Healthy — reserve ratio: ${auditResult.audit_report.reserve_ratio}`
            );
        }

        await logAuditResult(auditResult);

        return {
            status: auditResult.audit_report.status,
            emergencyTriggered,
            auditResult,
        };
    } catch (err) {
        console.error('[FiscalWatchdog] Audit failed:', err);
        return {
            status: 'FAILED',
            emergencyTriggered: false,
            auditResult: {
                audit_report: { status: 'UNSTABLE', reserve_ratio: 0, variance_detected: 0 },
                forensic_details: {
                    reasoning_bn: 'অডিট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। ম্যানুয়ালি যাচাই করুন।',
                    affected_nodes: [],
                    suspicious_accounts: [],
                },
                action_plan: {
                    recommended_action: 'NO_ACTION',
                    admin_instruction_bn: 'অডিট এজেন্ট ত্রুটি দিয়েছে। ম্যানুয়ালি ড্যাশবোর্ড চেক করুন।',
                },
            },
        };
    }
}

// Re-export
export type { AuditAgentResult } from '@/lib/ai-agents/vertex-audit-agent';
