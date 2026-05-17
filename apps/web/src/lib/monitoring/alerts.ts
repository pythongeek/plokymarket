/**
 * Centralized System Alerting Service
 *
 * Posts critical/warning alerts to Discord/Slack webhook.
 * Fails loud: logs to console if webhook URL missing, never crashes app.
 *
 * NOTE: This file is Edge Runtime compatible. For DB persistence,
 * use sendSystemAlertWithPersistence() from alert-persistence.ts (Node.js only).
 */

export type AlertLevel = "WARN" | "CRITICAL" | "INFO";

export interface AlertPayload {
  level: AlertLevel;
  component: string;
  message: string;
  meta?: Record<string, any>;
  timestamp: string;
}

const WEBHOOK_URL = (): string | undefined => process.env.ALERT_WEBHOOK_URL;

/**
 * Send a system alert to the configured webhook (Discord/Slack).
 * If webhook URL is missing, logs loudly to console.error.
 */
export async function sendSystemAlert(
  level: AlertLevel,
  component: string,
  message: string,
  meta?: Record<string, any>
): Promise<{ sent: boolean; reason?: string }> {
  const payload: AlertPayload = {
    level,
    component,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  // Always log locally
  const logLine = `[ALERT ${level}] ${component}: ${message}`;
  if (level === "CRITICAL") {
    console.error(logLine, meta || "");
  } else if (level === "WARN") {
    console.warn(logLine, meta || "");
  } else {
    console.log(logLine, meta || "");
  }

  const url = WEBHOOK_URL();
  if (!url) {
    console.error(
      "[ALERT] ALERT_WEBHOOK_URL is not set. Alert cannot be sent to external channel."
    );
    return { sent: false, reason: "ALERT_WEBHOOK_URL not configured" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formatForDiscord(payload)),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "unknown");
      console.error(`[ALERT] Webhook returned ${response.status}: ${text}`);
      return { sent: false, reason: `HTTP ${response.status}: ${text}` };
    }

    return { sent: true };
  } catch (error: any) {
    console.error(`[ALERT] Failed to send webhook: ${error.message}`);
    return { sent: false, reason: error.message };
  }
}

/**
 * Format alert payload for Discord webhook.
 */
function formatForDiscord(payload: AlertPayload): Record<string, any> {
  const color =
    payload.level === "CRITICAL"
      ? 15158332 // red
      : payload.level === "WARN"
      ? 16776960 // yellow
      : 3447003; // blue

  return {
    embeds: [
      {
        title: `[${payload.level}] ${payload.component}`,
        description: payload.message,
        color,
        fields: payload.meta
          ? Object.entries(payload.meta).map(([name, value]) => ({
              name: name.slice(0, 256),
              value: String(value).slice(0, 1024),
              inline: true,
            }))
          : [],
        timestamp: payload.timestamp,
      },
    ],
  };
}

/**
 * Send a circuit breaker OPEN alert.
 */
export async function sendCircuitBreakerAlert(
  service: string,
  failureCount: number,
  timeoutMs: number
): Promise<void> {
  await sendSystemAlert(
    "CRITICAL",
    "CircuitBreaker",
    `Circuit OPEN for ${service} — ${failureCount} failures. Cooling for ${timeoutMs / 1000}s.`,
    { service, failureCount, cooldownSeconds: timeoutMs / 1000 }
  );
}

/**
 * Send a workflow failure alert.
 */
export async function sendWorkflowFailureAlert(
  workflowName: string,
  error: string,
  nodeName?: string
): Promise<void> {
  await sendSystemAlert(
    "CRITICAL",
    "n8nWorkflow",
    `Workflow "${workflowName}" failed${nodeName ? ` at node "${nodeName}"` : ""}: ${error}`,
    { workflowName, error, nodeName }
  );
}
