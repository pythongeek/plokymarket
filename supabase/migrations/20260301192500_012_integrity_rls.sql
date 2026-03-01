-- Enable RLS on new tables
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policies for idempotency_keys
CREATE POLICY "Users can view their own idempotency keys"
ON idempotency_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
