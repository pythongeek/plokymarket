-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin settings policy: Admin can do everything, users can read
CREATE POLICY "Admins can update settings" ON admin_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));

CREATE POLICY "Users can read settings" ON admin_settings
  FOR SELECT TO authenticated
  USING (true);

-- Insert default config if not exists
INSERT INTO admin_settings (key, value) 
VALUES (
  'deposit_modes',
  '{
    "binance_p2p_scrape": true,
    "manual_agent_processing": true,
    "show_rate_comparison": true,
    "agent_processing_time_minutes": 10
  }'
)
ON CONFLICT (key) DO NOTHING;

-- Agent Wallet Numbers (bKash/Nagad)
CREATE TABLE IF NOT EXISTS agent_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(10) CHECK (method IN ('bkash', 'nagad')),
  wallet_type VARCHAR(20) CHECK (wallet_type IN ('send_money', 'cashout', 'payment')),
  phone_number VARCHAR(15) NOT NULL,
  account_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  daily_limit_bdt DECIMAL(12,2) DEFAULT 100000,
  used_today_bdt DECIMAL(12,2) DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;

-- Agent wallets policy: Admin can manage, users can read active ones
CREATE POLICY "Admins can manage agent wallets" ON agent_wallets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));

CREATE POLICY "Users can read active agent wallets" ON agent_wallets
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Manual Deposit Requests
CREATE TABLE IF NOT EXISTS manual_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  method VARCHAR(10),
  amount_bdt DECIMAL(10,2),
  agent_wallet_id UUID REFERENCES agent_wallets(id),
  user_phone_number VARCHAR(15),
  transaction_id VARCHAR(100) UNIQUE,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, rejected
  usdt_sent_to_user DECIMAL(18,6),
  usdt_rate_used DECIMAL(18,6),
  agent_notes TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expiry_warning_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE manual_deposits ENABLE ROW LEVEL SECURITY;

-- Manual deposits policy: Admin can manage all, users can see/create their own
CREATE POLICY "Admins can manage manual deposits" ON manual_deposits
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)));

CREATE POLICY "Users can view own manual deposits" ON manual_deposits
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create manual deposits" ON manual_deposits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create Storage Bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-screenshots', 'deposit-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for deposit-screenshots
CREATE POLICY "Anyone can view screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'deposit-screenshots');

CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deposit-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add updated_at triggers
SELECT extensions.grant_pg_net_access(); -- For future n8n integration if needed
