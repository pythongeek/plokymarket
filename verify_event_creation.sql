-- ============================================================
-- VERIFICATION SQL - Run after testing event creation
-- ============================================================

-- Verify event was created with title and question:
SELECT 
  id, 
  title, 
  question, 
  status, 
  slug,
  created_at,
  created_by
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify linked market exists:
SELECT 
  m.id as market_id, 
  m.event_id, 
  m.status as market_status, 
  e.title as event_title,
  e.question as event_question,
  m.created_at
FROM markets m
JOIN events e ON e.id = m.event_id
ORDER BY m.created_at DESC
LIMIT 5;

-- Check for events with NULL title (should return 0 rows):
SELECT COUNT(*) as null_title_events
FROM events 
WHERE title IS NULL;

-- Check for orphaned events (events without markets):
SELECT 
  e.id,
  e.title,
  e.created_at
FROM events e
LEFT JOIN markets m ON m.event_id = e.id
WHERE m.id IS NULL
ORDER BY e.created_at DESC
LIMIT 10;

-- Summary counts:
SELECT 
  (SELECT COUNT(*) FROM events) as total_events,
  (SELECT COUNT(*) FROM markets) as total_markets,
  (SELECT COUNT(*) FROM events WHERE status = 'active') as active_events,
  (SELECT COUNT(*) FROM markets WHERE status = 'active') as active_markets;
