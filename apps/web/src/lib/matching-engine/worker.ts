/**
 * Matching Engine Worker — Redis + BullMQ
 * Guarantees atomic order matching via PostgreSQL SKIP LOCKED.
 */

import { Queue, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Matching queue
export const matchQueue = new Queue('order-matching', {
  connection: { url: REDIS_URL } as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 500 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Worker processes match jobs
export const matchWorker = new Worker(
  'order-matching',
  async (job) => {
    const { orderId } = job.data;
    console.log(`[MATCHER] Processing order ${orderId}`);

    const { data, error } = await supabase.rpc('match_order', {
      p_order_id: orderId,
    });

    if (error) {
      console.error(`[MATCHER] match_order failed for ${orderId}:`, error);
      throw error;
    }

    console.log(`[MATCHER] Order ${orderId} matched:`, data);
    return data;
  },
  { connection: { url: REDIS_URL } as any, concurrency: 1 }
);

matchWorker.on('completed', (job) => {
  console.log(`[MATCHER] Job ${job.id} completed`);
});

matchWorker.on('failed', (job, err) => {
  console.error(`[MATCHER] Job ${job?.id} failed:`, err.message);
});

/**
 * Enqueue an order for matching.
 * Call this after inserting an order into the database.
 */
export async function enqueueMatch(orderId: string) {
  await matchQueue.add('match', { orderId }, {
    jobId: `match-${orderId}`,
    deduplication: { id: `match-${orderId}` },
  });
}
