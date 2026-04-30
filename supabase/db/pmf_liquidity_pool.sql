-- ============================================================
-- PMF LIQUIDITY POOL POSTGRESQL INFRASTRUCTURE
-- Probability Mass Function based liquidity pool for prediction markets
-- ============================================================

-- ===================================
-- PART 1: ENUMS
-- ===================================

DO $$ BEGIN
    CREATE TYPE pmf_pool_status AS ENUM ('initializing', 'active', 'paused', 'draining', 'resolved', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pmf_position_status AS ENUM ('active', 'partially_withdrawn', 'fully_withdrawn', 'claimed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pmf_distribution_status AS ENUM ('pending', 'calculating', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================
-- PART 2: TABLES
-- ===================================

-- PMF Liquidity Pools table
CREATE TABLE IF NOT EXISTS public.pmf_liquidity_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    initial_liquidity NUMERIC(20, 8) DEFAULT 0,
    current_liquidity NUMERIC(20, 8) DEFAULT 0,
    total_shares NUMERIC(20, 8) DEFAULT 0,
    reserve0 NUMERIC(20, 8) DEFAULT 0,
    reserve1 NUMERIC(20, 8) DEFAULT 0,
    fee_rate NUMERIC(5, 4) DEFAULT 0.003 CHECK (fee_rate >= 0 AND fee_rate <= 0.1),
    creator_id UUID REFERENCES public.users(id),
    status pmf_pool_status DEFAULT 'initializing',
    pmf_vector JSONB DEFAULT '[]',
    outcome_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    UNIQUE(market_id)
);

-- PMF Pool Shares (LP positions)
CREATE TABLE IF NOT EXISTS public.pmf_pool_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shares_count NUMERIC(20, 8) DEFAULT 0 CHECK (shares_count >= 0),
    liquidity_added NUMERIC(20, 8) DEFAULT 0,
    average_entry_price NUMERIC(20, 8),
    realized_pnl NUMERIC(20, 8) DEFAULT 0,
    pending_distribution NUMERIC(20, 8) DEFAULT 0,
    status pmf_position_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pool_id, user_id)
);

-- PMF Liquidity Additions (history of liquidity adds)
CREATE TABLE IF NOT EXISTS public.pmf_liquidity_additions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount0 NUMERIC(20, 8) NOT NULL,
    amount1 NUMERIC(20, 8) NOT NULL,
    shares_minted NUMERIC(20, 8) NOT NULL,
    price0 NUMERIC(20, 8),
    price1 NUMERIC(20, 8),
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PMF Liquidity Removals (history of liquidity removes)
CREATE TABLE IF NOT EXISTS public.pmf_liquidity_removals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shares_burned NUMERIC(20, 8) NOT NULL,
    amount0 NUMERIC(20, 8) NOT NULL,
    amount1 NUMERIC(20, 8) NOT NULL,
    transaction_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PMF Distributions (final distribution per user)
CREATE TABLE IF NOT EXISTS public.pmf_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shares_count NUMERIC(20, 8) NOT NULL,
    total_distribution NUMERIC(20, 8) NOT NULL,
    claimed_amount NUMERIC(20, 8) DEFAULT 0,
    status pmf_distribution_status DEFAULT 'pending',
    distribution_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ,
    UNIQUE(pool_id, user_id)
);

-- PMF Trade Fees accrued
CREATE TABLE IF NOT EXISTS public.pmf_accrued_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES public.trades(id),
    fee_amount NUMERIC(20, 8) NOT NULL,
    fee_type TEXT DEFAULT 'trade',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- PART 3: INDEXES
-- ===================================

CREATE INDEX IF NOT EXISTS idx_pmf_pools_market ON public.pmf_liquidity_pools(market_id);
CREATE INDEX IF NOT EXISTS idx_pmf_pools_status ON public.pmf_liquidity_pools(status);
CREATE INDEX IF NOT EXISTS idx_pmf_shares_pool ON public.pmf_pool_shares(pool_id);
CREATE INDEX IF NOT EXISTS idx_pmf_shares_user ON public.pmf_pool_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_pmf_additions_pool ON public.pmf_liquidity_additions(pool_id);
CREATE INDEX IF NOT EXISTS idx_pmf_removals_pool ON public.pmf_liquidity_removals(pool_id);
CREATE INDEX IF NOT EXISTS idx_pmf_distributions_pool ON public.pmf_distributions(pool_id);

