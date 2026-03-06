/**
 * cron-job.org API Service
 * Manages cron jobs via cron-job.org API
 * API Documentation: https://cron-job.org/en/docs/
 */

const API_BASE_URL = 'https://api.cron-job.org';

interface CronJob {
    job_id?: number;
    url: string;
    name: string;
    schedule: {
        timezone: string;
        hours: number[];
        days_of_month: number[];
        days_of_week: number[];
        months: number[];
    };
    enabled: boolean;
    saveResponses: boolean;
    is_public: boolean;
    skip_on_first_fail?: boolean;
}

interface CronJobResponse {
    jobId?: number;
    success?: boolean;
    message?: string;
}

export const cronManager = {
    /**
     * Get list of all cron jobs
     */
    listJobs: async (): Promise<any> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to list jobs: ${error.message || response.statusText}`);
        }

        return response.json();
    },

    /**
     * Create a new cron job
     */
    createJob: async (jobData: CronJob): Promise<CronJobResponse> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job: jobData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create job: ${error.message || response.statusText}`);
        }

        const result = await response.json();
        return {
            jobId: result.jobId,
            success: true,
            message: 'Job created successfully'
        };
    },

    /**
     * Update an existing cron job
     */
    updateJob: async (jobId: number, jobData: Partial<CronJob>): Promise<CronJobResponse> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job: jobData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to update job: ${error.message || response.statusText}`);
        }

        return {
            jobId,
            success: true,
            message: 'Job updated successfully'
        };
    },

    /**
     * Delete a cron job
     */
    deleteJob: async (jobId: number): Promise<CronJobResponse> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to delete job: ${error.message || response.statusText}`);
        }

        return {
            jobId,
            success: true,
            message: 'Job deleted successfully'
        };
    },

    /**
     * Run a cron job immediately
     */
    runNow: async (jobId: number): Promise<CronJobResponse> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to run job: ${error.message || response.statusText}`);
        }

        return {
            jobId,
            success: true,
            message: 'Job execution started'
        };
    },

    /**
     * Get job execution history
     */
    getJobHistory: async (jobId: number, limit: number = 10): Promise<any> => {
        const apiToken = process.env.CRONJOB_API_TOKEN;

        if (!apiToken) {
            throw new Error('CRONJOB_API_TOKEN is not configured');
        }

        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/history?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get job history: ${error.message || response.statusText}`);
        }

        return response.json();
    },

    /**
     * Enable or disable a cron job
     */
    toggleJob: async (jobId: number, enabled: boolean): Promise<CronJobResponse> => {
        return cronManager.updateJob(jobId, { enabled });
    }
};

/**
 * Helper to create a standard Plokymarket cron job
 */
export function createStandardJobConfig(
    endpoint: string,
    name: string,
    cronExpression: string,
    secret: string
): CronJob {
    // Parse cron expression (simplified - cron-job.org uses specific format)
    // Format: minutes (0-59), hours (0-23), days of month (1-31), months (1-12), days of week (0-6)
    const [minutes, hours, daysOfMonth, months, daysOfWeek] = cronExpression.split(' ');

    return {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://polkm.bet'}${endpoint}`,
        name,
        schedule: {
            timezone: 'Asia/Dhaka',
            hours: hours === '*' ? Array.from({ length: 24 }, (_, i) => i) : hours.split(',').map(Number),
            days_of_month: daysOfMonth === '*' ? Array.from({ length: 31 }, (_, i) => i + 1) : daysOfMonth.split(',').map(Number),
            days_of_week: daysOfWeek === '*' ? Array.from({ length: 7 }, (_, i) => i) : daysOfWeek.split(',').map(Number),
            months: months === '*' ? Array.from({ length: 12 }, (_, i) => i + 1) : months.split(',').map(Number)
        },
        enabled: true,
        saveResponses: true,
        is_public: false
    };
}

export default cronManager;
