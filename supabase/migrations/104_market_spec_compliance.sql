-- Migration 104: Market Spec Compliance Triggers
-- Implements automatic volume updates and timestamp management

-- ============================================
-- 1. Automate updated_at for markets table
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_market_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_markets_updated_at ON public.markets;
CREATE TRIGGER trg_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_market_updated_at();

-- ============================================
-- 2. Automate volume update on trades
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_trade_volume_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment volume on the associated market
  -- Note: We update both 'volume' (spec field) and 'total_volume' (existing field) for compatibility
  UPDATE public.markets
  SET 
    volume = COALESCE(volume, 0) + NEW.size,
    total_volume = COALESCE(total_volume, 0) + NEW.size,
    total_trades = COALESCE(total_trades, 0) + 1
  WHERE id = NEW.market_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trades_volume_update ON public.trades;
CREATE TRIGGER trg_trades_volume_update
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_trade_volume_update();

-- ============================================
-- 3. Ensure field types match specification
-- ============================================

-- (Already handled in migration 102, but double checking/fixing here)
DO $$
BEGIN
  -- Ensure condition_id, token1, token2 are VARCHAR(255)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'condition_id') THEN
    ALTER TABLE public.markets ALTER COLUMN condition_id TYPE VARCHAR(255);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'token1') THEN
    ALTER TABLE public.markets ALTER COLUMN token1 TYPE VARCHAR(255);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'token2') THEN
    ALTER TABLE public.markets ALTER COLUMN token2 TYPE VARCHAR(255);
  END IF;
  
  -- Ensure initial_liquidity and volume are NUMERIC
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'initial_liquidity') THEN
    ALTER TABLE public.markets ALTER COLUMN initial_liquidity TYPE NUMERIC;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'volume') THEN
    ALTER TABLE public.markets ALTER COLUMN volume TYPE NUMERIC;
  END IF;
END $$;

-- ============================================
-- 4. Unique Traders Tracking (Optional but recommended)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_unique_traders()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_is_new BOOLEAN;
  v_seller_is_new BOOLEAN;
BEGIN
  -- Check if buyer has traded on this market before
  SELECT NOT EXISTS (
    SELECT 1 FROM public.trades 
    WHERE market_id = NEW.market_id 
    AND (buyer_id = NEW.buyer_id OR seller_id = NEW.buyer_id)
    AND id != NEW.id
  ) INTO v_buyer_is_new;

  -- Check if seller has traded on this market before
  SELECT NOT EXISTS (
    SELECT 1 FROM public.trades 
    WHERE market_id = NEW.market_id 
    AND (buyer_id = NEW.seller_id OR seller_id = NEW.seller_id)
    AND id != NEW.id
  ) INTO v_seller_is_new;

  IF v_buyer_is_new OR v_seller_is_new THEN
    UPDATE public.markets
    SET unique_traders = COALESCE(unique_traders, 0) + 
      (CASE WHEN v_buyer_is_new THEN 1 ELSE 0 END) +
      (CASE WHEN v_seller_is_new THEN 1 ELSE 0 END)
    WHERE id = NEW.market_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trades_unique_traders ON public.trades;
CREATE TRIGGER trg_trades_unique_traders
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unique_traders();
