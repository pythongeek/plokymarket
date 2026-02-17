-- USDT Management System Functions and Triggers
-- Migration: 002_usdt_functions.sql
-- Implements signup bonus, transaction processing, and verification logic

-- Function to handle new user signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user_bonus()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus_amount DECIMAL(12,2) := 5.00;
  v_max_bonus_per_ip INTEGER := 3;  -- IP-based abuse prevention
  v_user_ip INET;
  v_existing_count INTEGER;
  v_user_exists BOOLEAN;
BEGIN
  -- Idempotency check: ensure profile doesn't already exist
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = new.id) 
  INTO v_user_exists;
    
  IF v_user_exists THEN
    RAISE NOTICE 'Profile already exists for user %, skipping bonus', new.id;
    RETURN NEW;
  END IF;

  -- IP-based abuse check (optional)
  v_user_ip := inet_client_addr();
    
  SELECT COUNT(*) INTO v_existing_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.raw_user_meta_data->>'ip_address' = v_user_ip::TEXT
    AND p.created_at > NOW() - INTERVAL '24 hours';
    
  IF v_existing_count >= v_max_bonus_per_ip THEN
    v_bonus_amount := 0;  -- Bonus cancelled, but account created
  END IF;

  -- Create profile with bonus
  INSERT INTO public.profiles (
    id, 
    balance,
    total_deposited,
    total_withdrawn,
    created_at,
    updated_at
  ) VALUES (
    new.id, 
    v_bonus_amount,
    0.00,
    0.00,
    NOW(),
    NOW()
  );
    
  -- Record bonus transaction only if bonus > 0
  IF v_bonus_amount > 0 THEN
    INSERT INTO public.transactions (
      user_id, 
      amount, 
      type, 
      description,
      status,
      metadata,
      created_at
    ) VALUES (
      new.id, 
      v_bonus_amount, 
      'bonus', 
      'Signup Bonus USDT - Welcome to Prediction Market',
      'completed',
      jsonb_build_object(
        'source', 'signup_trigger',
        'triggered_at', NOW(),
        'ip_address', v_user_ip,
        'rate_limited', false
      ),
      NOW()
    );
      
    -- Notification (optional)
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      created_at
    ) VALUES (
      new.id,
      'bonus_credited',
      'Welcome Bonus Received!',
      format('You have received %s USDT as signup bonus.', v_bonus_amount),
      NOW()
    );
  END IF;
    
  RAISE LOG 'Signup bonus % USDT credited to user %', v_bonus_amount, new.id;
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't block signup
    RAISE WARNING 'Failed to process signup bonus for user %: %', new.id, SQLERRM;
      
    -- Fallback: create profile without bonus
    INSERT INTO public.profiles (id, balance, total_deposited, total_withdrawn)
    VALUES (new.id, 0.00, 0.00, 0.00);
      
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for signup bonus
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_bonus();

