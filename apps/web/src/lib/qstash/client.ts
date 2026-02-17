/**
 * Upstash QStash Client
 * For scheduling cron jobs and publishing messages
 */

const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

interface PublishOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  delay?: number; // Delay in seconds
  retries?: number;
}

interface ScheduleOptions {
  cron: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  retries?: number;
}

/**
 * Publish a message to a URL via QStash
 */
export async function publishMessage(
  url: string,
  options: PublishOptions = {}
): Promise<{ messageId: string; scheduleId?: string }> {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${QSTASH_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add delay if specified
  if (options.delay && options.delay > 0) {
    headers['Upstash-Delay'] = `${options.delay}s`;
  }

  // Add retries if specified
  if (options.retries !== undefined) {
    headers['Upstash-Retries'] = String(options.retries);
  }

  const response = await fetch(`${QSTASH_URL}/v2/publish/${encodeURIComponent(url)}`, {
    method: 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash publish failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    messageId: data.messageId,
    scheduleId: data.scheduleId,
  };
}

/**
 * Create a scheduled job via QStash
 */
export async function createSchedule(
  url: string,
  options: ScheduleOptions
): Promise<{ scheduleId: string }> {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${QSTASH_TOKEN}`,
    'Content-Type': 'application/json',
    'Upstash-Cron': options.cron,
  };

  if (options.retries !== undefined) {
    headers['Upstash-Retries'] = String(options.retries);
  }

  const response = await fetch(`${QSTASH_URL}/v2/schedules/${encodeURIComponent(url)}`, {
    method: 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash schedule creation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    scheduleId: data.scheduleId,
  };
}

/**
 * List all schedules
 */
export async function listSchedules(): Promise<Array<{
  scheduleId: string;
  cron: string;
  destination: string;
  createdAt: number;
}>> {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash list schedules failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  const response = await fetch(`${QSTASH_URL}/v2/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash delete schedule failed: ${response.status} - ${error}`);
  }
}

/**
 * Get logs for a message
 */
export async function getMessageLogs(messageId: string): Promise<unknown> {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN environment variable is not set');
  }

  const response = await fetch(`${QSTASH_URL}/v2/logs/${messageId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QStash get logs failed: ${response.status} - ${error}`);
  }

  return response.json();
}
