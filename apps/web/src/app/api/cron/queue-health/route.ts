import { NextRequest, NextResponse } from "next/server";
import { getQueueHealthSnapshot } from "@/lib/qstash/metrics";
import { sendSystemAlert } from "@/lib/monitoring/alerts";
import { withQStashAuth } from "@/lib/qstash/verify";

export const runtime = "edge";

const DLQ_ALERT_THRESHOLD = 10;

/**
 * Proactive Queue Health Cron
 * Triggered every 5 minutes via QStash schedule.
 * Checks DLQ count and circuit breaker states.
 * Sends CRITICAL alerts if thresholds breached.
 */
export const POST = withQStashAuth(async (req: NextRequest) => {
  try {
    const snapshot = await getQueueHealthSnapshot();

    const alerts: string[] = [];

    // DLQ threshold check
    if (snapshot.dlq.messageCount > DLQ_ALERT_THRESHOLD) {
      const msg = `DLQ has ${snapshot.dlq.messageCount} messages (threshold: ${DLQ_ALERT_THRESHOLD})`;
      alerts.push(msg);
      await sendSystemAlert("CRITICAL", "QueueHealth", msg, {
        dlqCount: snapshot.dlq.messageCount,
        threshold: DLQ_ALERT_THRESHOLD,
      });
    }

    // Circuit breaker OPEN check
    const openBreakers = snapshot.circuitBreakers.filter(
      (cb) => cb.status === "open"
    );
    for (const cb of openBreakers) {
      const msg = `Circuit breaker OPEN for ${cb.service} (${cb.failures} failures)`;
      alerts.push(msg);
      await sendSystemAlert("CRITICAL", "QueueHealth", msg, {
        service: cb.service,
        failures: cb.failures,
        openedAt: cb.openedAt,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: snapshot.timestamp,
      dlq: snapshot.dlq,
      circuitBreakers: snapshot.circuitBreakers,
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error("[QueueHealth] Cron error:", error);
    await sendSystemAlert("CRITICAL", "QueueHealth", `Health check crashed: ${error.message}`);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});
