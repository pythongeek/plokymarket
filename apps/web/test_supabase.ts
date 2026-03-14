import { createClient } from '@supabase/supabase-js';
import { Database } from './src/types/database.types';

const supabase = createClient<Database>('https://xyz.supabase.co', 'key');

async function test() {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_admin: true })
    .eq('id', 'test');

  const { data: d2 } = await supabase
    .from('deposit_requests')
    .insert({
      id: "test",
      user_id: "test",
      usdt_amount: 10,
      status: "pending",
      payment_method: "bkash",
      sender_number: "01",
      sender_name: "test",
      txn_id: "tx",
      bdt_amount: 1200,
      exchange_rate: 120
    });
}
