-- Migration 105: Social Engagement and Resolvers Registry
-- Implements comments system with threading/rate-limiting and centralized resolvers

-- ============================================
-- 1. Comments Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 10 AND 2000),
  parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_comments_event_created ON public.comments(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Public: Read only non-deleted comments
DROP POLICY IF EXISTS "comments_public_read" ON public.comments;
CREATE POLICY "comments_public_read"
  ON public.comments FOR SELECT
  USING (NOT is_deleted);

-- Authenticated: Insert comments
DROP POLICY IF EXISTS "comments_user_insert" ON public.comments;
CREATE POLICY "comments_user_insert"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated: Update own comments (5 minute window)
DROP POLICY IF EXISTS "comments_user_update" ON public.comments;
CREATE POLICY "comments_user_update"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated: Delete own comments (Soft delete)
DROP POLICY IF EXISTS "comments_user_delete" ON public.comments;
CREATE POLICY "comments_user_delete"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 2. Triggers for Constraints
-- ============================================

-- 5-minute Edit Window Trigger
CREATE OR REPLACE FUNCTION public.check_comment_edit_window()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.created_at < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Edit window (5 minutes) has expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_edit_window ON public.comments;
CREATE TRIGGER trg_comments_edit_window
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION public.check_comment_edit_window();

-- Rate Limiting: 1 comment per minute per user per event
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.comments
    WHERE user_id = NEW.user_id
    AND event_id = NEW.event_id
    AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: 1 comment per minute per market';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_rate_limit ON public.comments;
CREATE TRIGGER trg_comments_rate_limit
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_comment_rate_limit();

-- ============================================
-- 3. Resolvers Registry
-- ============================================

CREATE TABLE IF NOT EXISTS public.resolvers (
  address TEXT PRIMARY KEY CHECK (address ~ '^0x[a-fA-F0-9]{40}$'),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('UMA', 'Chainlink', 'Custom', 'Multisig', 'AI_ORACLE', 'MANUAL_ADMIN')),
  description TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  success_count INTEGER DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resolvers_active ON public.resolvers(is_active, type);

-- Enable RLS
ALTER TABLE public.resolvers ENABLE ROW LEVEL SECURITY;

-- Public: Read active resolvers
DROP POLICY IF EXISTS "resolvers_public_read" ON public.resolvers;
CREATE POLICY "resolvers_public_read"
  ON public.resolvers FOR SELECT
  USING (is_active = TRUE);

-- Admin: Manage all resolvers
DROP POLICY IF EXISTS "resolvers_admin_all" ON public.resolvers;
CREATE POLICY "resolvers_admin_all"
  ON public.resolvers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- 4. Seed Data
-- ============================================

INSERT INTO public.resolvers (address, name, type, description, is_active, success_count)
VALUES 
  ('0x0000000000000000000000000000000000000001', 'Plokymarket AI Oracle', 'AI_ORACLE', 'Automated resolution via Gemini Vision & News Analysis', TRUE, 125),
  ('0x0000000000000000000000000000000000000002', 'Admin Manual Review', 'MANUAL_ADMIN', 'Manual verification by platform administrators', TRUE, 450),
  ('0x04bd811440cc0777e48600cd9563f6a2542a123a', 'UMA Optimistic Oracle', 'UMA', 'Decentralized optimistic oracle for arbitrary data', TRUE, 890),
  ('0xc19856cc447a835a96d132649a21236542a123b0', 'Chainlink Crypto Feed', 'Chainlink', 'Decentralized price and outcome feeds', TRUE, 2200)
ON CONFLICT (address) DO NOTHING;

-- Update existing market_comments to comments if needed (Optional, user asked for new table)
-- We keep market_comments for now but UI will use comments.

COMMENT ON TABLE public.comments IS 'User comments for events/markets with threading and rate limiting';
COMMENT ON TABLE public.resolvers IS 'Centralized registry of authorized resolution authorities';
