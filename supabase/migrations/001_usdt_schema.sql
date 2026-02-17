-- USDT Management System Database Schema
-- Migration: 001_usdt_schema.sql
-- Creates tables for virtual USDT management with MFS integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for transaction and status management
CREATE TYPE transaction_type AS ENUM (
  'deposit', 'withdrawal', 'bonus', 'exchange', 'refund', 'fee', 'commission'
);

CREATE TYPE transaction_status AS ENUM (
  'pending', 'completed', 'failed', 'reversed'
);

CREATE TYPE mfs_provider AS ENUM (
  'bkash', 'nagad', 'rocket', 'upay'
);

CREATE TYPE deposit_status AS ENUM (
  'pending', 'under_review', 'verified', 'rejected', 'auto_approved', 'completed'
);

CREATE TYPE withdrawal_status AS ENUM (
  'pending', 'processing', 'completed', 'rejected', 'cancelled'
);

-- Enhanced profiles table for USDT balance management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL 
    CHECK (balance >= 0),
  total_deposited DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  kyc_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_submitted_at TIMESTAMPTZ,
  daily_withdrawal_limit DECIMAL(12,2) DEFAULT 1000.00,
  last_withdrawal_date DATE,
  referral_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  status transaction_status DEFAULT 'completed' NOT NULL,
  reference_id UUID, -- Links to deposit_requests or withdrawal_requests
  metadata JSONB DEFAULT '{}', -- Flexible storage for additional data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
    
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Deposit requests table for MFS integration
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
  -- Financial data
  bdt_amount DECIMAL(12,2) NOT NULL CHECK (bdt_amount >= 50),
  usdt_amount DECIMAL(12,2) NOT NULL CHECK (usdt_amount > 0),
  exchange_rate DECIMAL(10,4) NOT NULL,
    
  -- MFS information
  mfs_provider mfs_provider NOT NULL,
  txn_id VARCHAR(100) NOT NULL,
  sender_number VARCHAR(20) NOT NULL,
  sender_name VARCHAR(100),
    
  -- State machine
  status deposit_status DEFAULT 'pending' NOT NULL,
    
  -- Admin verification
  admin_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
    
  -- Auto-verification (future)
  auto_verification_attempted BOOLEAN DEFAULT FALSE,
  auto_verification_result JSONB,
    
  -- Audit trail
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
  -- Unique constraints
  UNIQUE(txn_id, mfs_provider),
    
  -- State validation
  CONSTRAINT valid_verification CHECK (
    (status IN ('verified', 'rejected', 'completed') AND verified_by IS NOT NULL)
    OR (status IN ('pending', 'under_review', 'auto_approved') AND verified_by IS NULL)
  )
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
  -- Financial data
  usdt_amount DECIMAL(12,2) NOT NULL CHECK (usdt_amount > 0),
  bdt_amount DECIMAL(12,2) NOT NULL CHECK (bdt_amount > 0),
  exchange_rate DECIMAL(10,4) NOT NULL,
    
  -- Recipient information
  mfs_provider mfs_provider NOT NULL,
  recipient_number VARCHAR(20) NOT NULL,
  recipient_name VARCHAR(100),
    
  -- Status machine
  status withdrawal_status DEFAULT 'pending' NOT NULL,
    
  -- Balance hold (processing state)
  balance_hold_id UUID, -- Reference to separate holds table
    
  -- Admin processing
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  admin_notes TEXT,
  transfer_proof_url TEXT,
    
  -- User cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
    
  -- Audit trail
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exchange rates table for dynamic rate management
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bdt_to_usdt DECIMAL(10,4) NOT NULL,
  usdt_to_bdt DECIMAL(10,4) NOT NULL,
  effective_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Balance holds table for withdrawal processing
CREATE TABLE IF NOT EXISTS public.balance_holds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  reason VARCHAR(50) NOT NULL, -- 'withdrawal', 'pending_transaction', etc.
  reference_id UUID, -- Links to withdrawal_requests
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users(id),
  released_reason TEXT
);

-- Notifications table for system alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
  ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
  ON public.transactions(type, status);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
  ON public.transactions(reference_id) WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deposits_status_created 
  ON public.deposit_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_deposits_user 
  ON public.deposit_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_txn_provider 
  ON public.deposit_requests(txn_id, mfs_provider);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status_created 
  ON public.withdrawal_requests(status, created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user 
  ON public.withdrawal_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective 
  ON public.exchange_rates(effective_from, effective_until);

CREATE INDEX IF NOT EXISTS idx_balance_holds_user 
  ON public.balance_holds(user_id, created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_requests_updated_at
  BEFORE UPDATE ON public.deposit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default exchange rate (100 BDT = 1 USDT)
INSERT INTO public.exchange_rates (bdt_to_usdt, usdt_to_bdt) 
VALUES (100.0000, 0.0100)
ON CONFLICT DO NOTHING;