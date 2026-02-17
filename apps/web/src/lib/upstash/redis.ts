/**
 * Upstash Redis Client
 * For rate limiting, locking, and caching
 * Uses Vercel KV / Upstash Redis environment variables
 */

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

interface RedisResponse {
  result?: any;
  error?: string;
}

export async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.warn('Vercel KV / Upstash Redis not configured');
    return null;
  }

  const response = await fetch(`${KV_REST_API_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.status}`);
  }

  const data: RedisResponse = await response.json();
  return data.result;
}

/**
 * Set a lock with expiration (for rate limiting)
 */
export async function setLock(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  try {
    // SET key value EX ttl NX (only if not exists)
    const result = await redisCommand('SET', key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    console.error('Redis setLock error:', error);
    return false;
  }
}

/**
 * Check if lock exists
 */
export async function checkLock(key: string): Promise<string | null> {
  try {
    return await redisCommand('GET', key);
  } catch (error) {
    console.error('Redis checkLock error:', error);
    return null;
  }
}

/**
 * Delete a lock
 */
export async function deleteLock(key: string): Promise<void> {
  try {
    await redisCommand('DEL', key);
  } catch (error) {
    console.error('Redis deleteLock error:', error);
  }
}

/**
 * Set expiration on a key
 */
export async function expire(key: string, ttlSeconds: number): Promise<void> {
  try {
    await redisCommand('EXPIRE', key, ttlSeconds);
  } catch (error) {
    console.error('Redis expire error:', error);
  }
}

/**
 * Get TTL of a key
 */
export async function getTTL(key: string): Promise<number> {
  try {
    return await redisCommand('TTL', key);
  } catch (error) {
    console.error('Redis getTTL error:', error);
    return -1;
  }
}

/**
 * Increment a counter
 */
export async function increment(key: string): Promise<number> {
  try {
    return await redisCommand('INCR', key);
  } catch (error) {
    console.error('Redis increment error:', error);
    return 0;
  }
}

/**
 * Set a value with expiration
 */
export async function setex(key: string, ttlSeconds: number, value: string): Promise<void> {
  try {
    await redisCommand('SETEX', key, ttlSeconds, value);
  } catch (error) {
    console.error('Redis setex error:', error);
  }
}

/**
 * Get a value
 */
export async function get(key: string): Promise<string | null> {
  try {
    return await redisCommand('GET', key);
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}
