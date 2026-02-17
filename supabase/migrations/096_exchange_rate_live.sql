-- Live Exchange Rate System
-- Migration: 096_exchange_rate_live.sql
-- Real-time USDT/BDT exchange rate with API integration

-- Live exchange rates table
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

-- Exchange rate history for analytics
CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usdt_to_bdt DECIMAL(10,4) NOT NULL,
  bdt_to_usdt DECIMAL(10,4) NOT NULL,
  source VARCHAR(50) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Default exchange rate configuration
CREATE TABLE IF NOT EXISTS public.exchange_rate_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
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

-- Insert default config
INSERT INTO public.exchange_rate_config (
  default_usdt_to_bdt,
  min_usdt_to_bdt,
  max_usdt_to_bdt
)
VALUES (100.0000, 95.0000, 110.0000)
ON CONFLICT (id) DO NOTHING;

-- Insert initial live rate
INSERT INTO public.exchange_rates_live (
  usdt_to_bdt,
  bdt_to_usdt,
  source,
  is_active
)
VALUES (100.0000, 0.0100, 'default', true)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_live_active 
  ON public.exchange_rates_live(is_active, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_recorded 
  ON public.exchange_rate_history(recorded_at DESC);

-- Function to get current exchange rate
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
    AND er.expires_at > NOW()
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

-- Function to update exchange rate
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
  v_config exchange_rate_config%ROWTYPE;
BEGIN
  -- Get config for validation
  SELECT * INTO v_config FROM public.exchange_rate_config WHERE id = 1;
  
  -- Validate rate is within bounds
  IF p_usdt_to_bdt < v_config.min_usdt_to_bdt OR p_usdt_to_bdt > v_config.max_usdt_to_bdt THEN
    RAISE EXCEPTION 'Exchange rate % is outside allowed range (%, %)',
      p_usdt_to_bdt, v_config.min_usdt_to_bdt, v_config.max_usdt_to_bdt;
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
    api_response
  ) VALUES (
    p_usdt_to_bdt,
    (1.0 / p_usdt_to_bdt)::DECIMAL(10,4),
    p_source,
    p_source_url,
    p_api_response
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
  
  -- Update config
  UPDATE public.exchange_rate_config
  SET last_updated = NOW(),
      updated_by = auth.uid()
  WHERE id = 1;
  
  RETURN v_rate_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate USDT from BDT
CREATE OR REPLACE FUNCTION public.bdt_to_usdt(p_bdt_amount DECIMAL(12,2))
RETURNS DECIMAL(12,2)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT usdt_to_bdt INTO v_rate FROM public.get_current_exchange_rate();
  RETURN (p_bdt_amount / v_rate)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate BDT from USDT
CREATE OR REPLACE FUNCTION public.usdt_to_bdt(p_usdt_amount DECIMAL(12,2))
RETURNS DECIMAL(12,2)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT usdt_to_bdt INTO v_rate FROM public.get_current_exchange_rate();
  RETURN (p_usdt_amount * v_rate)::DECIMAL(12,2);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.exchange_rates_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rate_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rates
CREATE POLICY "Anyone can view active exchange rates"
  ON public.exchange_rates_live FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view exchange rate history"
  ON public.exchange_rate_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view exchange rate config"
  ON public.exchange_rate_config FOR SELECT
  USING (true);

-- Only service role can modify rates
CREATE POLICY "Service role can manage exchange rates"
  ON public.exchange_rates_live FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage exchange rate history"
  ON public.exchange_rate_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can update config
CREATE POLICY "Admins can update exchange rate config"
  ON public.exchange_rate_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.exchange_rates_live IS 'Current active exchange rate for USDT/BDT';
COMMENT ON TABLE public.exchange_rate_history IS 'Historical exchange rates for analytics';
COMMENT ON FUNCTION public.get_current_exchange_rate() IS 'Returns the current active exchange rate';
