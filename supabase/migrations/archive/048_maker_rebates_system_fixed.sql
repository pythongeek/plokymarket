-- ===================================
-- MAKER REBATES & SPREAD REWARDS SYSTEM (FIXED - Handles existing tables)
-- ===================================

-- Drop and recreate only if needed (use with caution in production)
-- Uncomment if you want to reset: DROP TABLE IF EXISTS spread_rewards, maker_rebates, maker_volume_tracking, resting_orders CASCADE;

-- ===================================
-- RESTING ORDERS TABLE (Track order resting time for anti-spoofing)
-- ===================================
CREATE TABLE IF NOT EXISTS resting_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    price DECIMAL(12, 2) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    spread_at_placement DECIMAL(8, 4),
    resting_start_time TIMESTAMPTZ DEFAULT NOW(),
    resting_end_time TIMESTAMPTZ,
    total_resting_seconds INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resting_orders_user') THEN
        CREATE INDEX idx_resting_orders_user ON resting_orders(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resting_orders_market') THEN
        CREATE INDEX idx_resting_orders_market ON resting_orders(market_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resting_orders_active') THEN
        CREATE INDEX idx_resting_orders_active ON resting_orders(user_id, is_active);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_resting_orders_time') THEN
        CREATE INDEX idx_resting_orders_time ON resting_orders(resting_start_time, resting_end_time);
    END IF;
END $$;

-- ===================================
-- MAKER VOLUME TRACKING (Monthly rolling volume per user)
-- ===================================
CREATE TABLE IF NOT EXISTS maker_volume_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,
    maker_volume DECIMAL(20, 2) DEFAULT 0,
    taker_volume DECIMAL(20, 2) DEFAULT 0,
    total_spread_contribution DECIMAL(20, 4) DEFAULT 0,
    resting_time_seconds INTEGER DEFAULT 0,
    qualifying_volume DECIMAL(20, 2) DEFAULT 0,
    rebate_tier INTEGER DEFAULT 1,
    rebate_rate DECIMAL(8, 4) DEFAULT 0.0002,
    estimated_rebate DECIMAL(20, 2) DEFAULT 0,
    claimed_rebate DECIMAL(20, 2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_month UNIQUE (user_id, year_month)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_volume_tracking_user') THEN
        CREATE INDEX idx_volume_tracking_user ON maker_volume_tracking(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_volume_tracking_month') THEN
        CREATE INDEX idx_volume_tracking_month ON maker_volume_tracking(year_month);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_volume_tracking_tier') THEN
        CREATE INDEX idx_volume_tracking_tier ON maker_volume_tracking(rebate_tier);
    END IF;
END $$;

-- ===================================
-- MAKER REBATES (Individual rebate records)
-- ===================================
CREATE TABLE IF NOT EXISTS maker_rebates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,
    rebate_period_start TIMESTAMPTZ NOT NULL,
    rebate_period_end TIMESTAMPTZ NOT NULL,
    total_maker_volume DECIMAL(20, 2) DEFAULT 0,
    qualifying_volume DECIMAL(20, 2) DEFAULT 0,
    base_rebate_rate DECIMAL(8, 4) DEFAULT 0.0002,
    spread_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    final_rebate_rate DECIMAL(8, 4) DEFAULT 0.0002,
    gross_rebate_amount DECIMAL(20, 2) DEFAULT 0,
    adjustment_factor DECIMAL(4, 2) DEFAULT 1.0,
    net_rebate_amount DECIMAL(20, 2) DEFAULT 0,
    claim_status VARCHAR(20) DEFAULT 'pending' CHECK (claim_status IN ('pending', 'claimed', 'processing', 'paid', 'expired')),
    claimed_at TIMESTAMPTZ,
    claimed_by_user_id UUID REFERENCES users(id),
    payment_method VARCHAR(10) CHECK (payment_method IN ('USDC', 'PLATFORM')),
    payment_tx_hash VARCHAR(100),
    payment_completed_at TIMESTAMPTZ,
    tier_at_calculation INTEGER DEFAULT 1,
    tier_benefits JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maker_rebates_user') THEN
        CREATE INDEX idx_maker_rebates_user ON maker_rebates(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maker_rebates_month') THEN
        CREATE INDEX idx_maker_rebates_month ON maker_rebates(year_month);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maker_rebates_status') THEN
        CREATE INDEX idx_maker_rebates_status ON maker_rebates(claim_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_maker_rebates_user_month') THEN
        CREATE INDEX idx_maker_rebates_user_month ON maker_rebates(user_id, year_month);
    END IF;
END $$;

-- ===================================
-- SPREAD REWARDS (Time-weighted spread bonus tracking)
-- ===================================
CREATE TABLE IF NOT EXISTS spread_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    calculation_date DATE NOT NULL,
    avg_spread_7d DECIMAL(8, 4),
    min_spread DECIMAL(8, 4),
    max_spread DECIMAL(8, 4),
    spread_percentile DECIMAL(5, 2),
    spread_tier VARCHAR(20) CHECK (spread_tier IN ('elite', 'tight', 'standard', 'wide')),
    base_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    size_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    final_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    meets_min_size BOOLEAN DEFAULT FALSE,
    avg_order_size DECIMAL(20, 2),
    bonus_amount DECIMAL(20, 2) DEFAULT 0,
    applied_to_rebate_id UUID REFERENCES maker_rebates(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_spread_rewards_user') THEN
        CREATE INDEX idx_spread_rewards_user ON spread_rewards(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_spread_rewards_date') THEN
        CREATE INDEX idx_spread_rewards_date ON spread_rewards(calculation_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_spread_rewards_tier') THEN
        CREATE INDEX idx_spread_rewards_tier ON spread_rewards(spread_tier);
    END IF;
END $$;

-- ===================================
-- REBATE TIERS CONFIGURATION TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS rebate_tiers_config (
    id INTEGER PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL,
    min_volume DECIMAL(20, 2) NOT NULL,
    max_volume DECIMAL(20, 2),
    rebate_rate DECIMAL(8, 4) NOT NULL,
    min_spread DECIMAL(8, 4) NOT NULL,
    benefits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier configuration (skip if already exists)
INSERT INTO rebate_tiers_config (id, tier_name, min_volume, max_volume, rebate_rate, min_spread, benefits) VALUES
(1, 'Standard', 0, 100000, 0.0002, 0.0020, '{"withdrawal_fees": "standard", "api_rate_limit": "standard", "support": "standard"}'),
(2, 'Silver', 100000, 1000000, 0.0005, 0.0015, '{"withdrawal_fees": "reduced", "api_rate_limit": "standard", "support": "standard"}'),
(3, 'Gold', 1000000, 10000000, 0.0008, 0.0010, '{"withdrawal_fees": "reduced", "api_rate_limit": "increased", "support": "priority"}'),
(4, 'Platinum', 10000000, NULL, 0.0010, 0.0005, '{"withdrawal_fees": "waived", "api_rate_limit": "unlimited", "support": "dedicated", "custom_terms": true}')
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- SPREAD MULTIPLIER CONFIGURATION
-- ===================================
CREATE TABLE IF NOT EXISTS spread_multiplier_config (
    id INTEGER PRIMARY KEY,
    spread_tier VARCHAR(20) NOT NULL,
    min_spread DECIMAL(8, 4) NOT NULL,
    max_spread DECIMAL(8, 4),
    multiplier DECIMAL(4, 2) NOT NULL,
    min_order_size DECIMAL(20, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO spread_multiplier_config (id, spread_tier, min_spread, max_spread, multiplier, min_order_size, description) VALUES
(1, 'elite', 0, 0.0010, 2.0, 10000, '< 0.10% spread - Elite tier'),
(2, 'tight', 0.0010, 0.0020, 1.5, 5000, '0.10% - 0.20% spread - Tight tier'),
(3, 'standard', 0.0020, 0.0050, 1.0, 2000, '0.20% - 0.50% spread - Standard tier'),
(4, 'wide', 0.0050, NULL, 0.5, 0, '> 0.50% spread - Wide tier')
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- FUNCTIONS FOR REBATE CALCULATION
-- ===================================

-- Function to calculate current spread for a market
CREATE OR REPLACE FUNCTION calculate_market_spread(
    p_market_id UUID
)
RETURNS DECIMAL(8, 4)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_best_bid DECIMAL(12, 2);
    v_best_ask DECIMAL(12, 2);
    v_spread DECIMAL(8, 4);
    v_mid_price DECIMAL(12, 2);
BEGIN
    SELECT MAX(price) INTO v_best_bid
    FROM orders
    WHERE market_id = p_market_id 
      AND side = 'buy' 
      AND status = 'open';
    
    SELECT MIN(price) INTO v_best_ask
    FROM orders
    WHERE market_id = p_market_id 
      AND side = 'sell' 
      AND status = 'open';
    
    IF v_best_bid IS NULL OR v_best_ask IS NULL OR v_best_bid = 0 THEN
        RETURN NULL;
    END IF;
    
    v_mid_price := (v_best_bid + v_best_ask) / 2;
    v_spread := (v_best_ask - v_best_bid) / v_mid_price;
    
    RETURN v_spread;
END;
$$;

-- Function to start tracking a resting order
CREATE OR REPLACE FUNCTION start_resting_order_tracking(
    p_order_id UUID,
    p_user_id UUID,
    p_market_id UUID,
    p_side VARCHAR(10),
    p_price DECIMAL(12, 2),
    p_quantity DECIMAL(12, 2)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_spread DECIMAL(8, 4);
    v_tracking_id UUID;
BEGIN
    v_spread := calculate_market_spread(p_market_id);
    
    INSERT INTO resting_orders (
        order_id, user_id, market_id, side, price, quantity,
        spread_at_placement, resting_start_time, is_active
    ) VALUES (
        p_order_id, p_user_id, p_market_id, p_side, p_price, p_quantity,
        v_spread, NOW(), TRUE
    )
    RETURNING id INTO v_tracking_id;
    
    RETURN v_tracking_id;
END;
$$;

-- Function to stop tracking a resting order
CREATE OR REPLACE FUNCTION stop_resting_order_tracking(
    p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_resting_seconds INTEGER;
BEGIN
    SELECT resting_start_time INTO v_start_time
    FROM resting_orders
    WHERE order_id = p_order_id AND is_active = TRUE;
    
    IF v_start_time IS NOT NULL THEN
        v_resting_seconds := EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER;
        
        UPDATE resting_orders
        SET 
            resting_end_time = NOW(),
            total_resting_seconds = v_resting_seconds,
            is_active = FALSE
        WHERE order_id = p_order_id AND is_active = TRUE;
    END IF;
END;
$$;

-- Function to determine rebate tier based on volume
CREATE OR REPLACE FUNCTION determine_rebate_tier(
    p_monthly_volume DECIMAL(20, 2)
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier INTEGER;
BEGIN
    SELECT id INTO v_tier
    FROM rebate_tiers_config
    WHERE is_active = TRUE
      AND min_volume <= p_monthly_volume
      AND (max_volume IS NULL OR max_volume > p_monthly_volume)
    ORDER BY id DESC
    LIMIT 1;
    
    RETURN COALESCE(v_tier, 1);
END;
$$;

-- Function to calculate spread multiplier
CREATE OR REPLACE FUNCTION calculate_spread_multiplier(
    p_avg_spread DECIMAL(8, 4),
    p_avg_order_size DECIMAL(20, 2)
)
RETURNS DECIMAL(4, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_multiplier DECIMAL(4, 2);
    v_size_multiplier DECIMAL(4, 2);
BEGIN
    SELECT multiplier INTO v_multiplier
    FROM spread_multiplier_config
    WHERE is_active = TRUE
      AND min_spread <= p_avg_spread
      AND (max_spread IS NULL OR max_spread > p_avg_spread)
    ORDER BY id
    LIMIT 1;
    
    v_multiplier := COALESCE(v_multiplier, 0.5);
    
    IF p_avg_order_size >= 10000 THEN
        v_size_multiplier := 1.0;
    ELSIF p_avg_order_size >= 5000 THEN
        v_size_multiplier := 0.9;
    ELSIF p_avg_order_size >= 2000 THEN
        v_size_multiplier := 0.8;
    ELSE
        v_size_multiplier := 0.5;
    END IF;
    
    RETURN v_multiplier * v_size_multiplier;
END;
$$;

-- Function to update user's monthly volume and tier
CREATE OR REPLACE FUNCTION update_maker_volume(
    p_user_id UUID,
    p_volume DECIMAL(20, 2),
    p_is_maker BOOLEAN,
    p_spread_contribution DECIMAL(20, 4) DEFAULT 0,
    p_resting_seconds INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year_month VARCHAR(7);
    v_current_volume DECIMAL(20, 2);
    v_new_tier INTEGER;
    v_rebate_rate DECIMAL(8, 4);
BEGIN
    v_year_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    INSERT INTO maker_volume_tracking (
        user_id, year_month, maker_volume, taker_volume,
        total_spread_contribution, resting_time_seconds
    ) VALUES (
        p_user_id, v_year_month,
        CASE WHEN p_is_maker THEN p_volume ELSE 0 END,
        CASE WHEN NOT p_is_maker THEN p_volume ELSE 0 END,
        p_spread_contribution, p_resting_seconds
    )
    ON CONFLICT (user_id, year_month) DO UPDATE SET
        maker_volume = maker_volume_tracking.maker_volume + 
            CASE WHEN p_is_maker THEN p_volume ELSE 0 END,
        taker_volume = maker_volume_tracking.taker_volume + 
            CASE WHEN NOT p_is_maker THEN p_volume ELSE 0 END,
        total_spread_contribution = maker_volume_tracking.total_spread_contribution + p_spread_contribution,
        resting_time_seconds = maker_volume_tracking.resting_time_seconds + p_resting_seconds,
        last_updated = NOW();
    
    SELECT maker_volume INTO v_current_volume
    FROM maker_volume_tracking
    WHERE user_id = p_user_id AND year_month = v_year_month;
    
    v_new_tier := determine_rebate_tier(v_current_volume);
    
    SELECT rebate_rate INTO v_rebate_rate
    FROM rebate_tiers_config
    WHERE id = v_new_tier;
    
    UPDATE maker_volume_tracking
    SET 
        rebate_tier = v_new_tier,
        rebate_rate = v_rebate_rate,
        estimated_rebate = v_current_volume * v_rebate_rate,
        last_updated = NOW()
    WHERE user_id = p_user_id AND year_month = v_year_month;
END;
$$;

-- Function to calculate weekly rebate
CREATE OR REPLACE FUNCTION calculate_weekly_rebate(
    p_user_id UUID,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rebate_id UUID;
    v_year_month VARCHAR(7);
    v_volume_tracking RECORD;
    v_spread_reward RECORD;
    v_base_rate DECIMAL(8, 4);
    v_spread_multiplier DECIMAL(4, 2);
    v_final_rate DECIMAL(8, 4);
    v_gross_amount DECIMAL(20, 2);
    v_net_amount DECIMAL(20, 2);
    v_tier_info RECORD;
BEGIN
    v_year_month := TO_CHAR(p_period_start, 'YYYY-MM');
    
    SELECT * INTO v_volume_tracking
    FROM maker_volume_tracking
    WHERE user_id = p_user_id AND year_month = v_year_month;
    
    IF v_volume_tracking IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT * INTO v_spread_reward
    FROM spread_rewards
    WHERE user_id = p_user_id 
      AND calculation_date BETWEEN p_period_start::DATE AND p_period_end::DATE
    ORDER BY bonus_amount DESC
    LIMIT 1;
    
    SELECT * INTO v_tier_info
    FROM rebate_tiers_config
    WHERE id = v_volume_tracking.rebate_tier;
    
    v_base_rate := v_tier_info.rebate_rate;
    v_spread_multiplier := COALESCE(v_spread_reward.final_multiplier, 1.0);
    v_final_rate := v_base_rate * v_spread_multiplier;
    v_gross_amount := v_volume_tracking.qualifying_volume * v_final_rate;
    v_net_amount := v_gross_amount;
    
    INSERT INTO maker_rebates (
        user_id, year_month, rebate_period_start, rebate_period_end,
        total_maker_volume, qualifying_volume, base_rebate_rate,
        spread_multiplier, final_rebate_rate, gross_rebate_amount,
        net_rebate_amount, tier_at_calculation, tier_benefits
    ) VALUES (
        p_user_id, v_year_month, p_period_start, p_period_end,
        v_volume_tracking.maker_volume, v_volume_tracking.qualifying_volume,
        v_base_rate, v_spread_multiplier, v_final_rate, v_gross_amount,
        v_net_amount, v_volume_tracking.rebate_tier, v_tier_info.benefits
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rebate_id;
    
    RETURN v_rebate_id;
END;
$$;

-- Function to claim rebate
CREATE OR REPLACE FUNCTION claim_rebate(
    p_rebate_id UUID,
    p_user_id UUID,
    p_payment_method VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rebate RECORD;
BEGIN
    SELECT * INTO v_rebate
    FROM maker_rebates
    WHERE id = p_rebate_id AND user_id = p_user_id;
    
    IF v_rebate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rebate not found');
    END IF;
    
    IF v_rebate.claim_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rebate already claimed or expired');
    END IF;
    
    UPDATE maker_rebates
    SET 
        claim_status = 'claimed',
        claimed_at = NOW(),
        claimed_by_user_id = p_user_id,
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_rebate_id;
    
    UPDATE maker_volume_tracking
    SET claimed_rebate = claimed_rebate + v_rebate.net_rebate_amount
    WHERE user_id = p_user_id AND year_month = v_rebate.year_month;
    
    RETURN jsonb_build_object(
        'success', true,
        'rebate_id', p_rebate_id,
        'amount', v_rebate.net_rebate_amount,
        'payment_method', p_payment_method
    );
END;
$$;

-- Function to process rebate payment (admin only)
CREATE OR REPLACE FUNCTION process_rebate_payment(
    p_rebate_id UUID,
    p_tx_hash VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE maker_rebates
    SET 
        claim_status = 'paid',
        payment_tx_hash = p_tx_hash,
        payment_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_rebate_id AND claim_status = 'claimed';
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Rebate not in claimable state');
    END IF;
END;
$$;

-- ===================================
-- VIEWS FOR EASY QUERYING
-- ===================================

CREATE OR REPLACE VIEW user_current_rebate_status AS
SELECT 
    mvt.user_id,
    mvt.year_month,
    mvt.maker_volume,
    mvt.qualifying_volume,
    mvt.rebate_tier,
    rtc.tier_name,
    mvt.rebate_rate * 100 as rebate_rate_percent,
    mvt.estimated_rebate,
    mvt.claimed_rebate,
    mvt.estimated_rebate - mvt.claimed_rebate as available_to_claim,
    rtc.benefits,
    mvt.last_updated
FROM maker_volume_tracking mvt
JOIN rebate_tiers_config rtc ON mvt.rebate_tier = rtc.id
WHERE mvt.year_month = TO_CHAR(NOW(), 'YYYY-MM');

CREATE OR REPLACE VIEW user_rebate_history AS
SELECT 
    mr.user_id,
    mr.year_month,
    mr.rebate_period_start,
    mr.rebate_period_end,
    mr.total_maker_volume,
    mr.qualifying_volume,
    mr.base_rebate_rate * 100 as base_rate_percent,
    mr.spread_multiplier,
    mr.final_rebate_rate * 100 as final_rate_percent,
    mr.gross_rebate_amount,
    mr.net_rebate_amount,
    mr.claim_status,
    mr.claimed_at,
    mr.payment_method,
    mr.payment_tx_hash,
    rtc.tier_name
FROM maker_rebates mr
JOIN rebate_tiers_config rtc ON mr.tier_at_calculation = rtc.id
ORDER BY mr.created_at DESC;

-- ===================================
-- ROW LEVEL SECURITY
-- ===================================

ALTER TABLE IF EXISTS resting_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maker_volume_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS maker_rebates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spread_rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own resting orders" ON resting_orders;
DROP POLICY IF EXISTS "Users can view own volume tracking" ON maker_volume_tracking;
DROP POLICY IF EXISTS "Users can view own rebates" ON maker_rebates;
DROP POLICY IF EXISTS "Users can view own spread rewards" ON spread_rewards;

CREATE POLICY "Users can view own resting orders"
    ON resting_orders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own volume tracking"
    ON maker_volume_tracking FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own rebates"
    ON maker_rebates FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own spread rewards"
    ON spread_rewards FOR SELECT
    USING (user_id = auth.uid());

-- ===================================
-- GRANTS
-- ===================================
GRANT ALL ON resting_orders TO authenticated;
GRANT ALL ON maker_volume_tracking TO authenticated;
GRANT ALL ON maker_rebates TO authenticated;
GRANT ALL ON spread_rewards TO authenticated;
GRANT SELECT ON rebate_tiers_config TO authenticated;
GRANT SELECT ON spread_multiplier_config TO authenticated;
GRANT SELECT ON user_current_rebate_status TO authenticated;
GRANT SELECT ON user_rebate_history TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_market_spread TO authenticated;
GRANT EXECUTE ON FUNCTION start_resting_order_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION stop_resting_order_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION determine_rebate_tier TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_spread_multiplier TO authenticated;
GRANT EXECUTE ON FUNCTION update_maker_volume TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_weekly_rebate TO authenticated;
GRANT EXECUTE ON FUNCTION claim_rebate TO authenticated;
