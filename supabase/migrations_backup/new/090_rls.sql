-- ============================================================
-- DOMAIN: rls
-- Row Level Security policies for ALL tables.
-- Applied LAST because it references the complete schema.
-- ============================================================

-- Helper function to prevent infinite recursion on the users table policy.
-- Executed with SECURITY DEFINER so it ignores RLS during evaluation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE id = auth.uid();
$$;

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ── 1. USERS ──────────────────────────────────────────────────
-- SELECT: Own row only (auth.uid() = id)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- INSERT: No — handled by auth trigger
-- UPDATE: Own row, non-admin columns only
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
-- DELETE: No

-- ── 2. EVENTS ─────────────────────────────────────────────────
-- SELECT: All authenticated users
CREATE POLICY "Events viewable by authenticated users" ON events FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Admins only (is_admin = true)
CREATE POLICY "Admins can insert events" ON events FOR INSERT WITH CHECK (public.is_admin());

-- UPDATE: Admins only
CREATE POLICY "Admins can update events" ON events FOR UPDATE USING (public.is_admin());

-- DELETE: No

-- ── 3. MARKETS ────────────────────────────────────────────────
-- SELECT: All authenticated users
CREATE POLICY "Markets viewable by authenticated users" ON markets FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Admins only
CREATE POLICY "Admins can insert markets" ON markets FOR INSERT WITH CHECK (public.is_admin());

-- UPDATE: Admins only
CREATE POLICY "Admins can update markets" ON markets FOR UPDATE USING (public.is_admin());

-- DELETE: No

-- ── 4. ORDERS ─────────────────────────────────────────────────
-- SELECT: Own orders only
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Own orders (status = pending/open)
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'open');

-- UPDATE: Own orders (cancel only)
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (status = 'cancelled');

-- DELETE: No

-- ── 5. TRADES ─────────────────────────────────────────────────
-- SELECT: Own trades only
CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() IN (maker_id, taker_id));

-- INSERT/UPDATE/DELETE: No

-- ── 6. WALLETS (Balances) ─────────────────────────────────────
-- SELECT: Own wallet only
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE: No

-- ── 7. WALLET TRANSACTIONS ────────────────────────────────────
-- SELECT: Own transactions only
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE: No

-- ── 8. ADMIN AUDIT LOG ────────────────────────────────────────
-- SELECT: Admins only
CREATE POLICY "Admins can view audit log" ON admin_audit_log FOR SELECT USING (public.is_admin());

-- INSERT/UPDATE/DELETE: No

-- ── 9. DEFAULT MISC POLICIES ──────────────────────────────────
CREATE POLICY "Exchange rates viewable by everyone" ON exchange_rates FOR SELECT USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
CREATE POLICY "Oracle requests viewable by everyone" ON oracle_requests FOR SELECT USING (auth.role() = 'authenticated' OR auth.uid() IS NOT NULL);
CREATE POLICY "Leaderboard viewable by everyone" ON leaderboard FOR SELECT USING (true);
