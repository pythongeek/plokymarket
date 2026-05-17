/**
 * Admin Activity Logger
 * Helper functions for logging admin actions
 * Writes to admin_audit_log (single source of truth)
 */

import { pool } from '@/lib/admin/local-db';

interface LogAdminActionParams {
  admin_id: string;
  action_type:
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'resolve_event'
  | 'approve_topic'
  | 'reject_topic'
  | 'pause_market'
  | 'resume_market'
  | 'add_expert'
  | 'remove_expert'
  | 'resolve_dispute'
  | 'manual_override'
  | 'update_oracle'
  | 'emergency_action'
  | 'verify_expert'
  | 'create_dispute'
  | 'verify_deposit'
  | 'process_withdrawal'
  | 'approve_kyc'
  | 'reject_kyc'
  | 'add_note'
  | 'update_settings'
  | 'create_liquidity_pool'
  | 'update_liquidity_pool';
  resource_type?: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  workflow_id?: string;
}

/**
 * Log admin action directly to admin_audit_log
 * Use this for synchronous logging (immediate actions)
 */
export async function logAdminAction({
  admin_id,
  action_type,
  resource_type,
  resource_id,
  old_values = {},
  new_values = {},
  reason = '',
  ip_address,
  user_agent,
}: LogAdminActionParams): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Ensure ip_address/user_agent columns exist
    try {
      await pool.query(`
        ALTER TABLE admin_audit_log 
        ADD COLUMN IF NOT EXISTS ip_address text,
        ADD COLUMN IF NOT EXISTS user_agent text
      `);
    } catch {
      // Idempotent — safe to ignore
    }

    const result = await pool.query(
      `INSERT INTO admin_audit_log
        (admin_id, action, entity_type, entity_id, old_value, new_value, reason, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id`,
      [
        admin_id,
        action_type,
        resource_type || null,
        resource_id || null,
        old_values && Object.keys(old_values).length ? JSON.stringify(old_values) : null,
        new_values && Object.keys(new_values).length ? JSON.stringify(new_values) : null,
        reason || null,
        ip_address || null,
        user_agent || null,
      ]
    );

    return { success: true, logId: result.rows[0]?.id };
  } catch (error: any) {
    console.error('Failed to log admin action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log admin action with request metadata (IP + User-Agent)
 * Use this server-side when you have access to the NextRequest
 */
export async function logAdminActionServer(
  req: Request,
  params: Omit<LogAdminActionParams, 'ip_address' | 'user_agent'>
): Promise<{ success: boolean; logId?: string; error?: string }> {
  const headers = req.headers;
  const ip_address = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
  const user_agent = headers.get('user-agent') || 'unknown';

  return logAdminAction({
    ...params,
    ip_address,
    user_agent,
  });
}
