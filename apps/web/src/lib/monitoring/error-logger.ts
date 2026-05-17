/**
 * Centralized Error Logger
 * Writes API 500s and unhandled rejections to system_errors table.
 * Uses dynamic import to avoid bundling pg in Edge Runtime.
 * Gracefully falls back to console.error if DB write fails.
 */
import { NextResponse } from 'next/server';

export type ErrorLevel = 'error' | 'warn' | 'critical' | 'alert';

export interface ErrorLogInput {
  level: ErrorLevel;
  source: string;
  message: string;
  stack?: string;
  route?: string;
  method?: string;
  meta?: Record<string, any>;
}

/**
 * Persist an error to the system_errors table.
 * Uses dynamic import so pg is only loaded at runtime (Node.js).
 * Never throws — logs to console if DB is down.
 */
export async function logSystemError(input: ErrorLogInput): Promise<void> {
  try {
    const { pool } = await import('../admin/local-db');
    await pool.query(
      `INSERT INTO system_errors (level, source, message, stack, route, method, meta)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.level,
        input.source,
        input.message?.slice(0, 2000) ?? '',
        input.stack?.slice(0, 4000) ?? null,
        input.route ?? null,
        input.method ?? null,
        input.meta ? JSON.stringify(input.meta) : null,
      ]
    );
  } catch (dbErr: any) {
    console.error('[ErrorLogger] Failed to persist error to DB:', dbErr.message);
    console.error('[ErrorLogger] Original error:', input.message);
  }
}

/**
 * Catch-all API error wrapper.
 * Logs the error and returns a JSON response.
 */
export async function handleApiError(
  route: string,
  method: string,
  error: any,
  res: Response | null = null
): Promise<NextResponse> {
  const level: ErrorLevel = error?.status >= 500 ? 'critical' : 'error';
  await logSystemError({
    level,
    source: 'API',
    message: error?.message || String(error),
    stack: error?.stack,
    route,
    method,
  });

  return NextResponse.json(
    { error: 'Internal server error', requestId: crypto.randomUUID() },
    { status: 500 }
  );
}

/**
 * Initialize global unhandled rejection / uncaught exception hooks.
 * Call once at app startup (e.g., in middleware or layout).
 */
export function initGlobalErrorHooks(): void {
  if (typeof process === 'undefined') return; // Skip in browser

  process.on('unhandledRejection', async (reason: any) => {
    await logSystemError({
      level: 'critical',
      source: 'unhandledRejection',
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
    console.error('[Unhandled Rejection]', reason);
  });

  process.on('uncaughtException', async (err: Error) => {
    await logSystemError({
      level: 'critical',
      source: 'uncaughtException',
      message: err.message,
      stack: err.stack,
    });
    console.error('[Uncaught Exception]', err);
    // Let PM2/container restart the process
    process.exit(1);
  });
}
