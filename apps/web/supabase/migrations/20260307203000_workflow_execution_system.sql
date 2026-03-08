-- Workflow Execution System
-- Required for daily-report and other cron workflows

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_workflow_execution(TEXT, JSONB, INTEGER);
DROP FUNCTION IF EXISTS update_workflow_status(UUID, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS log_workflow_step(UUID, TEXT, TEXT, JSONB, TEXT);

-- Create workflow_executions table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    max_retries INTEGER DEFAULT 3,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'workflow_type') THEN
        ALTER TABLE workflow_executions ADD COLUMN workflow_type TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'payload') THEN
        ALTER TABLE workflow_executions ADD COLUMN payload JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'status') THEN
        ALTER TABLE workflow_executions ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'max_retries') THEN
        ALTER TABLE workflow_executions ADD COLUMN max_retries INTEGER DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'retry_count') THEN
        ALTER TABLE workflow_executions ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'error_message') THEN
        ALTER TABLE workflow_executions ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Create workflow_steps table for detailed logging
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    step_status TEXT NOT NULL,
    step_data JSONB DEFAULT '{}',
    error_details TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_type ON workflow_executions(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_execution ON workflow_steps(execution_id);

-- Create admin_roles view (using user_profiles)
-- This is a view since admin info is stored in user_profiles
CREATE OR REPLACE VIEW admin_roles AS 
SELECT 
    up.id as user_id,
    up.is_admin,
    up.is_super_admin,
    up.full_name,
    up.email
FROM user_profiles up
WHERE up.is_admin = true OR up.is_super_admin = true;

-- Function to create workflow execution
CREATE FUNCTION create_workflow_execution(
    p_workflow_type TEXT,
    p_payload JSONB DEFAULT '{}',
    p_max_retries INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_execution_id UUID;
BEGIN
    INSERT INTO workflow_executions (
        workflow_type,
        payload,
        max_retries,
        status,
        started_at
    ) VALUES (
        p_workflow_type,
        p_payload,
        p_max_retries,
        'running',
        NOW()
    ) RETURNING id INTO v_execution_id;

    RETURN v_execution_id;
END;
$$;

-- Function to update workflow status
CREATE FUNCTION update_workflow_status(
    p_execution_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_increment_retry BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_retry_count INTEGER;
    v_max_retries INTEGER;
BEGIN
    -- Get current values
    SELECT retry_count, max_retries 
    INTO v_current_retry_count, v_max_retries
    FROM workflow_executions 
    WHERE id = p_execution_id;

    -- Update status
    UPDATE workflow_executions
    SET 
        status = p_status,
        error_message = p_error_message,
        retry_count = CASE 
            WHEN p_increment_retry THEN retry_count + 1 
            ELSE retry_count 
        END,
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed') THEN NOW() 
            ELSE NULL 
        END,
        updated_at = NOW()
    WHERE id = p_execution_id;

    RETURN TRUE;
END;
$$;

-- Function to log workflow step
CREATE FUNCTION log_workflow_step(
    p_execution_id UUID,
    p_step_name TEXT,
    p_step_status TEXT,
    p_step_data JSONB DEFAULT '{}',
    p_error_details TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_step_id UUID;
    v_existing_step_id UUID;
BEGIN
    -- Check if step already exists
    SELECT id INTO v_existing_step_id
    FROM workflow_steps
    WHERE execution_id = p_execution_id AND step_name = p_step_name
    ORDER BY started_at DESC
    LIMIT 1;

    IF v_existing_step_id IS NOT NULL THEN
        -- Update existing step
        UPDATE workflow_steps
        SET 
            step_status = p_step_status,
            step_data = p_step_data,
            error_details = p_error_details,
            completed_at = CASE 
                WHEN p_step_status IN ('completed', 'failed') THEN NOW() 
                ELSE NULL 
            END
        WHERE id = v_existing_step_id
        RETURNING id INTO v_step_id;
    ELSE
        -- Insert new step
        INSERT INTO workflow_steps (
            execution_id,
            step_name,
            step_status,
            step_data,
            error_details
        ) VALUES (
            p_execution_id,
            p_step_name,
            p_step_status,
            p_step_data,
            p_error_details
        ) RETURNING id INTO v_step_id;
    END IF;

    RETURN v_step_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_workflow_execution TO service_role;
GRANT EXECUTE ON FUNCTION update_workflow_status TO service_role;
GRANT EXECUTE ON FUNCTION log_workflow_step TO service_role;
GRANT ALL ON workflow_executions TO service_role;
GRANT ALL ON workflow_steps TO service_role;