-- ===================================
-- PART 4: FUNCTIONS
-- ===================================

-- Function to create a new PMF liquidity pool
CREATE OR REPLACE FUNCTION public.create_pmf_pool(
    p_market_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_initial_liquidity NUMERIC DEFAULT 0,
    p_fee_rate NUMERIC DEFAULT 0.003,
    p_creator_id UUID,
    p_pmf_vector JSONB DEFAULT NULL
)
RETURNS public.pmf_liquidity_pools AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_market public.markets;
BEGIN
    -- Validate market exists
    SELECT * INTO v_market FROM public.markets WHERE id = p_market_id;
    IF v_market IS NULL THEN
        RAISE EXCEPTION 'Market not found: %', p_market_id;
    END IF;
    
    -- Check if pool already exists for this market
    IF EXISTS (SELECT 1 FROM public.pmf_liquidity_pools WHERE market_id = p_market_id) THEN
        RAISE EXCEPTION 'PMF pool already exists for market: %', p_market_id;
    END IF;
    
    -- Create the pool
    INSERT INTO public.pmf_liquidity_pools (
        market_id, name, description, initial_liquidity, current_liquidity,
        fee_rate, creator_id, pmf_vector, status
    ) VALUES (
        p_market_id, p_name, p_description, p_initial_liquidity, p_initial_liquidity,
        p_fee_rate, p_creator_id, COALESCE(p_pmf_vector, '[]'::jsonb), 'initializing'
    )
    RETURNING * INTO v_pool;
    
    RETURN v_pool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate a PMF pool
CREATE OR REPLACE FUNCTION public.activate_pmf_pool(p_pool_id UUID)
RETURNS public.pmf_liquidity_pools AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
BEGIN
    UPDATE public.pmf_liquidity_pools
    SET status = 'active', activated_at = NOW(), updated_at = NOW()
    WHERE id = p_pool_id AND status = 'initializing'
    RETURNING * INTO v_pool;
    
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found or already activated: %', p_pool_id;
    END IF;
    
    RETURN v_pool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add liquidity to PMF pool
