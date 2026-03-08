BEGIN;
SELECT plan(22);

-- 1. Tables exist
SELECT has_table('public', 'users', 'users table exists');
SELECT has_table('public', 'events', 'events table exists');
SELECT has_table('public', 'markets', 'markets table exists');
SELECT has_table('public', 'orders', 'orders table exists');
SELECT has_table('public', 'trades', 'trades table exists');
SELECT has_table('public', 'wallets', 'wallets table exists');
SELECT has_table('public', 'admin_audit_log', 'admin_audit_log table exists');

-- 2. New columns / types exist
SELECT has_column('public', 'users', 'is_admin', 'users has is_admin column');
SELECT has_column('public', 'events', 'tags', 'events has tags column');
SELECT has_domain('public', 'event_tags_domain', 'event_tags_domain JSONB domain exists');
SELECT has_enum('public', 'market_status', 'market_status enum exists');

-- 3. Canonical Functions exist
SELECT has_function('public', 'create_event_complete_v3', 'Canonical event builder exists');
SELECT has_function('public', 'place_order_atomic_v2', 'Canonical order atomics exists');
SELECT has_function('public', 'settle_market_v2', 'Canonical market settlement exists');

-- 4. Legacy Wrappers exist
SELECT has_function('public', 'create_event_complete', 'Legacy event wrapper exists');
SELECT has_function('public', 'place_order_atomic', 'Legacy order wrapper exists');
SELECT has_function('public', 'settle_market', 'Legacy settle market wrapper exists');
SELECT has_function('public', 'update_exchange_rate', 'Legacy exchange rate wrapper exists');

-- 5. RLS Validations
SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'users' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on users'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on orders'
);

SELECT is(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'admin_audit_log' AND relnamespace = 'public'::regnamespace),
  true,
  'RLS is enabled on admin_audit_log'
);

-- 6. Trigger Check
SELECT has_trigger('public', 'users', 'users_updated_at', 'users table has updated_at trigger');

-- Finish the tests and clean up.
SELECT * FROM finish();
ROLLBACK;
