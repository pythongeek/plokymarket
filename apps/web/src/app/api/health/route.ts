/**
 * Public health check endpoint
 * Returns minimal status only — no internal infrastructure details.
 * Detailed telemetry lives behind auth at /api/admin/system/pulse
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
