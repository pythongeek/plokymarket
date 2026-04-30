-- Migration 00003: RLS Policies
-- Generated 2026-04-30
-- Note: Currently auth is handled at middleware level. These RLS policies provide defense-in-depth.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'user_id', '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
    uid UUID;
BEGIN
    uid := public.get_current_user_id();
    IF uid IS NULL THEN RETURN FALSE; END IF;
    RETURN EXISTS (SELECT 1 FROM users WHERE id = uid AND is_admin = TRUE);
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Admin can select users" ON users FOR SELECT
    TO authenticated
    USING (public.is_admin_user() = TRUE);

CREATE POLICY "Admin can update users" ON users FOR UPDATE
    TO authenticated
    USING (public.is_admin_user() = TRUE);

-- WALLETS policies  
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id());

CREATE POLICY "Service can update wallets" ON wallets FOR UPDATE
    TO service_role
    USING (TRUE);

-- MARKETS policies
CREATE POLICY "Anyone can view active markets" ON markets FOR SELECT
    TO anon, authenticated
    USING (status = 'active' OR public.is_admin_user() = TRUE);

CREATE POLICY "Admin can insert markets" ON markets FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin_user() = TRUE);

CREATE POLICY "Admin can update markets" ON markets FOR UPDATE
    TO authenticated
    USING (public.is_admin_user() = TRUE);

-- ORDERS policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id() OR public.is_admin_user() = TRUE);

CREATE POLICY "Users can insert own orders" ON orders FOR INSERT
    TO authenticated
    WITH CHECK (user_id = public.get_current_user_id());

CREATE POLICY "Users can update own orders" ON orders FOR UPDATE
    TO authenticated
    USING (user_id = public.get_current_user_id() AND status IN ('open', 'partially_filled'));

CREATE POLICY "Admin can update any order" ON orders FOR UPDATE
    TO authenticated
    USING (public.is_admin_user() = TRUE);

-- TRADES policies
CREATE POLICY "Anyone can view trades" ON trades FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admin can insert trades" ON trades FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- POSITIONS policies
CREATE POLICY "Users can view own positions" ON positions FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id() OR public.is_admin_user() = TRUE);

CREATE POLICY "Service can manage positions" ON positions FOR ALL
    TO service_role
    USING (TRUE);

-- TRANSACTIONS policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id() OR public.is_admin_user() = TRUE);

CREATE POLICY "Service can insert transactions" ON transactions FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

-- ORACLE_VERIFICATIONS policies
CREATE POLICY "Admin can view oracle_verifications" ON oracle_verifications FOR SELECT
    TO authenticated
    USING (public.is_admin_user() = TRUE);

CREATE POLICY "Admin can insert oracle_verifications" ON oracle_verifications FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

CREATE POLICY "Admin can update oracle_verifications" ON oracle_verifications FOR UPDATE
    TO authenticated
    USING (public.is_admin_user() = TRUE);

-- PAYMENT_TRANSACTIONS policies
CREATE POLICY "Users can view own payment_transactions" ON payment_transactions FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id() OR public.is_admin_user() = TRUE);

CREATE POLICY "Admin can view all payment_transactions" ON payment_transactions FOR SELECT
    TO authenticated
    USING (public.is_admin_user() = TRUE);

CREATE POLICY "Admin can insert payment_transactions" ON payment_transactions FOR INSERT
    TO service_role
    WITH CHECK (TRUE);

CREATE POLICY "Admin can update payment_transactions" ON payment_transactions FOR UPDATE
    TO authenticated
    USING (public.is_admin_user() = TRUE);
