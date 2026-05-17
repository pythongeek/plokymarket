/**
 * Server-only alert wrapper with DB persistence.
 * Use this in Node.js API routes (NOT Edge Runtime).
 * Calls sendSystemAlert() + logSystemError() for dashboard visibility.
 */

import { sendSystemAlert, type AlertLevel } from './alerts';
import { logSystemError } from './error-logger';

export async function sendSystemAlertWithPersistence(
  level: AlertLevel,
  component: string,
  message: string,
  meta?: Record<string, any>
): Promise<{ sent: boolean; persisted: boolean; reason?: string }> {
  const alertResult = await sendSystemAlert(level, component, message, meta);

  let persisted = false;
  try {
    await logSystemError({
      level: level === 'CRITICAL' ? 'critical' : level === 'WARN' ? 'warn' : 'alert',
      source: component,
      message: `[ALERT] ${message}`,
      meta,
    });
    persisted = true;
  } catch {
    // Best-effort persistence
  }

  return { sent: alertResult.sent, persisted, reason: alertResult.reason };
}
