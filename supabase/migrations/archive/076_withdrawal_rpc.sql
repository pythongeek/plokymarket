-- Migration 076: Withdrawal Request RPC & Wallet Transactions
-- Handles secure withdrawal requests with KYC checks

-- ============================================
-- 1. Create Wallet Transactions Table (if missing)
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'trade_in', 'trade_out', 'rebate', 'referral', 'adjustment')),
    amount DECIMAL(36, 18) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    network_type VARCHAR(20),
    wallet_address TEXT,
    tx_hash TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected', 'cancelled')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type ON public.wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_status ON public.wallet_transactions(status);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions" 
ON public.wallet_transactions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions" 
ON public.wallet_transactions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));


-- ============================================
-- 2. Request Withdrawal RPC
-- ============================================
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id UUID,
    p_amount DECIMAL,
    p_address TEXT,
    p_network TEXT
)
RETURNS UUID AS $$
DECLARE
    v_balance DECIMAL;
    v_kyc_level INTEGER;
    v_tx_id UUID;
    v_user_kyc_verified BOOLEAN; -- Use profile or calculate
BEGIN
    -- 1. Input Validation
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be positive.';
    END IF;

    -- 2. Check KYC Limit
    -- Get KYC Level from profile
    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF p_amount > 5000 AND v_kyc_level < 1 THEN
        RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification. Please verify your identity first.', p_amount;
    END IF;

    -- 3. Check Balance & Lock Funds
    -- Lock row for update
    SELECT balance INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal.';
    END IF;

    -- Deduct from Available, Add to Locked
    UPDATE public.wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 4. Create Transaction Record
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        network_type,
        wallet_address,
        status,
        description
    ) VALUES (
        p_user_id,
        'withdrawal',
        p_amount,
        'BDT',
        p_network,
        p_address,
        'pending',
        'Withdrawal request via ' || p_network
    )
    RETURNING id INTO v_tx_id;

    RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.wallet_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal TO authenticated;
