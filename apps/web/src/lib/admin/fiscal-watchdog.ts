/**
 * Fiscal Watchdog — Audit Agent Integration
 *
 * Admin-level fiscal integrity monitoring service.
 * Provides `runFiscalAudit()` for cron job integration (every 10 minutes).
 * Fetches global financial state from Supabase, runs the Audit Agent,
 * and takes emergency action on BREACHED status.
 */

import { pool } from '@/lib/admin/local-db';
import {
    runAuditAgent,
    type AuditAgentResult,
    type PlatformFinancialState,
} from '@/lib/ai-agents/vertex-audit-agent';

// —— Types ———————————————————————————————————————————————————

export interface FiscalAuditResult {
    status: string;
    emergencyTriggered: boolean;
    auditResult: AuditAgentResult;
}

// —— Fetch global financial state ————————————————————————————————————————

async function getGlobalFinancialState(): Promise<PlatformFinancialState> {
    try {
        // Sum of all user balances
        const walletSumResult = await pool.query(
            `SELECT COALESCE(SUM(balance), 0) as total_balance FROM wallets`
        );

        // Sum of locked escrow
        const escrowSumResult = await pool.query(
            `SELECT COALESCE(SUM(locked_amount), 0) as total_escrow FROM wallets`
        );

        // Total completed deposits
        const depositSumResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions WHERE type = 'deposit' AND status = 'completed'`
        );

        // Total completed withdrawals
        const withdrawalSumResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total FROM wallet_transactions WHERE type = 'withdrawal' AND status = 'completed'`
        );

        // Active markets count
        const activeMarketsResult = await pool.query(
            `SELECT COUNT(*) as count FROM markets WHERE status = 'active'`
        );

        // Total platform fees collected
        const feesResult = await pool.query(
            `SELECT COALESCE(SUM(fee_amount), 0) as total FROM trades`
        );

        return {
            total_user_balances: Number(walletSumResult.rows[0]?.total_balance) || 0,
            total_locked_escrow: Number(escrowSumResult.rows[0]?.total_escrow) || 0,
            total_platform_fees: Number(feesResult.rows[0]?.total) || 0,
            total_deposits: Number(depositSumResult.rows[0]?.total) || 0,
            total_withdrawals: Number(withdrawalSumResult.rows[0]?.total) || 0,
            total_payouts: 0,
            pending_payouts: 0,
            active_markets_count: Number(activeMarketsResult.rows[0]?.count) || 0,
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

// —— Emergency actions —————————————————————————————————————————————————

async function emergencyShutdownPayouts(): Promise<void> {
    try {
        await pool.query(
            `UPDATE site_settings SET setting_value = 'false' WHERE id = 'payouts_enabled'`
        );
        console.error('[FiscalWatchdog] ⛔ EMERGENCY: Payouts disabled!');
    } catch (err) {
        console.error('[FiscalWatchdog] Failed to disable payouts:', err);
    }
}

async function logAuditResult(result: AuditAgentResult): Promise<void> {
    try {
        await pool.query(
            `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                'system',
                'fiscal_audit',
                'platform',
                'fiscal_integrity',
                JSON.stringify({
                    status: result.audit_report.status,
                    reserve_ratio: result.audit_report.reserve_ratio,
                    variance: result.audit_report.variance_detected,
                }),
                JSON.stringify({
                    action: result.action_plan.recommended_action,
                    reasoning: result.forensic_details.reasoning_bn,
                    affected_nodes: result.forensic_details.affected_nodes,
                    suspicious_accounts: result.forensic_details.suspicious_accounts,
                }),
                '127.0.0.1',
            ]
        );
    } catch (err) {
        console.error('[FiscalWatchdog] Failed to log audit result:', err);
    }
}

// —— Main cron function ———————————————————————————————————————————————————

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
                    reasoning_bn: 'অডিট প্রক্রিযাকরণে ত্রুটি ঘটেছে। ম্যানুযালি যাচাই করুন।',
                    affected_nodes: [],
                    suspicious_accounts: [],
                },
                action_plan: {
                    recommended_action: 'NO_ACTION',
                    admin_instruction_bn: 'অডিট এজেন্ট ত্রুটি দিয়েছে। ম্যানুযালি ড্যাশবোর্ড চেক করুন।',
                },
            },
        };
    }
}

// Re-export
export type { AuditAgentResult } from '@/lib/ai-agents/vertex-audit-agent';
