-- ============================================================
-- Phase 2: Row Level Security Hardening
-- Financial tables must enforce strict user isolation
-- ============================================================

-- Enable RLS on ALL financial tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Drop any wide-open policies (security fix)
DROP POLICY IF EXISTS "orders_all" ON public.orders;
DROP POLICY IF EXISTS "trades_all" ON public.trades;
DROP POLICY IF EXISTS "positions_all" ON public.positions;
DROP POLICY IF EXISTS "wallets_all" ON public.wallets;
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;

-- Orders: users see only their own
CREATE POLICY "orders_user_isolation" ON public.orders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trades: users see only trades they participate in
CREATE POLICY "trades_user_isolation" ON public.trades
  FOR ALL TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Positions: users see only their own
CREATE POLICY "positions_user_isolation" ON public.positions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Wallets: users see only their own
CREATE POLICY "wallets_user_isolation" ON public.wallets
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions: users see only their own
CREATE POLICY "transactions_user_isolation" ON public.transactions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Deposits: users see only their own
CREATE POLICY "deposits_user_isolation" ON public.deposits
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Withdrawals: users see only their own
CREATE POLICY "withdrawals_user_isolation" ON public.withdrawals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role bypass (for backend workers)
CREATE POLICY "orders_service" ON public.orders FOR ALL TO service_role USING (true);
CREATE POLICY "trades_service" ON public.trades FOR ALL TO service_role USING (true);
CREATE POLICY "positions_service" ON public.positions FOR ALL TO service_role USING (true);
CREATE POLICY "wallets_service" ON public.wallets FOR ALL TO service_role USING (true);
CREATE POLICY "transactions_service" ON public.transactions FOR ALL TO service_role USING (true);
CREATE POLICY "deposits_service" ON public.deposits FOR ALL TO service_role USING (true);
CREATE POLICY "withdrawals_service" ON public.withdrawals FOR ALL TO service_role USING (true);

SELECT 'RLS hardening applied to all financial tables' AS status;
