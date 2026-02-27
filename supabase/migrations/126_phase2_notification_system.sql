-- ============================================================
-- Migration 126: Real-time Notification System (Phase 2)
-- User retention through timely alerts
-- ============================================================
-- System Logic:
-- - Threshold-based Alerting: Only notify on significant trades (>100 BDT)
-- - Relational Mapping: Notifications linked to market_id and trade_id
-- - Push Ready: Sync with Supabase Realtime for frontend NotificationBell
-- ============================================================

-- Notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'market_resolved', 'trade_filled', 'price_alert',
    'market_closing_soon', 'follower_trade', 'ai_suggestion',
    'position_profit', 'position_loss', 'system', 'order_filled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Notifications Table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  title_bn TEXT,                          -- Bengali title
  body TEXT,
  body_bn TEXT,                           -- Bengali body
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  metadata JSONB,                         -- Flexible data storage
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fix for existing tables missing 'read' column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'market_id') THEN
    ALTER TABLE notifications ADD COLUMN market_id UUID REFERENCES markets(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'trade_id') THEN
    ALTER TABLE notifications ADD COLUMN trade_id UUID REFERENCES trades(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, created_at DESC) 
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_market 
  ON notifications(market_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(user_id, type, created_at DESC);

-- RLS: Users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "notifications_own_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "notifications_own_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Trigger: Notify market followers on large trades
-- Threshold: Only notify for trades > 100 BDT
-- ============================================================
CREATE OR REPLACE FUNCTION notify_market_followers_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  follower RECORD;
  trade_value DECIMAL;
  market_name TEXT;
  market_name_bn TEXT;
BEGIN
  -- Calculate trade value
  trade_value := NEW.price * NEW.quantity;

  -- Only notify for significant trades (value > 100 BDT)
  IF trade_value < 100 THEN 
    RETURN NEW; 
  END IF;
  
  -- Get market name
  SELECT name, name_bn INTO market_name, market_name_bn
  FROM markets WHERE id = NEW.market_id;

  -- Notify followers who opted in
  FOR follower IN
    SELECT mf.user_id
    FROM market_followers mf
    WHERE mf.market_id = NEW.market_id
      AND mf.notify_on_trade = true
      AND mf.user_id != NEW.maker_id
      AND mf.user_id != NEW.taker_id
  LOOP
    BEGIN
      INSERT INTO notifications (
        user_id, type, title, title_bn, body, body_bn, 
        market_id, trade_id, action_url
      ) VALUES (
        follower.user_id,
        'follower_trade',
        'বড় ট্রেড হয়েছে',
        'বড় ট্রেড হয়েছে',
        '৳' || ROUND(trade_value, 2)::TEXT || ' এর ট্রেড হয়েছে আপনার ফলো করা মার্কেটে',
        '৳' || ROUND(trade_value, 2)::TEXT || ' এর ট্রেড হয়েছে আপনার ফলো করা মার্কেটে',
        NEW.market_id,
        NEW.id,
        '/markets/' || NEW.market_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the trade
      RAISE WARNING 'Failed to create notification: %', SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_followers ON trades;
CREATE TRIGGER trg_notify_followers
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION notify_market_followers_on_trade();

-- ============================================================
-- Trigger: Notify user when market resolves
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_market_resolve()
RETURNS TRIGGER AS $$
DECLARE
  resolution_text TEXT;
  resolution_text_bn TEXT;
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    -- Build resolution text
    resolution_text := COALESCE(NEW.resolution_outcome, 'নির্ধারিত');
    resolution_text_bn := CASE 
      WHEN NEW.resolution_outcome = 'YES' THEN 'হ্যাঁ'
      WHEN NEW.resolution_outcome = 'NO' THEN 'না'
      ELSE COALESCE(NEW.resolution_outcome, 'নির্ধারিত')
    END;
    
    -- Notify users with positions
    INSERT INTO notifications (
      user_id, type, title, title_bn, body, body_bn, 
      market_id, action_url
    )
    SELECT DISTINCT
      p.user_id,
      'market_resolved',
      'মার্কেট সমাধান হয়েছে',
      'মার্কেট সমাধান হয়েছে',
      NEW.name || ' — ফলাফল: ' || resolution_text,
      COALESCE(NEW.name_bn, NEW.name) || ' — ফলাফল: ' || resolution_text_bn,
      NEW.id,
      '/markets/' || NEW.id
    FROM positions p
    WHERE p.market_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_resolve ON markets;
CREATE TRIGGER trg_notify_resolve
  AFTER UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION notify_on_market_resolve();

-- ============================================================
-- Function: Mark notifications as read
-- ============================================================
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    -- Mark all as read
    UPDATE notifications 
    SET read = true, read_at = now()
    WHERE user_id = auth.uid() AND read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = true, read_at = now()
    WHERE user_id = auth.uid() 
    AND id = ANY(p_notification_ids)
    AND read = false;
  END IF;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'marked_read', v_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Get unread notification count
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS JSONB AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN jsonb_build_object(
    'unread_count', v_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Create price alert notification
-- ============================================================
CREATE OR REPLACE FUNCTION create_price_alert_notification(
  p_user_id UUID,
  p_market_id UUID,
  p_price_change_percent DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  market_name TEXT;
  market_name_bn TEXT;
BEGIN
  -- Get market name
  SELECT name, name_bn INTO market_name, market_name_bn
  FROM markets WHERE id = p_market_id;
  
  INSERT INTO notifications (
    user_id, type, title, title_bn, body, body_bn,
    market_id, action_url, metadata
  ) VALUES (
    p_user_id,
    'price_alert',
    'দাম পরিবর্তন সতর্কতা',
    'দাম পরিবর্তন সতর্কতা',
    market_name || ' এর দাম ' || ROUND(p_price_change_percent, 2) || '% পরিবর্তিত হয়েছে',
    COALESCE(market_name_bn, market_name) || ' এর দাম ' || ROUND(p_price_change_percent, 2) || '% পরিবর্তিত হয়েছে',
    p_market_id,
    '/markets/' || p_market_id,
    jsonb_build_object('price_change_percent', p_price_change_percent)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Cleanup old notifications (run periodically)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications(
  p_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - (p_days || ' days')::INTERVAL
  AND read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_count', v_deleted,
    'older_than_days', p_days,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'User notification system with Supabase Realtime support';
COMMENT ON COLUMN notifications.metadata IS 'Flexible JSON storage for notification-specific data';