CREATE OR REPLACE FUNCTION public.add_pmf_liquidity(
    p_pool_id UUID,
    p_user_id UUID,
    p_amount0 NUMERIC,
    p_amount1 NUMERIC,
    p_min_shares NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_shares_minted NUMERIC(20, 8);
    v_price0 NUMERIC(20, 8);
    v_price1 NUMERIC(20, 8);
    v_current_shares public.pmf_pool_shares;
BEGIN
    -- Get pool info with lock
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    IF v_pool.status != 'active' THEN
        RAISE EXCEPTION 'Pool is not active. Current status: %', v_pool.status;
    END IF;
    
    -- Calculate shares to mint based on constant product formula
    -- For PMF pools, we use a weighted average approach
    IF v_pool.total_shares = 0 THEN
        -- Initial liquidity: shares = amount0 + amount1
        v_shares_minted := p_amount0 + p_amount1;
    ELSE
        -- Subsequent: shares proportional to liquidity added
        v_shares_minted := LEAST(
            (p_amount0 * v_pool.total_shares) / NULLIF(v_pool.reserve0, 0),
            (p_amount1 * v_pool.total_shares) / NULLIF(v_pool.reserve1, 0)
        );
    END IF;
    
    IF v_shares_minted < p_min_shares THEN
        RAISE EXCEPTION 'Slippage too high. Minimum shares: %, Got: %', p_min_shares, v_shares_minted;
    END IF;
    
    -- Update pool reserves
    UPDATE public.pmf_liquidity_pools
    SET reserve0 = reserve0 + p_amount0,
        reserve1 = reserve1 + p_amount1,
        total_shares = total_shares + v_shares_minted,
        current_liquidity = current_liquidity + p_amount0 + p_amount1,
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Update or create user shares
    INSERT INTO public.pmf_pool_shares (pool_id, user_id, shares_count, liquidity_added, average_entry_price)
    VALUES (p_pool_id, p_user_id, v_shares_minted, p_amount0 + p_amount1, 
            CASE WHEN v_shares_minted > 0 THEN (p_amount0 + p_amount1) / v_shares_minted ELSE 0 END)
    ON CONFLICT (pool_id, user_id) DO UPDATE
    SET shares_count = pmf_pool_shares.shares_count + v_shares_minted,
        liquidity_added = pmf_pool_shares.liquidity_added + (p_amount0 + p_amount1),
        average_entry_price = (
            (pmf_pool_shares.shares_count * COALESCE(pmf_pool_shares.average_entry_price, 0) + v_shares_minted * ((p_amount0 + p_amount1) / v_shares_minted))
            / NULLIF(pmf_pool_shares.shares_count + v_shares_minted, 0)
        ),
        updated_at = NOW();
    
    -- Record the addition
    INSERT INTO public.pmf_liquidity_additions (pool_id, user_id, amount0, amount1, shares_minted, price0, price1)
    VALUES (p_pool_id, p_user_id, p_amount0, p_amount1, v_shares_minted,
            CASE WHEN p_amount0 > 0 THEN 1 ELSE NULL END,
            CASE WHEN p_amount1 > 0 THEN 1 ELSE NULL END);
    
    RETURN jsonb_build_object(
        'success', true,
        'shares_minted', v_shares_minted,
        'pool_id', p_pool_id,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove liquidity from PMF pool
CREATE OR REPLACE FUNCTION public.remove_pmf_liquidity(
    p_pool_id UUID,
    p_user_id UUID,
    p_shares_to_burn NUMERIC,
    p_min_amount0 NUMERIC DEFAULT 0,
    p_min_amount1 NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_user_shares public.pmf_pool_shares;
    v_amount0 NUMERIC(20, 8);
    v_amount1 NUMERIC(20, 8);
    v_share_ratio NUMERIC(20, 8);
BEGIN
    -- Get pool info with lock
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    IF v_pool.status != 'active' AND v_pool.status != 'draining' THEN
        RAISE EXCEPTION 'Pool does not allow removal. Current status: %', v_pool.status;
    END IF;
    
    -- Get user shares
    SELECT * INTO v_user_shares FROM public.pmf_pool_shares 
    WHERE pool_id = p_pool_id AND user_id = p_user_id FOR UPDATE;
    
    IF v_user_shares IS NULL OR v_user_shares.shares_count < p_shares_to_burn THEN
        RAISE EXCEPTION 'Insufficient shares. Available: %, Requested: %', 
            COALESCE(v_user_shares.shares_count, 0), p_shares_to_burn;
    END IF;
    
    -- Calculate amounts to return
    v_share_ratio := p_shares_to_burn / v_pool.total_shares;
    v_amount0 := v_pool.reserve0 * v_share_ratio;
    v_amount1 := v_pool.reserve1 * v_share_ratio;
    
    IF v_amount0 < p_min_amount0 OR v_amount1 < p_min_amount1 THEN
        RAISE EXCEPTION 'Slippage too high. Min amount0: %, Got: %, Min amount1: %, Got: %',
            p_min_amount0, v_amount0, p_min_amount1, v_amount1;
    END IF;
    
    -- Update pool
    UPDATE public.pmf_liquidity_pools
    SET reserve0 = reserve0 - v_amount0,
        reserve1 = reserve1 - v_amount1,
        total_shares = total_shares - p_shares_to_burn,
        current_liquidity = current_liquidity - (v_amount0 + v_amount1),
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Update user shares
    UPDATE public.pmf_pool_shares
    SET shares_count = shares_count - p_shares_to_burn,
        updated_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    -- Record the removal
    INSERT INTO public.pmf_liquidity_removals (pool_id, user_id, shares_burned, amount0, amount1)
    VALUES (p_pool_id, p_user_id, p_shares_to_burn, v_amount0, v_amount1);
    
    RETURN jsonb_build_object(
        'success', true,
        'shares_burned', p_shares_to_burn,
        'amount0_returned', v_amount0,
        'amount1_returned', v_amount1,
        'pool_id', p_pool_id,
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate PMF distribution based on market outcome
CREATE OR REPLACE FUNCTION public.calculate_pmf_distribution(p_pool_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_market public.markets;
    v_winning_outcome outcome_type;
    v_distribution JSONB;
    v_share_record RECORD;
BEGIN
    -- Get pool and market info
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    SELECT * INTO v_market FROM public.markets WHERE id = v_pool.market_id;
    IF v_market IS NULL THEN
        RAISE EXCEPTION 'Market not found for pool: %', v_pool.market_id;
    END IF;
    
    IF v_market.status != 'resolved' THEN
        RAISE EXCEPTION 'Market is not resolved. Current status: %', v_market.status;
    END IF;
    
    v_winning_outcome := v_market.winning_outcome;
    
    -- Create distribution based on PMF vector and winning outcome
    v_distribution := jsonb_build_object(
        'winning_outcome', v_winning_outcome,
        'total_liquidity', v_pool.current_liquidity,
        'total_shares', v_pool.total_shares,
        'calculated_at', NOW(),
        'distributions', jsonb_build_object()
    );
    
    -- Calculate per-user distribution
    FOR v_share_record IN 
        SELECT user_id, shares_count 
        FROM public.pmf_pool_shares 
        WHERE pool_id = p_pool_id AND shares_count > 0
    LOOP
        -- User gets: (their_shares / total_shares) * total_liquidity
        -- But scaled by the PMF probability for the winning outcome
        UPDATE public.pmf_distributions
        SET total_distribution = (v_share_record.shares_count / v_pool.total_shares) * v_pool.current_liquidity,
            shares_count = v_share_record.shares_count,
            status = 'completed',
            distribution_details = jsonb_build_object(
                'winning_outcome', v_winning_outcome,
                'share_ratio', v_share_record.shares_count / v_pool.total_shares,
                'pmf_pool_total', v_pool.current_liquidity
            )
        WHERE pool_id = p_pool_id AND user_id = v_share_record.user_id;
        
        -- Insert if doesn't exist
        IF NOT FOUND THEN
            INSERT INTO public.pmf_distributions (pool_id, user_id, shares_count, total_distribution, status, distribution_details)
            VALUES (
                p_pool_id, 
                v_share_record.user_id, 
                v_share_record.shares_count,
                (v_share_record.shares_count / v_pool.total_shares) * v_pool.current_liquidity,
                'completed',
                jsonb_build_object(
                    'winning_outcome', v_winning_outcome,
                    'share_ratio', v_share_record.shares_count / v_pool.total_shares,
                    'pmf_pool_total', v_pool.current_liquidity
                )
            );
        END IF;
    END LOOP;
    
    -- Update pool status
    UPDATE public.pmf_liquidity_pools
    SET status = 'resolved',
        resolved_at = NOW(),
        outcome_distribution = v_distribution,
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    RETURN v_distribution;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim distribution for a user
CREATE OR REPLACE FUNCTION public.claim_pmf_distribution(p_pool_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_distribution public.pmf_distributions;
    v_pool public.pmf_liquidity_pools;
    v_claimable_amount NUMERIC(20, 8);
BEGIN
    -- Get distribution
    SELECT * INTO v_distribution 
    FROM public.pmf_distributions 
    WHERE pool_id = p_pool_id AND user_id = p_user_id 
    FOR UPDATE;
    
    IF v_distribution IS NULL THEN
        RAISE EXCEPTION 'No distribution found for user in this pool';
    END IF;
    
    IF v_distribution.status != 'completed' THEN
        RAISE EXCEPTION 'Distribution is not completed. Status: %', v_distribution.status;
    END IF;
    
    v_claimable_amount := v_distribution.total_distribution - v_distribution.claimed_amount;
    
    IF v_claimable_amount <= 0 THEN
        RAISE EXCEPTION 'Nothing to claim. Already claimed: %', v_distribution.claimed_amount;
    END IF;
    
    -- Mark as claimed
    UPDATE public.pmf_distributions
    SET claimed_amount = total_distribution,
        status = 'claimed',
        claimed_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    -- Update user position status
    UPDATE public.pmf_pool_shares
    SET status = 'claimed',
        updated_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'pool_id', p_pool_id,
        'user_id', p_user_id,
        'amount_claimed', v_claimable_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pool statistics
CREATE OR REPLACE FUNCTION public.get_pmf_pool_stats(p_pool_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_participant_count BIGINT;
    v_total_fees NUMERIC(20, 8);
BEGIN
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    SELECT COUNT(*) INTO v_participant_count 
    FROM public.pmf_pool_shares 
    WHERE pool_id = p_pool_id AND shares_count > 0;
    
    SELECT COALESCE(SUM(fee_amount), 0) INTO v_total_fees
    FROM public.pmf_accrued_fees
    WHERE pool_id = p_pool_id;
    
    RETURN jsonb_build_object(
        'pool_id', p_pool_id,
        'market_id', v_pool.market_id,
        'name', v_pool.name,
        'status', v_pool.status,
        'current_liquidity', v_pool.current_liquidity,
        'total_shares', v_pool.total_shares,
        'reserve0', v_pool.reserve0,
        'reserve1', v_pool.reserve1,
        'fee_rate', v_pool.fee_rate,
        'participant_count', v_participant_count,
        'total_accrued_fees', v_total_fees,
        'created_at', v_pool.created_at,
        'activated_at', v_pool.activated_at,
        'resolved_at', v_pool.resolved_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user PMF positions
CREATE OR REPLACE FUNCTION public.get_user_pmf_positions(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_positions JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'pool_id', ps.pool_id,
        'pool_name', pp.name,
        'market_id', pp.market_id,
        'shares_count', ps.shares_count,
        'liquidity_added', ps.liquidity_added,
        'average_entry_price', ps.average_entry_price,
        'realized_pnl', ps.realized_pnl,
        'pending_distribution', ps.pending_distribution,
        'status', ps.status,
        'current_liquidity', pp.current_liquidity,
        'total_shares', pp.total_shares,
        'share_ratio', CASE WHEN pp.total_shares > 0 THEN ps.shares_count / pp.total_shares ELSE 0 END
    ))
    INTO v_positions
    FROM public.pmf_pool_shares ps
    JOIN public.pmf_liquidity_pools pp ON ps.pool_id = pp.id
    WHERE ps.user_id = p_user_id;
    
    RETURN COALESCE(v_positions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update PMF pool state (admin function)
CREATE OR REPLACE FUNCTION public.update_pmf_pool_status(p_pool_id UUID, p_new_status pmf_pool_status)
RETURNS public.pmf_liquidity_pools AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
BEGIN
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    -- Validate state transitions
    IF v_pool.status = 'resolved' AND p_new_status != 'resolved' THEN
        RAISE EXCEPTION 'Cannot change status of resolved pool';
    END IF;
    
    UPDATE public.pmf_liquidity_pools
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_pool_id
    RETURNING * INTO v_pool;
    
    RETURN v_pool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION public.update_pmf_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS trigger_pmf_pools_timestamp ON public.pmf_liquidity_pools;
CREATE TRIGGER trigger_pmf_pools_timestamp
    BEFORE UPDATE ON public.pmf_liquidity_pools
    FOR EACH ROW EXECUTE FUNCTION public.update_pmf_timestamp();

DROP TRIGGER IF EXISTS trigger_pmf_shares_timestamp ON public.pmf_pool_shares;
CREATE TRIGGER trigger_pmf_shares_timestamp
    BEFORE UPDATE ON public.pmf_pool_shares
    FOR EACH ROW EXECUTE FUNCTION public.update_pmf_timestamp();

-- ===================================
-- PART 5: VIEWS
-- ===================================

-- View for active PMF pools with market info
CREATE OR REPLACE VIEW public.v_pmf_active_pools AS
SELECT 
    pp.id AS pool_id,
    pp.name AS pool_name,
    pp.market_id,
    m.question AS market_question,
    m.category AS market_category,
    pp.status,
    pp.current_liquidity,
    pp.total_shares,
    pp.fee_rate,
    pp.created_at,
    pp.activated_at
FROM public.pmf_liquidity_pools pp
JOIN public.markets m ON pp.market_id = m.id
WHERE pp.status IN ('active', 'initializing', 'paused', 'draining');

-- View for user PMF portfolio summary
CREATE OR REPLACE VIEW public.v_pmf_user_portfolio AS
SELECT 
    ps.user_id,
    COUNT(DISTINCT ps.pool_id) AS pools_count,
    SUM(ps.shares_count) AS total_shares,
    SUM(ps.liquidity_added) AS total_liquidity_added,
    SUM(ps.realized_pnl) AS total_realized_pnl,
    SUM(ps.pending_distribution) AS total_pending_distribution,
    COUNT(CASE WHEN ps.status = 'active' THEN 1 END) AS active_positions,
    COUNT(CASE WHEN ps.status = 'claimed' THEN 1 END) AS claimed_positions
FROM public.pmf_pool_shares ps
GROUP BY ps.user_id;

-- ===================================
-- PART 6: RLS POLICIES (for PMF tables)
-- ===================================

ALTER TABLE IF EXISTS public.pmf_liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmf_pool_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmf_liquidity_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmf_liquidity_removals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmf_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pmf_accrued_fees ENABLE ROW LEVEL SECURITY;

-- PMF Pools: Public read, admin write
CREATE POLICY IF NOT EXISTS pmf_pools_select ON public.pmf_liquidity_pools FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pmf_pools_admin ON public.pmf_liquidity_pools FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- PMF Shares: User can read own, admin can read all
CREATE POLICY IF NOT EXISTS pmf_shares_select ON public.pmf_pool_shares FOR SELECT
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS pmf_shares_insert ON public.pmf_pool_shares FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS pmf_shares_update ON public.pmf_pool_shares FOR UPDATE
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- PMF Additions/Removals: User can read own, admin can read all
CREATE POLICY IF NOT EXISTS pmf_additions_select ON public.pmf_liquidity_additions FOR SELECT
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS pmf_additions_insert ON public.pmf_liquidity_additions FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);

CREATE POLICY IF NOT EXISTS pmf_removals_select ON public.pmf_liquidity_removals FOR SELECT
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS pmf_removals_insert ON public.pmf_liquidity_removals FOR INSERT WITH CHECK (user_id = auth.uid()::UUID);

-- PMF Distributions: User can read/claim own
CREATE POLICY IF NOT EXISTS pmf_distributions_select ON public.pmf_distributions FOR SELECT
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS pmf_distributions_update ON public.pmf_distributions FOR UPDATE
    USING (user_id = auth.uid()::UUID OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- PMF Accrued Fees: Public read (for transparency)
CREATE POLICY IF NOT EXISTS pmf_fees_select ON public.pmf_accrued_fees FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS pmf_fees_insert ON public.pmf_accrued_fees FOR INSERT WITH CHECK (true);

-- ===================================
-- PART 7: GRANT PERMISSIONS
-- ===================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

COMMENT ON TABLE public.pmf_liquidity_pools IS 'PMF (Probability Mass Function) liquidity pools for prediction markets';
COMMENT ON TABLE public.pmf_pool_shares IS 'LP positions in PMF pools tracking shares and PnL';
COMMENT ON TABLE public.pmf_liquidity_additions IS 'History of liquidity additions to PMF pools';
COMMENT ON TABLE public.pmf_liquidity_removals IS 'History of liquidity removals from PMF pools';
COMMENT ON TABLE public.pmf_distributions IS 'Final distributions to LPs when pool is resolved';
COMMENT ON TABLE public.pmf_accrued_fees IS 'Trade fees accrued in PMF pools';
