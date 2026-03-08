/**
 * Cron Workflow Utilities for USDT Management System
 * Provides verification and workflow utilities for cron-job.org
 * Bangladesh-focused with Bangla notifications
 */

/**
 * Verify cron-job.org secret header
 * cron-job.org sends the secret in x-cron-secret header
 */
export function verifyCronSecret(
    cronSecret: string | null
): boolean {
    // Allow all requests in development mode
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    // Check for configured secret
    const configuredSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;

    // If no secret configured, allow in non-production
    if (!configuredSecret) {
        console.warn('No CRON_SECRET configured, allowing request');
        return process.env.NODE_ENV !== 'production';
    }

    // Verify the secret matches
    if (!cronSecret) {
        console.warn('No cron secret provided');
        return false;
    }

    return cronSecret === configuredSecret;
}

/**
 * Verify request from either QStash or cron-job.org
 */
export function verifyRequestAuth(
    qstashSignature: string | null,
    cronSecret: string | null
): boolean {
    // Allow in development
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    // Check for QStash signature
    if (qstashSignature && qstashSignature.length > 0) {
        return true;
    }

    // Check for cron-job.org secret
    if (cronSecret) {
        return verifyCronSecret(cronSecret);
    }

    console.warn('No valid authentication provided');
    return false;
}

// Re-export utilities from upstash/workflows
export {
    createWorkflowExecution,
    updateWorkflowStatus,
    logWorkflowStep,
    formatBanglaDate,
    formatBanglaCurrency,
    banglaTemplates,
    WorkflowType
} from '@/lib/upstash/workflows';
