-- =============================================================================
-- MIGRATION: Payment System Phase 1 — Agent-Match, Voucher, Crypto, Partners
-- Applied: 2026-05-11
-- Purpose: Production-ready deposit/withdrawal infrastructure for Bangladesh
-- =============================================================================

-- Enable UUID extension (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PAYMENT AGENTS — ২০১৮০১২০১২৬০১ স্টার্যুস বিতরণ প্রতিনিধি
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    telegram_username TEXT,
    commission_rate NUMERIC DEFAULT 0.005 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    trust_score NUMERIC DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','busy','offline','suspended')),
    daily_limit_usdt NUMERIC DEFAULT 5000 CHECK (daily_limit_usdt >= 0),
    today_processed_usdt NUMERIC DEFAULT 0 CHECK (today_processed_usdt >= 0),
    total_processed_usdt NUMERIC DEFAULT 0 CHECK (total_processed_usdt >= 0),
    avg_response_seconds INTEGER DEFAULT 0 CHECK (avg_response_seconds >= 0),
    active_sessions INTEGER DEFAULT 0 CHECK (active_sessions >= 0),
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    missed_sessions INTEGER DEFAULT 0 CHECK (missed_sessions >= 0),
    dispute_losses INTEGER DEFAULT 0 CHECK (dispute_losses >= 0),
    streak_fast_confirmations INTEGER DEFAULT 0 CHECK (streak_fast_confirmations >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.payment_agents IS 'পেমেন্ট এজেন্ট তালিদা — bKash/Nagad/Rocket/Upay বিতরণ প্রতিনিধি';
COMMENT ON COLUMN public.payment_agents.trust_score IS '0-100 স্কোর';
COMMENT ON COLUMN public.payment_agents.commission_rate IS 'প্রতি ট্রান্সাকশনে কমিশন (0.005 = 0.5%)';
COMMENT ON COLUMN public.payment_agents.daily_limit_usdt IS 'প্রতি দিন সর্বাধিক USDT লিমিট';

CREATE INDEX IF NOT EXISTS idx_payment_agents_status ON public.payment_agents(status);
CREATE INDEX IF NOT EXISTS idx_payment_agents_trust ON public.payment_agents(trust_score DESC);

-- =============================================================================
-- 2. AGENT MFS NUMBERS — রোটেটিড MFS নম্বর পুল
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.agent_mfs_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.payment_agents(id) ON DELETE CASCADE,
    provider mfs_provider NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    daily_limit_bdt NUMERIC DEFAULT 100000 CHECK (daily_limit_bdt >= 0),
    today_received_bdt NUMERIC DEFAULT 0 CHECK (today_received_bdt >= 0),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.agent_mfs_numbers IS 'এজেন্টদের bKash/Nagad/Rocket/Upay নম্বর সমূহ';
COMMENT ON COLUMN public.agent_mfs_numbers.provider IS 'MFS প্রকার: bkash, nagad, rocket, upay';

CREATE INDEX IF NOT EXISTS idx_agent_mfs_agent ON public.agent_mfs_numbers(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_mfs_provider ON public.agent_mfs_numbers(provider);
CREATE INDEX IF NOT EXISTS idx_agent_mfs_active ON public.agent_mfs_numbers(is_active);

-- =============================================================================
-- 3. DEPOSIT SESSIONS — কাস্টম এজেন্ট-ম্যাচ সিস্টেম
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.deposit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agent_id UUID REFERENCES public.payment_agents(id),
    mfs_number_id UUID REFERENCES public.agent_mfs_numbers(id),
    session_code TEXT UNIQUE NOT NULL,
    amount_bdt NUMERIC CHECK (amount_bdt > 0),
    amount_usdt NUMERIC CHECK (amount_usdt > 0),
    exchange_rate NUMERIC CHECK (exchange_rate > 0),
    status TEXT DEFAULT 'waiting_payment' 
        CHECK (status IN ('waiting_payment','payment_sent','agent_confirmed','auto_credited','expired','disputed','cancelled')),
    payment_method mfs_provider,
    sender_number TEXT,
    sender_name TEXT,
    txn_id TEXT,
    screenshot_url TEXT,
    admin_notes TEXT,
    agent_confirmed_at TIMESTAMPTZ,
    agent_confirmed_by UUID REFERENCES public.payment_agents(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

COMMENT ON TABLE public.deposit_sessions IS 'ডিপোজিট সেশন — যুজার এগার এজেন্টের মাধ্যমে লেনদেন';
COMMENT ON COLUMN public.deposit_sessions.session_code IS 'ইউনিক সেশন কোড, যামন: PLY-7X9K2';
COMMENT ON COLUMN public.deposit_sessions.status IS 'waiting_payment=অপেক্ষারী, payment_sent=পেমেন্ট পাঠিয়েছে, agent_confirmed=এজেন্ট নিশ্চিত, auto_credited=স্বয়ংক্রিয় ক্রেডিট';

CREATE INDEX IF NOT EXISTS idx_deposit_sessions_user ON public.deposit_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_sessions_agent ON public.deposit_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_deposit_sessions_status ON public.deposit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_deposit_sessions_code ON public.deposit_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_deposit_sessions_expires ON public.deposit_sessions(expires_at);

-- =============================================================================
-- 4. VOUCHER CODES — ভাউচার সিস্টেম
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.voucher_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    usdt_value NUMERIC NOT NULL CHECK (usdt_value > 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','disabled')),
    redeemed_by UUID,
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    batch_id TEXT,
    notes TEXT
);

COMMENT ON TABLE public.voucher_codes IS 'ভাউচার কোড সমূহ — অফলাইন কিনা → ওনলাইন রিডিম';
COMMENT ON COLUMN public.voucher_codes.code IS 'ভাউচার কোড, যামন: POLY-XXXX-XXXX';

CREATE INDEX IF NOT EXISTS idx_voucher_codes_code ON public.voucher_codes(code);
CREATE INDEX IF NOT EXISTS idx_voucher_codes_status ON public.voucher_codes(status);
CREATE INDEX IF NOT EXISTS idx_voucher_codes_batch ON public.voucher_codes(batch_id);

-- =============================================================================
-- 5. USER CRYPTO ADDRESSES — বিভিন্ন নেটওয়ার্ক USDT ডিপোজিট এড্ড্রেস
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_crypto_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    network TEXT NOT NULL CHECK (network IN ('bep20','trc20','ton','erc20')),
    address TEXT NOT NULL,
    memo TEXT,
    is_active BOOLEAN DEFAULT true,
    total_received_usdt NUMERIC DEFAULT 0 CHECK (total_received_usdt >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

COMMENT ON TABLE public.user_crypto_addresses IS 'যুজারপ্রতি ক্রিপ্টো ডিপোজিট এড্ড্রেস';
COMMENT ON COLUMN public.user_crypto_addresses.network IS 'BEP-20(BSC), TRC-20(Tron), TON, ERC-20(Ethereum)';
COMMENT ON COLUMN public.user_crypto_addresses.memo IS 'সমার্ট মেমো কন্ট্রাক্ট শোধকরতা';

CREATE INDEX IF NOT EXISTS idx_user_crypto_user ON public.user_crypto_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_crypto_network ON public.user_crypto_addresses(network);
CREATE INDEX IF NOT EXISTS idx_user_crypto_active ON public.user_crypto_addresses(is_active);

-- =============================================================================
-- 6. PARTNER EXCHANGERS — পার্টনার এক্সচেঞ্জার ডিরেক্টরি
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.partner_exchangers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    telegram TEXT,
    whatsapp TEXT,
    facebook_page TEXT,
    phone TEXT,
    website TEXT,
    location TEXT,
    commission_rate NUMERIC DEFAULT 0.01 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    trust_score NUMERIC DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','suspended','banned')),
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    total_volume_usdt NUMERIC DEFAULT 0 CHECK (total_volume_usdt >= 0),
    total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
    positive_reviews INTEGER DEFAULT 0 CHECK (positive_reviews >= 0),
    negative_reviews INTEGER DEFAULT 0 CHECK (negative_reviews >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.partner_exchangers IS 'পার্টনার এক্সচেঞ্জার তালিকা — যাচাইকৃত লোকাল এক্সচেঞ্জার';
COMMENT ON COLUMN public.partner_exchangers.status IS 'pending=অপেক্ষারী, verified=যাচাইকৃত, suspended=স্থগিত, banned=নিষিদ্ধ';

CREATE INDEX IF NOT EXISTS idx_partners_status ON public.partner_exchangers(status);
CREATE INDEX IF NOT EXISTS idx_partners_trust ON public.partner_exchangers(trust_score DESC);

-- =============================================================================
-- 7. PLATFORM CRYPTO WALLETS — প্ল্যাটফর্মের ক্রিপ্টো ওয়ালেট
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.platform_crypto_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network TEXT NOT NULL CHECK (network IN ('bep20','trc20','ton','erc20')),
    address TEXT NOT NULL,
    memo_pattern TEXT,
    is_active BOOLEAN DEFAULT true,
    total_received_usdt NUMERIC DEFAULT 0 CHECK (total_received_usdt >= 0),
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(network, address)
);

COMMENT ON TABLE public.platform_crypto_wallets IS 'প্ল্যাটফর্মের মুখ্য ক্রিপ্টো রিসিভ এড্ড্রেস সমূহ';
COMMENT ON COLUMN public.platform_crypto_wallets.memo_pattern IS 'সমার্ট মেমো প্যাটার্ন, যামন: USER_{user_id}';

CREATE INDEX IF NOT EXISTS idx_platform_crypto_network ON public.platform_crypto_wallets(network);
CREATE INDEX IF NOT EXISTS idx_platform_crypto_active ON public.platform_crypto_wallets(is_active);

-- =============================================================================
-- 8. P2P OFFERS — পিয়ার-টু-পিয়ার বিক্রি ওফার
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.p2p_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    offer_type TEXT NOT NULL CHECK (offer_type IN ('sell_usdt','buy_usdt')),
    network TEXT CHECK (network IN ('bep20','trc20','ton','erc20')),
    usdt_amount NUMERIC NOT NULL CHECK (usdt_amount > 0),
    price_per_usdt_bdt NUMERIC NOT NULL CHECK (price_per_usdt_bdt > 0),
    min_amount_usdt NUMERIC DEFAULT 5 CHECK (min_amount_usdt > 0),
    max_amount_usdt NUMERIC CHECK (max_amount_usdt > 0),
    payment_methods mfs_provider[] DEFAULT '{}',
    payment_window_minutes INTEGER DEFAULT 30,
    terms TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

COMMENT ON TABLE public.p2p_offers IS 'P2P মার্কেডপ্লেসের ওফার সমূহ';

CREATE INDEX IF NOT EXISTS idx_p2p_offers_seller ON public.p2p_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_p2p_offers_status ON public.p2p_offers(status);
CREATE INDEX IF NOT EXISTS idx_p2p_offers_type ON public.p2p_offers(offer_type);

-- =============================================================================
-- 9. P2P TRADES — পিয়ার-টু-পিয়ার লেনদেন ট্রেড
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.p2p_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.p2p_offers(id),
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    usdt_amount NUMERIC NOT NULL CHECK (usdt_amount > 0),
    price_per_usdt_bdt NUMERIC NOT NULL CHECK (price_per_usdt_bdt > 0),
    total_bdt NUMERIC NOT NULL CHECK (total_bdt > 0),
    escrow_locked_at TIMESTAMPTZ,
    escrow_released_at TIMESTAMPTZ,
    buyer_paid_at TIMESTAMPTZ,
    payment_method mfs_provider,
    buyer_txn_id TEXT,
    buyer_screenshot_url TEXT,
    status TEXT DEFAULT 'waiting_payment' 
        CHECK (status IN ('waiting_payment','buyer_paid','seller_confirmed','completed','disputed','cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.p2p_trades IS 'P2P লেনদেন ট্রেড রেকর্ড';

CREATE INDEX IF NOT EXISTS idx_p2p_trades_buyer ON public.p2p_trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_seller ON public.p2p_trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_status ON public.p2p_trades(status);
CREATE INDEX IF NOT EXISTS idx_p2p_trades_offer ON public.p2p_trades(offer_id);

-- =============================================================================
-- 10. P2P DISPUTES — পিয়ার-টু-পিয়ার বিবাদ সমাধান
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.p2p_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.p2p_trades(id),
    opened_by UUID NOT NULL,
    dispute_reason TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    resolution TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    refund_to TEXT CHECK (refund_to IN ('buyer','seller','split')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open','under_review','resolved','rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.p2p_disputes IS 'P2P বিবাদ রিকর্ড সমূহ';

CREATE INDEX IF NOT EXISTS idx_p2p_disputes_trade ON public.p2p_disputes(trade_id);
CREATE INDEX IF NOT EXISTS idx_p2p_disputes_status ON public.p2p_disputes(status);

-- =============================================================================
-- 11. RLS POLICIES — সিকিউরিটি নীতি
-- =============================================================================

-- payment_agents: admin দেখতে পারবে
ALTER TABLE public.payment_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access payment_agents" ON public.payment_agents
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- agent_mfs_numbers: admin দেখতে পারবে
ALTER TABLE public.agent_mfs_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access agent_mfs_numbers" ON public.agent_mfs_numbers
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- deposit_sessions: user নিজেশ সেশন দেখতে পারবে
ALTER TABLE public.deposit_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own deposit sessions" ON public.deposit_sessions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create deposit sessions" ON public.deposit_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own pending sessions" ON public.deposit_sessions
    FOR UPDATE USING (user_id = auth.uid() AND status IN ('waiting_payment','payment_sent'));
CREATE POLICY "Admin full access deposit_sessions" ON public.deposit_sessions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- voucher_codes: active কোড সবাই দেখতে পারে (redeem করার জন্য)
ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view active vouchers" ON public.voucher_codes
    FOR SELECT USING (status = 'active');
CREATE POLICY "Admin full access voucher_codes" ON public.voucher_codes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- user_crypto_addresses: user নিজেশ এড্ড্রেস দেখতে পারবে
ALTER TABLE public.user_crypto_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own crypto addresses" ON public.user_crypto_addresses
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own crypto addresses" ON public.user_crypto_addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin full access user_crypto_addresses" ON public.user_crypto_addresses
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- partner_exchangers: সবাই দেখতে পারবে (public directory)
ALTER TABLE public.partner_exchangers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view verified partners" ON public.partner_exchangers
    FOR SELECT USING (status = 'verified');
CREATE POLICY "Admin full access partner_exchangers" ON public.partner_exchangers
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- platform_crypto_wallets: admin দেখতে পারবে
ALTER TABLE public.platform_crypto_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access platform_crypto_wallets" ON public.platform_crypto_wallets
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- p2p_offers: সবাই দেখতে পারবে, সেলার শুধু নিজেশ হাতে পারবে
ALTER TABLE public.p2p_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active offers" ON public.p2p_offers
    FOR SELECT USING (status = 'active');
CREATE POLICY "Users manage own offers" ON public.p2p_offers
    FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "Admin full access p2p_offers" ON public.p2p_offers
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- p2p_trades: যুজার কেবল নিজেশ লেনদেন দেখতে পারবে
ALTER TABLE public.p2p_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own trades" ON public.p2p_trades
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Users update own trades" ON public.p2p_trades
    FOR UPDATE USING (buyer_id = auth.uid() OR seller_id = auth.uid());
CREATE POLICY "Admin full access p2p_trades" ON public.p2p_trades
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- p2p_disputes: যুজার কেবল নিজেশ বিবাদ দেখতে পারবে
ALTER TABLE public.p2p_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own disputes" ON public.p2p_disputes
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.p2p_trades t
        WHERE t.id = trade_id AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    ));
CREATE POLICY "Users open disputes" ON public.p2p_disputes
    FOR INSERT WITH CHECK (opened_by = auth.uid());
CREATE POLICY "Admin full access p2p_disputes" ON public.p2p_disputes
    FOR ALL USING (EXISTS (
        SELECT 1 FROM auth.users u JOIN public.user_profiles p ON u.id = p.id
        WHERE u.id = auth.uid() AND p.is_admin = true
    ));

-- =============================================================================
-- 12. DAILY RESET FUNCTION — প্রতি দিন লিমিট রিসেট ফাংশন
-- =============================================================================
CREATE OR REPLACE FUNCTION public.reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- এজেন্টদের দৈনিক লিমিট রিসেট
    UPDATE public.payment_agents
    SET today_processed_usdt = 0, active_sessions = 0, updated_at = NOW();

    -- এজেন্ট MFS নম্বরদের দৈনিক লিমিট রিসেট
    UPDATE public.agent_mfs_numbers
    SET today_received_bdt = 0, last_used_at = NULL;
END;
$$;

COMMENT ON FUNCTION public.reset_daily_limits() IS 'প্রতি দিন সকাল ০৫:০০ নির্ধারিত এজেন্ট লিমিট রিসেট করে করনিয় হবে';

-- =============================================================================
-- 13. TRUST SCORE UPDATE FUNCTION — ট্রাস্ট স্কোর অাপডেট ফাংশন
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_agent_trust_score(p_agent_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_missed INTEGER;
    v_avg_response NUMERIC;
    v_disputes INTEGER;
    v_total_processed NUMERIC;
    v_streak INTEGER;
    v_new_score NUMERIC;
BEGIN
    SELECT 
        COALESCE(missed_sessions, 0),
        COALESCE(avg_response_seconds, 0) / 60.0,
        COALESCE(dispute_losses, 0),
        COALESCE(total_processed_usdt, 0),
        COALESCE(streak_fast_confirmations, 0)
    INTO v_missed, v_avg_response, v_disputes, v_total_processed, v_streak
    FROM public.payment_agents WHERE id = p_agent_id;

    v_new_score := 100
        - (v_missed * 5)
        - (v_avg_response * 2)
        - (v_disputes * 10)
        + LEAST(v_total_processed / 1000, 20)
        + LEAST(v_streak * 2, 10);

    v_new_score := GREATEST(0, LEAST(100, v_new_score));

    UPDATE public.payment_agents
    SET trust_score = v_new_score, updated_at = NOW()
    WHERE id = p_agent_id;
END;
$$;

COMMENT ON FUNCTION public.update_agent_trust_score(UUID) IS 'এজেন্টের ট্রাস্ট স্কোর হিসাব অনুযায়ী: 100 - missed*5 - avg_response*2 - disputes*10 + volume/1000 + streak*2';

-- =============================================================================
-- 14. SESSION CODE GENERATOR FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_code := 'PLY-' || UPPER(SUBSTRING(MD5(random()::text), 1, 5));
        SELECT EXISTS(SELECT 1 FROM public.deposit_sessions WHERE session_code = v_code)
        INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_code;
END;
$$;

-- =============================================================================
-- 15. SEED DATA — সাম্পল প্ল্যাটফর্ম ক্রিপ্টো ওয়ালেট
-- =============================================================================
INSERT INTO public.platform_crypto_wallets (network, address, memo_pattern, instructions)
VALUES
('bep20', '0x0000000000000000000000000000000000000000', 'USER_{user_id}', 'BEP-20 (Binance Smart Chain) — সর্বনিম্ণ কম গ্যাস ফি ($0.05), ৣ সেকেন্ড কনফার্মেশন')
ON CONFLICT (network, address) DO NOTHING;

INSERT INTO public.platform_crypto_wallets (network, address, memo_pattern, instructions)
VALUES
('trc20', 'T000000000000000000000000000000000', 'USER_{user_id}', 'TRC-20 (Tron) — সবচেয় কম গ্যাস ফি ($0.01), ৣ সেকেন্ড কনফার্মেশন')
ON CONFLICT (network, address) DO NOTHING;

INSERT INTO public.platform_crypto_wallets (network, address, memo_pattern, instructions)
VALUES
('ton', 'EQD0000000000000000000000000000000000000000000', 'USER_{user_id}', 'TON (Telegram Open Network) — সবচেয় কম ফি ($0.005), ६ সেকেন্ড কনফার্মেশন')
ON CONFLICT (network, address) DO NOTHING;

INSERT INTO public.platform_crypto_wallets (network, address, memo_pattern, instructions)
VALUES
('erc20', '0x0000000000000000000000000000000000000000', 'USER_{user_id}', 'ERC-20 (Ethereum) — বিশি বেশি গ্যাস ফি ($2.50), ১২ সেকেন্ড কনফার্মেশন')
ON CONFLICT (network, address) DO NOTHING;

-- =============================================================================
-- সমাপ্তি: Phase 1 মাইগ্রেশন সম্পূর্ণ হয়েছে
-- =============================================================================
