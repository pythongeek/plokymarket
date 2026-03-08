-- AI Topics System Database Schema
-- Required for daily-ai-topics workflow

-- Create ai_daily_topics table
CREATE TABLE IF NOT EXISTS ai_daily_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggested_title TEXT NOT NULL,
    suggested_question TEXT NOT NULL,
    suggested_description TEXT,
    suggested_category TEXT,
    ai_reasoning TEXT,
    ai_confidence NUMERIC(3,2) DEFAULT 0.5,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, used
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    event_id UUID REFERENCES events(id), -- if converted to event
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for ai_daily_topics
CREATE INDEX IF NOT EXISTS idx_ai_daily_topics_status ON ai_daily_topics(status);
CREATE INDEX IF NOT EXISTS idx_ai_daily_topics_generated ON ai_daily_topics(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_daily_topics_category ON ai_daily_topics(suggested_category);

-- Grant permissions
GRANT ALL ON ai_daily_topics TO service_role;
