/**
 * React Hook for Managing cron-job.org Jobs
 * Used in Admin Panel to view and manage cron jobs via cron-job.org REST API
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CronJob {
    id: number;
    url: string;
    name: string;
    schedule: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    created_at: string;
    last_execution: string | null;
    last_status: number | null;
    is_active: boolean;
    execution_count: number;
    request_count: number;
}

export interface CronJobStats {
    total_requests: number;
    request_limit: number;
    usage_percentage: number;
    active_jobs: number;
    total_jobs: number;
}

interface CreateJobInput {
    name: string;
    url: string;
    schedule: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    is_active?: boolean;
}

interface UseCronJobManagerReturn {
    jobs: CronJob[];
    stats: CronJobStats | null;
    loading: boolean;
    error: string | null;
    createJob: (job: CreateJobInput) => Promise<void>;
    updateJob: (id: number, updates: Partial<CronJob>) => Promise<void>;
    deleteJob: (id: number) => Promise<void>;
    toggleJob: (id: number) => Promise<void>;
    triggerJob: (id: number) => Promise<void>;
    refresh: () => Promise<void>;
}

// Default workflows to manage
export const DEFAULT_CRON_JOBS = {
    'fast-crypto': {
        name: 'Crypto Market Data (5 min)',
        url: '/api/workflows/execute-crypto',
        schedule: '*/5 * * * *',
        method: 'POST' as const,
        description: 'Fetches crypto market data every 5 minutes',
    },
    'fast-exchange-rate': {
        name: 'USDT Exchange Rate (5 min)',
        url: '/api/workflows/update-exchange-rate',
        schedule: '*/5 * * * *',
        method: 'POST' as const,
        description: 'Updates USDT exchange rate every 5 minutes',
    },
    'fast-escalations': {
        name: 'Support Escalations (5 min)',
        url: '/api/workflows/check-escalations',
        schedule: '*/5 * * * *',
        method: 'POST' as const,
        description: 'Checks support escalations every 5 minutes',
    },
    'fast-market-close': {
        name: 'Market Close Check (5 min)',
        url: '/api/workflows/market-close-check',
        schedule: '*/5 * * * *',
        method: 'POST' as const,
        description: 'Checks markets approaching close every 5 minutes',
    },
    'medium-sports': {
        name: 'Sports Data (10 min)',
        url: '/api/workflows/execute-sports',
        schedule: '*/10 * * * *',
        method: 'POST' as const,
        description: 'Fetches sports data every 10 minutes',
    },
    'medium-auto-verify': {
        name: 'Auto Verification (10 min)',
        url: '/api/workflows/auto-verify',
        schedule: '*/10 * * * *',
        method: 'POST' as const,
        description: 'Auto-verifies markets every 10 minutes',
    },
    'hourly-analytics': {
        name: 'Daily Analytics (Hourly)',
        url: '/api/workflows/analytics/daily',
        schedule: '0 * * * *',
        method: 'POST' as const,
        description: 'Updates analytics every hour',
    },
    'hourly-tick-adjustment': {
        name: 'Tick Adjustment (Hourly)',
        url: '/api/workflows/tick-adjustment',
        schedule: '30 * * * *',
        method: 'POST' as const,
        description: 'Adjusts market ticks every hour',
    },
    'hourly-batch-markets': {
        name: 'Batch Markets (Hourly)',
        url: '/api/workflows/batch-markets',
        schedule: '15 * * * *',
        method: 'POST' as const,
        description: 'Creates batch markets every hour',
    },
    'hourly-price-snapshot': {
        name: 'Price Snapshot (Hourly)',
        url: '/api/workflows/price-snapshot',
        schedule: '45 * * * *',
        method: 'POST' as const,
        description: 'Takes price snapshots every hour',
    },
    'daily-leaderboard': {
        name: 'Leaderboard (Daily)',
        url: '/api/workflows/leaderboard',
        schedule: '0 0 * * *',
        method: 'POST' as const,
        description: 'Updates leaderboard daily at midnight',
    },
    'daily-ai-topics': {
        name: 'AI Topics (Daily)',
        url: '/api/workflows/ai-topics',
        schedule: '30 0 * * *',
        method: 'POST' as const,
        description: 'Generates AI topics daily at midnight',
    },
    'daily-cleanup': {
        name: 'Cleanup (Daily)',
        url: '/api/workflows/cleanup',
        schedule: '0 1 * * *',
        method: 'POST' as const,
        description: 'Cleans up expired data daily at 1am',
    },
    'daily-report': {
        name: 'Daily Report (Daily)',
        url: '/api/workflows/daily-report',
        schedule: '30 1 * * *',
        method: 'POST' as const,
        description: 'Sends daily report at 1:30am',
    },
    'quarterly-dispute': {
        name: 'Dispute Workflow (Every 6h)',
        url: '/api/workflows/dispute',
        schedule: '0 */6 * * *',
        method: 'POST' as const,
        description: 'Checks disputes every 6 hours',
    },
    'resolution-trigger': {
        name: 'Resolution Trigger (Every 15 min)',
        url: '/api/workflows/resolution-trigger',
        schedule: '*/15 * * * *',
        method: 'POST' as const,
        description: 'Triggers market resolution checks every 15 minutes',
    },
    'event-processor': {
        name: 'Event Processor (Every 10 min)',
        url: '/api/workflows/event-processor',
        schedule: '*/10 * * * *',
        method: 'POST' as const,
        description: 'Processes events every 10 minutes',
    },
    'deposit-check': {
        name: 'Deposit Check (Every 5 min)',
        url: '/api/workflows/deposit',
        schedule: '*/5 * * * *',
        method: 'POST' as const,
        description: 'Checks pending deposits every 5 minutes',
    },
};

export function useCronJobManager(): UseCronJobManagerReturn {
    const [jobs, setJobs] = useState<CronJob[]>([]);
    const [stats, setStats] = useState<CronJobStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/admin/cron-jobs', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to fetch cron jobs');
            }

            const data = await response.json();
            setJobs(data.jobs || []);
            setStats(data.stats || null);
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching cron jobs:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const createJob = async (job: CreateJobInput) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch('/api/admin/cron-jobs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(job),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to create cron job');
            }

            await fetchJobs();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateJob = async (id: number, updates: Partial<CronJob>) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/admin/cron-jobs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to update cron job');
            }

            await fetchJobs();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (id: number) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/admin/cron-jobs/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to delete cron job');
            }

            await fetchJobs();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const toggleJob = async (id: number) => {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        await updateJob(id, { is_active: !job.is_active });
    };

    const triggerJob = async (id: number) => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`/api/admin/cron-jobs/${id}/trigger`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to trigger cron job');
            }

            await fetchJobs();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        jobs,
        stats,
        loading,
        error,
        createJob,
        updateJob,
        deleteJob,
        toggleJob,
        triggerJob,
        refresh: fetchJobs,
    };
}

export default useCronJobManager;
