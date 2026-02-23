-- Concurrency Control: Essential for optimistic locking in high-frequency trading
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
