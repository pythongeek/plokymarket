-- ============================================================
-- DOMAIN: rls (Phase 5) — PRODUCTION SAFE
-- Row Level Security policies for ALL tables.
-- Uses DROP POLICY IF EXISTS before each CREATE to be idempotent.
-- Skips tables that don't exist (wallet_transactions, leaderboard).
-- ============================================================

-- Helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE id = auth.uid();
$$;

-- Enable RLS on existing tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_requests ENABLE ROW LEVEL SECURITY;

-- Conditionally enable RLS on optional tables
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'wallet_transactions' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leaderboard' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ── 1. USERS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- ── 2. EVENTS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Events viewable by authenticated users" ON events;
CREATE POLICY "Events viewable by authenticated users" ON events FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events" ON events FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (public.is_admin());

-- ── 3. MARKETS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Markets viewable by authenticated users" ON markets;
CREATE POLICY "Markets viewable by authenticated users" ON markets FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins can insert markets" ON markets;
CREATE POLICY "Admins can insert markets" ON markets FOR INSERT WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admins can update markets" ON markets;
CREATE POLICY "Admins can update markets" ON markets FOR UPDATE USING (public.is_admin());

-- ── 4. ORDERS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'open');
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (status = 'cancelled');

-- ── 5. TRADES ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() IN (maker_id, taker_id));

-- ── 6. WALLETS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- ── 7. EXCHANGE RATES ─────────────────────────────────────────
DROP POLICY IF EXISTS "Exchange rates viewable by everyone" ON exchange_rates;
CREATE POLICY "Exchange rates viewable by everyone" ON exchange_rates FOR SELECT USING (true);

-- ── 8. ORACLE REQUESTS ───────────────────────────────────────
DROP POLICY IF EXISTS "Oracle requests viewable by everyone" ON oracle_requests;
CREATE POLICY "Oracle requests viewable by everyone" ON oracle_requests FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 9. ADMIN AUDIT LOG (if exists) ───────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND schemaname = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view audit log" ON admin_audit_log';
    EXECUTE 'CREATE POLICY "Admins can view audit log" ON admin_audit_log FOR SELECT USING (public.is_admin())';
  END IF;
END $$;
