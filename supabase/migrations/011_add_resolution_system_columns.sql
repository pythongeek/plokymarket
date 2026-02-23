-- Migration to ensure resolution_systems has the required columns

DO $$
BEGIN
    -- Check and add 'method' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resolution_systems' AND column_name = 'method') THEN
        ALTER TABLE public.resolution_systems ADD COLUMN method VARCHAR(50) DEFAULT 'manual_admin';
    END IF;

    -- Check and add 'ai_keywords' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resolution_systems' AND column_name = 'ai_keywords') THEN
        ALTER TABLE public.resolution_systems ADD COLUMN ai_keywords TEXT[] DEFAULT '{}';
    END IF;

    -- Check and add 'confidence_threshold' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'resolution_systems' AND column_name = 'confidence_threshold') THEN
        ALTER TABLE public.resolution_systems ADD COLUMN confidence_threshold INTEGER DEFAULT 85 CHECK (confidence_threshold BETWEEN 70 AND 99);
    END IF;
END $$;
