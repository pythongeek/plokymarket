/**
 * Unified JWT Configuration
 * SINGLE SOURCE OF TRUTH for all auth components.
 * Prevents secret mismatch between middleware, API routes, and session.
 */

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  'P10kyM@rket.BD.2026.JWT.SECRET';

export const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Simple hash for debugging — reveals if components use different secrets
 * without exposing the actual secret.
 */
export function getSecretHash(): string {
  let hash = 0;
  for (let i = 0; i < JWT_SECRET.length; i++) {
    hash = ((hash << 5) - hash + JWT_SECRET.charCodeAt(i)) | 0;
  }
  return hash.toString(16);
}
