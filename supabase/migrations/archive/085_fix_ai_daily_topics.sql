-- ===============================================
-- FIX: Add missing columns to ai_daily_topics
-- ===============================================

-- Add category column if missing
ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'General';

-- Add other potentially missing columns
ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS title VARCHAR(500) NOT NULL DEFAULT 'Untitled Topic';

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS trading_end_date DATE;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS source_keywords TEXT[];

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3, 2) DEFAULT 0.5;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS ai_model_version VARCHAR(50);

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS generated_prompt TEXT;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES public.markets(id);

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop default constraints after columns exist
ALTER TABLE public.ai_daily_topics 
ALTER COLUMN category DROP DEFAULT;

ALTER TABLE public.ai_daily_topics 
ALTER COLUMN title DROP DEFAULT;

-- Add status check constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'ai_daily_topics' 
    AND constraint_name = 'ai_daily_topics_status_check'
  ) THEN
    ALTER TABLE public.ai_daily_topics 
    ADD CONSTRAINT ai_daily_topics_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Recreate indexes
DROP INDEX IF EXISTS idx_daily_topics_status;
DROP INDEX IF EXISTS idx_daily_topics_category;
DROP INDEX IF EXISTS idx_daily_topics_created;
DROP INDEX IF EXISTS idx_daily_topics_generated;

CREATE INDEX idx_daily_topics_status ON public.ai_daily_topics(status);
CREATE INDEX idx_daily_topics_category ON public.ai_daily_topics(category);
CREATE INDEX idx_daily_topics_created ON public.ai_daily_topics(created_at);
CREATE INDEX idx_daily_topics_generated ON public.ai_daily_topics(generated_at);

-- Ensure RLS is enabled
ALTER TABLE public.ai_daily_topics ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "daily_topics_public_select" ON public.ai_daily_topics;
DROP POLICY IF EXISTS "daily_topics_admin_all" ON public.ai_daily_topics;

CREATE POLICY "daily_topics_public_select"
  ON public.ai_daily_topics FOR SELECT
  TO public
  USING (status = 'approved');

CREATE POLICY "daily_topics_admin_all"
  ON public.ai_daily_topics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ===============================================
-- END OF FIX
-- ===============================================