-- Function to verify and credit deposit
CREATE OR REPLACE FUNCTION public.verify_and_credit_deposit(
  p_deposit_id UUID,
  p_user_id UUID,
  p_usdt_amount DECIMAL(12,2),
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit deposit_requests%ROWTYPE;
  v_result BOOLEAN := FALSE;
BEGIN
  -- Start transaction
  BEGIN
    -- Get deposit request
    SELECT * INTO v_deposit
    FROM deposit_requests
    WHERE id = p_deposit_id AND user_id = p_user_id
    FOR UPDATE; -- Lock row to prevent race conditions
    
    -- Validate deposit
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Deposit request not found or access denied';
    END IF;
    
    IF v_deposit.status != 'pending' THEN
      RAISE EXCEPTION 'Deposit already processed';
    END IF;
    
    -- Update deposit status
    UPDATE deposit_requests
    SET 
      status = 'verified',
      verified_by = auth.uid(),
      verified_at = NOW(),
      admin_notes = p_admin_notes,
      updated_at = NOW()
    WHERE id = p_deposit_id;
    
    -- Update user profile
    UPDATE profiles
    SET 
      balance = balance + p_usdt_amount,
      total_deposited = total_deposited + p_usdt_amount,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO transactions (
      user_id,
      amount,
      type,
      description,
      status,
      reference_id,
      metadata,
      created_at
    ) VALUES (
      p_user_id,
      p_usdt_amount,
      'deposit',
      format('Deposit verified: %s BDT → %s USDT', v_deposit.bdt_amount, p_usdt_amount),
      'completed',
      p_deposit_id,
      jsonb_build_object(
        'mfs_provider', v_deposit.mfs_provider,
        'txn_id', v_deposit.txn_id,
        'sender_number', v_deposit.sender_number,
        'exchange_rate', v_deposit.exchange_rate
      ),
      NOW()
    );
    
    -- Success
    v_result := TRUE;
    
    -- Commit transaction
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction
      RAISE EXCEPTION 'Failed to verify deposit: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to process withdrawal
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id UUID,
  p_user_id UUID,
  p_approve BOOLEAN,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal withdrawal_requests%ROWTYPE;
  v_result BOOLEAN := FALSE;
BEGIN
  -- Start transaction
  BEGIN
    -- Get withdrawal request
    SELECT * INTO v_withdrawal
    FROM withdrawal_requests
    WHERE id = p_withdrawal_id AND user_id = p_user_id
    FOR UPDATE; -- Lock row to prevent race conditions
    
    -- Validate withdrawal
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Withdrawal request not found or access denied';
    END IF;
    
    IF v_withdrawal.status != 'processing' THEN
      RAISE EXCEPTION 'Withdrawal not in processing state';
    END IF;
    
    -- Process based on approval
    IF p_approve THEN
      -- Complete withdrawal
      UPDATE withdrawal_requests
      SET 
        status = 'completed',
        processed_by = auth.uid(),
        processed_at = NOW(),
        admin_notes = p_admin_notes,
        updated_at = NOW()
      WHERE id = p_withdrawal_id;
      
      -- Release hold and record transaction
      UPDATE balance_holds
      SET 
        released_at = NOW(),
        released_by = auth.uid(),
        released_reason = 'withdrawal_completed'
      WHERE id = v_withdrawal.balance_hold_id;
      
      -- Record transaction
      INSERT INTO transactions (
        user_id,
        amount,
        type,
        description,
        status,
        reference_id,
        metadata,
        created_at
      ) VALUES (
        p_user_id,
        v_withdrawal.usdt_amount,
        'withdrawal',
        format('Withdrawal completed: %s USDT → %s BDT', v_withdrawal.usdt_amount, v_withdrawal.bdt_amount),
        'completed',
        p_withdrawal_id,
        jsonb_build_object(
          'mfs_provider', v_withdrawal.mfs_provider,
          'recipient_number', v_withdrawal.recipient_number,
          'exchange_rate', v_withdrawal.exchange_rate
        ),
        NOW()
      );
      
      -- Update user profile
      UPDATE profiles
      SET 
        total_withdrawn = total_withdrawn + v_withdrawal.bdt_amount,
        updated_at = NOW()
      WHERE id = p_user_id;
      
    ELSE
      -- Reject withdrawal
      UPDATE withdrawal_requests
      SET 
        status = 'rejected',
        processed_by = auth.uid(),
        processed_at = NOW(),
        admin_notes = p_admin_notes,
        updated_at = NOW()
      WHERE id = p_withdrawal_id;
      
      -- Release hold
      UPDATE balance_holds
      SET 
        released_at = NOW(),
        released_by = auth.uid(),
        released_reason = 'withdrawal_rejected'
      WHERE id = v_withdrawal.balance_hold_id;
      
      -- Record transaction (refund)
      INSERT INTO transactions (
        user_id,
        amount,
        type,
        description,
        status,
        reference_id,
        metadata,
        created_at
      ) VALUES (
        p_user_id,
        v_withdrawal.usdt_amount,
        'refund',
        format('Withdrawal rejected: %s USDT refunded', v_withdrawal.usdt_amount),
        'completed',
        p_withdrawal_id,
        jsonb_build_object(
          'reason', p_admin_notes,
          'mfs_provider', v_withdrawal.mfs_provider
        ),
        NOW()
      );
      
      -- Update user profile (add back to balance)
      UPDATE profiles
      SET 
        balance = balance + v_withdrawal.usdt_amount,
        updated_at = NOW()
      WHERE id = p_user_id;
    END IF;
    
    v_result := TRUE;
    RETURN v_result;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to process withdrawal: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to create withdrawal hold
CREATE OR REPLACE FUNCTION public.create_withdrawal_hold(
  p_user_id UUID,
  p_amount DECIMAL(12,2),
  p_withdrawal_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
  v_current_balance DECIMAL(12,2);
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Lock profile to prevent race conditions
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal';
  END IF;
  
  -- Create hold
  INSERT INTO balance_holds (
    user_id,
    amount,
    reason,
    reference_id,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'withdrawal',
    p_withdrawal_id,
    NOW()
  ) RETURNING id INTO v_hold_id;
  
  -- Deduct from balance
  UPDATE profiles
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN v_hold_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release hold
CREATE OR REPLACE FUNCTION public.release_withdrawal_hold(
  p_hold_id UUID,
  p_reason TEXT DEFAULT 'manual_release'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold balance_holds%ROWTYPE;
  v_result BOOLEAN := FALSE;
BEGIN
  -- Get hold
  SELECT * INTO v_hold
  FROM balance_holds
  WHERE id = p_hold_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hold not found';
  END IF;
  
  IF v_hold.released_at IS NOT NULL THEN
    RAISE EXCEPTION 'Hold already released';
  END IF;
  
  -- Release hold
  UPDATE balance_holds
  SET 
    released_at = NOW(),
    released_by = auth.uid(),
    released_reason = p_reason
  WHERE id = p_hold_id;
  
  -- Add back to balance
  UPDATE profiles
  SET 
    balance = balance + v_hold.amount,
    updated_at = NOW()
  WHERE id = v_hold.user_id;
  
  v_result := TRUE;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get current exchange rate
CREATE OR REPLACE FUNCTION public.get_current_exchange_rate()
RETURNS DECIMAL(10,4)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT bdt_to_usdt INTO v_rate
  FROM exchange_rates
  WHERE effective_until IS NULL OR effective_until > NOW()
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_rate, 100.0000); -- Default rate if none found
END;
$$ LANGUAGE plpgsql;

-- Function to validate withdrawal limits
CREATE OR REPLACE FUNCTION public.validate_withdrawal_limit(
  p_user_id UUID,
  p_amount DECIMAL(12,2)
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_daily_total DECIMAL(12,2);
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check daily limit
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'withdrawal'
    AND status = 'completed'
    AND DATE(created_at) = CURRENT_DATE;
  
  IF (v_daily_total + p_amount) > v_profile.daily_withdrawal_limit THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own non-financial fields
CREATE POLICY "Users can update own non-financial fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND balance = (SELECT balance FROM public.profiles WHERE id = auth.uid())
    AND total_deposited = (SELECT total_deposited FROM public.profiles WHERE id = auth.uid())
    AND total_withdrawn = (SELECT total_withdrawn FROM public.profiles WHERE id = auth.uid())
  );

-- Admins have full access
CREATE POLICY "Admins have full access"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'finance_admin')
    )
  );

-- Service role can modify balance
CREATE POLICY "Service role can modify balance"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;

-- Users can view own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No direct inserts/updates/deletes by users
CREATE POLICY "No direct inserts by users"
  ON public.transactions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates by users"
  ON public.transactions FOR UPDATE
  USING (false);

CREATE POLICY "No deletes by users"
  ON public.transactions FOR DELETE
  USING (false);

-- Service role full access
CREATE POLICY "Service role can manage transactions"
  ON public.transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Deposit requests RLS
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests FORCE ROW LEVEL SECURITY;

-- Users can view own requests
CREATE POLICY "Users can view own deposit requests"
  ON public.deposit_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create deposit requests"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update pending requests
CREATE POLICY "Users can update own pending requests"
  ON public.deposit_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all requests
CREATE POLICY "Admins can manage all deposit requests"
  ON public.deposit_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'finance_admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role can manage deposit requests"
  ON public.deposit_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Withdrawal requests RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests FORCE ROW LEVEL SECURITY;

-- Users can view own requests
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel pending requests
CREATE POLICY "Users can cancel own pending requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can manage all requests
CREATE POLICY "Admins can manage all withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'finance_admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role can manage withdrawal requests"
  ON public.withdrawal_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);