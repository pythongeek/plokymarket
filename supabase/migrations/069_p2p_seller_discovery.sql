-- Binance P2P Seller Cache Table
CREATE TABLE IF NOT EXISTS p2p_seller_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(10) CHECK (method IN ('bkash', 'nagad')),
  sellers_data JSONB NOT NULL, -- Array of seller objects
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  affiliate_link VARCHAR(255),
  active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE p2p_seller_cache ENABLE ROW LEVEL SECURITY;

-- Policies for p2p_seller_cache
DROP POLICY IF EXISTS "Allow public read" ON p2p_seller_cache;
CREATE POLICY "Allow public read" ON p2p_seller_cache FOR SELECT USING (true);

-- User Deposit Attempts (for affiliate tracking)
CREATE TABLE IF NOT EXISTS deposit_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  method VARCHAR(10),
  selected_seller_id VARCHAR(100), -- Binance's seller UID
  affiliate_used BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'initiated',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deposit_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for deposit_attempts
DROP POLICY IF EXISTS "Users can view their own attempts" ON deposit_attempts;
CREATE POLICY "Users can view their own attempts" ON deposit_attempts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attempts" ON deposit_attempts;
CREATE POLICY "Users can insert their own attempts" ON deposit_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to refresh schema cache (if needed)
NOTIFY pgrst, 'reload schema';
