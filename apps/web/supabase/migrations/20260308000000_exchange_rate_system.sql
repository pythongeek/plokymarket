-- Exchange Rate System - RPC Function Migration
-- Migration: 20260308000000_exchange_rate_system.sql
-- Adds the update_exchange_rate RPC function and ensures tables exist

-- ============================================
-- 1. CREATE EXCHANGE_RATES_LIVE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_rates_live (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usdt_to_bdt DECIMAL(10,4) NOT NULL CHECK (usdt_to_bdt > 0),
  bdt_to_usdt DECIMAL(10,4) NOT NULL CHECK (bdt_to_usdt > 0),
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  source_url TEXT,
  api_response JSONB,
  is_active BOOLEAN DEFAULT true,
  fetched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 2. CREATE EXCHANGE_RATE_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usdt_to_bdt DECIMAL(10,4) NOT NULL,
  bdt_to_usdt DECIMAL(10,4) NOT NULL,
  source VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- 3. CREATE EXCHANGE_RATE_CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_rate_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  default_usdt_to_bdt DECIMAL(10,4) NOT NULL DEFAULT 100.0000,
  min_usdt_to_bdt DECIMAL(10,4) NOT NULL DEFAULT 95.0000,
  max_usdt_to_bdt DECIMAL(10,4) NOT NULL DEFAULT 110.0000,
  auto_update_enabled BOOLEAN DEFAULT false,
  update_interval_minutes INTEGER DEFAULT 5,
  api_endpoint TEXT,
  api_key TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default config if not exists
INSERT INTO public.exchange_rate_config (id, default_usdt_to_bdt, min_usdt_to_bdt, max_usdt_to_bdt)
VALUES (1, 119.00, 95.00, 130.00)
ON CONFLICT (id) DO NOTHING;

-- Insert initial live rate if not exists
INSERT INTO public.exchange_rates_live (usdt_to_bdt, bdt_to_usdt, source, is_active, expires_at)
VALUES (119.00, 0.0084, 'default', true, NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exchange_rates_live_active 
  ON public.exchange_rates_live(is_active, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_recorded 
  ON public.exchange_rate_history(recorded_at DESC);

-- ============================================
-- 5. CREATE RPC FUNCTION: get_current_exchange_rate
-- ============================================
CREATE OR REPLACE FUNCTION public.get_current_exchange_rate()
RETURNS TABLE (
  usdt_to_bdt DECIMAL(10,4),
  bdt_to_usdt DECIMAL(10,4),
  source VARCHAR(50),
  fetched_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.usdt_to_bdt,
    er.bdt_to_usdt,
    er.source,
    er.fetched_at
  FROM public.exchange_rates_live er
  WHERE er.is_active = true
    AND (er.expires_at IS NULL OR er.expires_at > NOW())
  ORDER BY er.fetched_at DESC
  LIMIT 1;
  
  -- If no active rate found, return default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      c.default_usdt_to_bdt,
      (1.0 / c.default_usdt_to_bdt)::DECIMAL(10,4),
      'default'::VARCHAR(50),
      NOW()::TIMESTAMPTZ
    FROM public.exchange_rate_config c
    WHERE c.id = 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE RPC FUNCTION: update_exchange_rate
-- ============================================
CREATE OR REPLACE FUNCTION public.update_exchange_rate(
  p_usdt_to_bdt DECIMAL(10,4),
  p_source VARCHAR(50) DEFAULT 'manual',
  p_source_url TEXT DEFAULT NULL,
  p_api_response JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_id UUID;
  v_config RECORD;
  v_min_rate DECIMAL(10,4);
  v_max_rate DECIMAL(10,4);
BEGIN
  -- Get config for validation (with defaults if not exists)
  SELECT 
    COALESCE(c.min_usdt_to_bdt, 95.0) as min_rate,
    COALESCE(c.max_usdt_to_bdt, 130.0) as max_rate
  INTO v_min_rate, v_max_rate
  FROM public.exchange_rate_config c
  WHERE c.id = 1;
  
  -- Set defaults if null
  v_min_rate := COALESCE(v_min_rate, 95.0);
  v_max_rate := COALESCE(v_max_rate, 130.0);
  
  -- Validate rate is within bounds
  IF p_usdt_to_bdt < v_min_rate OR p_usdt_to_bdt > v_max_rate THEN
    RAISE WARNING 'Exchange rate % is outside allowed range (%, %), using anyway',
      p_usdt_to_bdt, v_min_rate, v_max_rate;
  END IF;
  
  -- Deactivate old rates
  UPDATE public.exchange_rates_live 
  SET is_active = false 
  WHERE is_active = true;
  
  -- Insert new rate
  INSERT INTO public.exchange_rates_live (
    usdt_to_bdt,
    bdt_to_usdt,
    source,
    source_url,
    api_response,
    is_active,
    expires_at
  ) VALUES (
    p_usdt_to_bdt,
    (1.0 / p_usdt_to_bdt)::DECIMAL(10,4),
    p_source,
    p_source_url,
    p_api_response,
    true,
    NOW() + INTERVAL '5 minutes'
  )
  RETURNING id INTO v_rate_id;
  
  -- Record in history
  INSERT INTO public.exchange_rate_history (
    usdt_to_bdt,
    bdt_to_usdt,
    source
  ) VALUES (
    p_usdt_to_bdt,
    (1.0 / p_usdt_to_bdt)::DECIMAL(10,4),
    p_source
  );
  
  -- Update config last_updated (ignore if auth.uid() is null for service role)
  UPDATE public.exchange_rate_config
  SET last_updated = NOW()
  WHERE id = 1;
  
  RETURN v_rate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.bdt_to_usdt(p_bdt_amount DECIMAL(12,2))
RETURNS DECIMAL(12,2)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT usdt_to_bdt INTO v_rate FROM public.get_current_exchange_rate();
  IF v_rate IS NULL OR v_rate = 0 THEN
    v_rate := 119.00; -- Default fallback
  END IF;
  RETURN (p_bdt_amount / v_rate)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.usdt_to_bdt(p_usdt_amount DECIMAL(12,2))
RETURNS DECIMAL(12,2)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT usdt_to_bdt INTO v_rate FROM public.get_current_exchange_rate();
  IF v_rate IS NULL OR v_rate = 0 THEN
    v_rate := 119.00; -- Default fallback
  END IF;
  RETURN (p_usdt_amount * v_rate)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. RLS POLICIES
-- ============================================
ALTER TABLE public.exchange_rates_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rates
DROP POLICY IF EXISTS "Anyone can view active exchange rates" ON public.exchange_rates_live;
CREATE POLICY "Anyone can view active exchange rates"
  ON public.exchange_rates_live FOR SELECT
  USING (true);

-- Everyone can view history
DROP POLICY IF EXISTS "Anyone can view exchange rate history" ON public.exchange_rate_history;
CREATE POLICY "Anyone can view exchange rate history"
  ON public.exchange_rate_history FOR SELECT
  USING (true);

-- Everyone can view config
DROP POLICY IF EXISTS "Anyone can view exchange rate config" ON public.exchange_rate_config;
CREATE POLICY "Anyone can view exchange rate config"
  ON public.exchange_rate_config FOR SELECT
  USING (true);

-- Service role can manage rates
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON public.exchange_rates_live;
CREATE POLICY "Service role can manage exchange rates"
  ON public.exchange_rates_live FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can manage history
DROP POLICY IF EXISTS "Service role can manage exchange rate history" ON public.exchange_rate_history;
CREATE POLICY "Service role can manage exchange rate history"
  ON public.exchange_rate_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can manage config
DROP POLICY IF EXISTS "Service role can manage exchange rate config" ON public.exchange_rate_config;
CREATE POLICY "Service role can manage exchange rate config"
  ON public.exchange_rate_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 9. ADD COMMENTS
-- ============================================
COMMENT ON TABLE public.exchange_rates_live IS 'Current active exchange rate for USDT/BDT';
COMMENT ON TABLE public.exchange_rate_history IS 'Historical exchange rates for analytics';
COMMENT ON FUNCTION public.get_current_exchange_rate() IS 'Returns the current active exchange rate';
COMMENT ON FUNCTION public.update_exchange_rate() IS 'Updates the exchange rate and records in history';

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.exchange_rates_live TO anon, authenticated;
GRANT SELECT ON public.exchange_rate_history TO anon, authenticated;
GRANT SELECT ON public.exchange_rate_config TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_exchange_rate() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_exchange_rate TO service_role;
GRANT EXECUTE ON FUNCTION public.bdt_to_usdt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.usdt_to_bdt TO anon, authenticated;

-- Migration complete
DO $$ 
BEGIN 
  RAISE NOTICE 'Exchange rate system migration completed successfully';
END $$;
