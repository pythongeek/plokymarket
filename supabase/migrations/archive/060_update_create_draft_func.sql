-- Update create_market_draft function to accept event_id
-- Drop old 3-param version to avoid ambiguity
DROP FUNCTION IF EXISTS create_market_draft(UUID, VARCHAR, VARCHAR);

CREATE OR REPLACE FUNCTION create_market_draft(
    p_creator_id UUID,
    p_market_type VARCHAR(50),
    p_template_id VARCHAR(100) DEFAULT NULL,
    p_event_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_draft_id UUID;
    v_event_category VARCHAR(100);
BEGIN
    -- If event_id is provided, fetch category from event to pre-fill
    IF p_event_id IS NOT NULL THEN
        SELECT category INTO v_event_category FROM events WHERE id = p_event_id;
    END IF;

    INSERT INTO market_creation_drafts (
        creator_id,
        market_type,
        template_id,
        event_id,
        category, -- Pre-fill category if available from event
        current_stage,
        stages_completed
    ) VALUES (
        p_creator_id,
        p_market_type,
        p_template_id,
        p_event_id,
        v_event_category,
        'template_selection',
        '[]'::jsonb
    )
    RETURNING id INTO v_draft_id;
    
    RETURN v_draft_id;
END;
$$ LANGUAGE plpgsql;
