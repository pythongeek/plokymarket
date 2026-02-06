-- Wallets table for advanced deposit management
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usdt_address TEXT UNIQUE,
  usdc_address TEXT UNIQUE,
  qr_code_url TEXT,
  network_type VARCHAR(10) DEFAULT 'TRC20',
  address_type VARCHAR(20) DEFAULT 'DYNAMIC',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast verification lookups
CREATE INDEX idx_wallets_usdt_address ON wallets(usdt_address);
CREATE INDEX idx_wallets_usdc_address ON wallets(usdc_address);

-- RLS Policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
ON wallets FOR SELECT
USING (auth.uid() = user_id);

-- Enable real-time for wallet updates (e.g. for dynamic address appearance)
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
