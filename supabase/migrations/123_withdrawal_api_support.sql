-- Migration 123: Admin Withdrawal API Support
-- Provides atomic functions for releasing balance holds and rejecting withdrawals.

-- 1. release_balance_hold
-- Releases a balance hold associated with a withdrawal and records the release.
CREATE OR REPLACE FUNCTION public.release_balance_hold(p_id UUID)
RETURNS VOID AS $$
DECLARE
    v_withdrawal RECORD;
BEGIN
    -- Get the withdrawal and its associated hold
    SELECT * INTO v_withdrawal FROM public.withdrawal_requests WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_withdrawal.balance_hold_id IS NULL THEN
        RAISE EXCEPTION 'No balance hold associated with this withdrawal';
    END IF;

    -- Release the hold in the balance_holds table
    UPDATE public.balance_holds
    SET released_at = NOW(),
        released_by = auth.uid(),
        released_reason = 'withdrawal_approved'
    WHERE id = v_withdrawal.balance_hold_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. reject_withdrawal
-- Atomically rejects a withdrawal, releases the hold, and refunds the user's balance.
CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_id UUID, p_note TEXT)
RETURNS VOID AS $$
DECLARE
    v_withdrawal RECORD;
    v_hold_amount DECIMAL(12,2);
BEGIN
    -- Get the withdrawal request
    SELECT * INTO v_withdrawal 
    FROM public.withdrawal_requests 
    WHERE id = p_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
        RAISE EXCEPTION 'Withdrawal cannot be rejected in its current status (%)', v_withdrawal.status;
    END IF;

    -- Get and release the hold amount
    SELECT amount INTO v_hold_amount
    FROM public.balance_holds
    WHERE id = v_withdrawal.balance_hold_id
    FOR UPDATE;

    IF FOUND THEN
        -- Refund the user's balance in the profiles table
        UPDATE public.profiles
        SET balance = balance + v_hold_amount,
            updated_at = NOW()
        WHERE id = v_withdrawal.user_id;

        -- Mark the hold as released
        UPDATE public.balance_holds
        SET released_at = NOW(),
            released_by = auth.uid(),
            released_reason = 'withdrawal_rejected'
        WHERE id = v_withdrawal.balance_hold_id;
    END IF;

    -- Update the withdrawal request status
    UPDATE public.withdrawal_requests
    SET status = 'rejected',
        processed_at = NOW(),
        processed_by = auth.uid(),
        admin_notes = p_note,
        updated_at = NOW()
    WHERE id = p_id;

    -- Record transaction as a refund
    INSERT INTO public.wallet_transactions (
        user_id,
        amount,
        type,
        description,
        status,
        reference_id,
        created_at
    ) VALUES (
        v_withdrawal.user_id,
        v_withdrawal.usdt_amount,
        'refund',
        format('Withdrawal rejected: %s refunded', v_withdrawal.usdt_amount),
        'completed',
        p_id,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
