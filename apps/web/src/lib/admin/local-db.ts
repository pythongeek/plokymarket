/**
 * Direct PostgreSQL pool for local database access.
 * Bypasses JWT auth issues when connecting server-side to local Supabase/PostgreSQL.
 * Used instead of createServiceClient() for admin routes that need DB writes.
 */
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[local-db] Unexpected pool error:', err.message);
});

export { pool, PoolClient };

// ─── Typed query helpers ───────────────────────────────────────────────────

/**
 * Get admin profile from local DB.
 * Returns { is_admin, is_super_admin, email, full_name } or null.
 */
export async function getAdminProfile(userId: string): Promise<{
  is_admin: boolean;
  is_super_admin: boolean;
  email?: string;
  full_name?: string;
} | null> {
  const result = await pool.query(
    `SELECT is_admin, is_super_admin, email, full_name
     FROM user_profiles
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Upsert an admin profile. Used when an admin first logs in to ensure
 * they exist in the local user_profiles table.
 */
export async function ensureAdminProfile(
  userId: string,
  email: string,
  isAdmin = true,
  isSuperAdmin = false
): Promise<void> {
  await pool.query(
    `INSERT INTO user_profiles (id, email, is_admin, is_super_admin, kyc_status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'approved', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       is_admin = EXCLUDED.is_admin,
       is_super_admin = EXCLUDED.is_super_admin,
       updated_at = NOW()`,
    [userId, email, isAdmin, isSuperAdmin]
  );
}

/**
 * Generic SELECT query with optional filters.
 */
export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

/**
 * Generic INSERT that returns the inserted row(s).
 * Accepts a single record OR an array of records (bulk insert).
 */
export async function insert<T = any>(
  table: string,
  data: Record<string, any> | Record<string, any>[],
  returning = '*'
): Promise<T[]> {
  // Bulk insert
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]);
    const cols = keys.join(', ');
    const valuesList = data.map((row, rowIdx) => {
      return '(' + keys.map((_, colIdx) => `$${rowIdx * keys.length + colIdx + 1}`).join(', ') + ')';
    }).join(', ');
    const allValues = data.flatMap(row => keys.map(k => row[k]));
    const result = await pool.query(
      `INSERT INTO ${table} (${cols}) VALUES ${valuesList} RETURNING ${returning}`,
      allValues
    );
    return result.rows as T[];
  }

  // Single insert
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const cols = keys.join(', ');
  const result = await pool.query(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING ${returning}`,
    values
  );
  return result.rows as T[];
}

/**
 * Generic UPDATE with WHERE clause.
 */
export async function update(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning = '*'
): Promise<any[]> {
  const setKeys = Object.keys(data);
  const whereKeys = Object.keys(where);
  const allValues = [...Object.values(data), ...Object.values(where)];
  const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const whereClause = whereKeys
    .map((k, i) => `${k} = $${setKeys.length + i + 1}`)
    .join(' AND ');
  const result = await pool.query(
    `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`,
    allValues
  );
  return result.rows;
}

/**
 * Generic DELETE with WHERE clause.
 */
export async function remove(
  table: string,
  where: Record<string, any>
): Promise<number> {
  const whereKeys = Object.keys(where);
  const values = Object.values(where);
  const whereClause = whereKeys
    .map((k, i) => `${k} = $${i + 1}`)
    .join(' AND ');
  const result = await pool.query(
    `DELETE FROM ${table} WHERE ${whereClause}`,
    values
  );
  return result.rowCount || 0;
}
