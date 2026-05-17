-- ============================================================
-- FULL SCHEMA SYNC: Add all missing columns to local DB
-- so it matches the cloud schema that the app expects
-- ============================================================

-- 1. users: Add missing columns from cloud
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_tier TEXT DEFAULT 'public';
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_followers INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

-- 2. wallets: Add missing columns from cloud
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usdt_address TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usdc_address TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network_type TEXT DEFAULT 'TRC20';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS address_type TEXT DEFAULT 'user';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS asset TEXT DEFAULT 'BDT';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_deposited DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_earned DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_fees_paid DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_deposit_at TIMESTAMPTZ;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMPTZ;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BDT';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(20,8);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS monthly_withdrawal_limit DECIMAL(20,8);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS locked_usdt DECIMAL(20,8) DEFAULT 0;

-- 3. markets: Add missing columns from cloud
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_source_type TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_data JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS fee_percent DECIMAL(10,4) DEFAULT 0.02;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS initial_liquidity DECIMAL(20,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS maker_rebate_percent DECIMAL(10,4) DEFAULT 0.01;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_category TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS min_tick DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS max_tick DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_tick DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS realized_volatility_24h DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS pending_tick_change BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_source_url TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE markets ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'YES_NO';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS answer1 TEXT DEFAULT 'YES';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS answer2 TEXT DEFAULT 'NO';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS liquidity DECIMAL(20,8) DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_delay INTEGER;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS condition_id TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS token1 TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS token2 TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS neg_risk BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolver_reference TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS volume DECIMAL(20,8) DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type TEXT DEFAULT 'binary';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS min_value DECIMAL(10,4);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS max_value DECIMAL(10,4);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS scalar_unit TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS yes_price_change_24h DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS no_price_change_24h DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS unique_traders INTEGER DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS close_warned BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS yes_price DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS no_price DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS trading_phase TEXT DEFAULT 'open';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS next_phase_time TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS auction_data JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_delay_hours INTEGER DEFAULT 24;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_method TEXT DEFAULT 'manual';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS volume_24h DECIMAL(20,8) DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS best_bid DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS best_ask DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS spread DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS unique_traders_24h INTEGER DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS last_trade_price DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS last_trade_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'open';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS oracle_type TEXT DEFAULT 'manual';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_review_status TEXT DEFAULT 'not_required';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_review_notes TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_reviewed_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS liquidity_commitment DECIMAL(20,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS liquidity_deposited BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployment_config JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployment_tx_hash TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS resolution_criteria TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS stages_completed TEXT[];
ALTER TABLE markets ADD COLUMN IF NOT EXISTS trading_fee_percent DECIMAL(10,4) DEFAULT 0.02;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS confidence DECIMAL(5,4);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS trader_count INTEGER DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_reviewer_id UUID;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS simulation_config JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS simulation_results JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS admin_bypass_legal_review BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS admin_bypass_liquidity BOOLEAN DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS trading_ends TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS name_bn TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS question_bn TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_address TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_price_yes DECIMAL(10,8);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_price_no DECIMAL(10,8);

-- 4. orders: Add missing columns from cloud
ALTER TABLE orders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'limit';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_quantity DECIMAL(20,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cost DECIMAL(20,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(20,8) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_rate DECIMAL(10,6);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_post_only BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_reduce_only BOOLEAN DEFAULT false;

-- 5. notifications: Add missing columns from cloud
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS market_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS trade_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 6. exchange_rates: Add missing columns from cloud
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS bdt_to_usdt DECIMAL(20,10);
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS usdt_to_bdt DECIMAL(20,10);
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ;
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS effective_until TIMESTAMPTZ;
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS previous_rate DECIMAL(20,10);
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS change_percentage DECIMAL(10,6);

-- 7. order_book: Add missing columns from cloud
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS tif TEXT DEFAULT 'GTC';
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS gtd_expiry TIMESTAMPTZ;
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS fill_count INTEGER DEFAULT 0;
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS last_fill_at TIMESTAMPTZ;
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS time_priority INTEGER DEFAULT 0;
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS is_re_entry BOOLEAN DEFAULT false;
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS parent_order_id UUID;

-- 8. positions: Add missing columns from cloud
ALTER TABLE positions ADD COLUMN IF NOT EXISTS outcome_index INTEGER;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS unrealized_pnl DECIMAL(20,8) DEFAULT 0;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS side TEXT DEFAULT 'buy';

-- 9. trades: Add missing columns from cloud (match on different primary keys)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS maker_order_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS taker_order_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS taker_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE trades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE trades ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(20,8) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS maker_fee DECIMAL(20,8) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS taker_fee DECIMAL(20,8) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'external';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- 10. comments: Add missing columns from cloud
ALTER TABLE comments ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 11. leaderboard: Add missing columns from cloud
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS total_pnl DECIMAL(20,8) DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS win_count INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS loss_count INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS trade_count INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,4) DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS best_trade DECIMAL(20,8);
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS worst_trade DECIMAL(20,8);
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS rank_tier TEXT DEFAULT 'bronze';
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS badge_ids UUID[];
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS season TEXT;

-- 12. withdrawal_requests: Create the missing table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    usdt_amount DECIMAL(20,8) NOT NULL DEFAULT 0,
    bdt_amount DECIMAL(20,8),
    exchange_rate DECIMAL(20,10),
    mfs_provider TEXT,
    recipient_number TEXT,
    recipient_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','processing','completed','cancelled')),
    balance_hold_id UUID,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    admin_notes TEXT,
    transfer_proof_url TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON withdrawal_requests TO anon;
GRANT ALL ON withdrawal_requests TO authenticated;
GRANT ALL ON withdrawal_requests TO authenticated;
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all withdrawals" ON withdrawal_requests FOR ALL USING (is_admin_user());

-- 13. Oracle requests: Add missing columns from cloud
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'resolve';
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS proposer_id UUID REFERENCES users(id);
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS proposed_outcome TEXT;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4);
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS evidence_text TEXT;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS evidence_urls TEXT[];
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS bond_amount DECIMAL(20,8) DEFAULT 100;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS bond_currency TEXT DEFAULT 'USDT';
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS challenge_window_ends_at TIMESTAMPTZ;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS reasoning TEXT;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS dispute_count INTEGER DEFAULT 0;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN DEFAULT false;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS resolution TEXT;

-- 14. settlement_records: Add missing columns
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id);
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,8) NOT NULL;
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS winning_outcome TEXT NOT NULL;
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS total_volume DECIMAL(20,8) DEFAULT 0;
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS total_fees DECIMAL(20,8) DEFAULT 0;
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS settlement_strategy TEXT DEFAULT 'manual';
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE settlement_records ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 15. fill_records: Sync columns with cloud (the local version has different column names)
-- First add any missing columns (don't rename existing ones to avoid breaking local app)
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS quantity DECIMAL(20,8);
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS total_value DECIMAL(20,8);
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS counterparty_order_id UUID;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS counterparty_user_id UUID;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS trade_id UUID;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS fill_number INTEGER DEFAULT 1;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS is_maker BOOLEAN DEFAULT false;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS transaction_hash TEXT;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS blockchain_reference TEXT;
ALTER TABLE fill_records ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ DEFAULT NOW();

-- 16. events: The local 'events' is a VIEW - check if we need to recreate as table
-- Check current events view definition
DO $$
BEGIN
    -- If events is a view, we need to recreate the underlying table
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'events') THEN
        RAISE NOTICE 'events is a VIEW - needs special handling';
    ELSE
        RAISE NOTICE 'events is a TABLE - ok';
    END IF;
END $$;

-- 17. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_orders_market_id ON orders(market_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_book_market_side ON order_book(market_id, side);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base ON exchange_rates(base_currency, quote_currency);
CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug);
CREATE INDEX IF NOT EXISTS idx_markets_creator ON markets(creator_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Verify
SELECT 'Schema sync complete' as status;
