-- Migration 078: Payment Transactions & Deposit RPCs
-- secure handling of Bkash/Nagad deposits

-- ============================================
-- 1. Create Payment Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(36, 18) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    usdc_equivalent DECIMAL(36, 18), -- For tracking dollar value
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Bkash', 'Nagad', 'Rocket', 'Upay')),
    transaction_id TEXT NOT NULL, -- User submitted TrxID
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(transaction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_trxid ON public.payment_transactions(transaction_id);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert payment transactions" 
ON public.payment_transactions FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view and update all payment transactions" 
ON public.payment_transactions FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- 2. Submit Deposit Request RPC
-- ============================================
CREATE OR REPLACE FUNCTION submit_deposit_request(
    p_user_id UUID,
    p_amount DECIMAL,
    p_payment_method TEXT,
    p_transaction_id TEXT
)
RETURNS UUID AS $$
DECLARE
    v_usdc_rate DECIMAL := 120.0; -- Default rate, can be fetched from settings later
    v_usdc_equiv DECIMAL;
    v_id UUID;
BEGIN
    -- Validation
    IF p_amount < 100 THEN
         RAISE EXCEPTION 'Minimum deposit amount is 100 BDT.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.payment_transactions WHERE transaction_id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction ID already used.';
    END IF;

    -- Calculate USDC
    v_usdc_equiv := p_amount / v_usdc_rate;

    -- Insert
    INSERT INTO public.payment_transactions (
        user_id,
        amount,
        currency,
        usdc_equivalent,
        payment_method,
        transaction_id,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        'BDT',
        v_usdc_equiv,
        p_payment_method,
        p_transaction_id,
        'pending'
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 3. Approve Deposit RPC (Admin Only)
-- ============================================
CREATE OR REPLACE FUNCTION approve_deposit(
    p_admin_id UUID,
    p_payment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deposit RECORD;
BEGIN
    -- 1. Verify Admin
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;

    -- 2. Get Deposit Info
    SELECT * INTO v_deposit
    FROM public.payment_transactions
    WHERE id = p_payment_id;

    IF v_deposit IS NULL THEN
        RAISE EXCEPTION 'Deposit request not found.';
    END IF;

    IF v_deposit.status != 'pending' THEN
        RAISE EXCEPTION 'Deposit request is already processed.';
    END IF;

    -- 3. Update Payment Transaction Status
    UPDATE public.payment_transactions
    SET 
        status = 'approved',
        reviewed_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 4. Credit User Wallet
    UPDATE public.wallets
    SET 
        balance = balance + v_deposit.amount,
        updated_at = NOW()
    WHERE user_id = v_deposit.user_id;

    -- 5. Log Wallet Transaction
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        network_type,
        wallet_address,
        status,
        description,
        metadata
    ) VALUES (
        v_deposit.user_id,
        'deposit',
        v_deposit.amount,
        'BDT',
        'MFS', -- Mobile Financial Service
        v_deposit.payment_method, -- e.g. Bkash
        'completed',
        'Deposit via ' || v_deposit.payment_method || ' (TrxID: ' || v_deposit.transaction_id || ')',
        jsonb_build_object('payment_id', p_payment_id, 'usdc_equivalent', v_deposit.usdc_equivalent)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION submit_deposit_request TO authenticated;
GRANT EXECUTE ON FUNCTION approve_deposit TO authenticated;
