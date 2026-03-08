-- ===================================
-- CHECK: What social features exist?
-- ===================================

SELECT '=== TABLES ===' as check_type;

SELECT 
    table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_comments') THEN 'EXISTS' ELSE 'MISSING' END as market_comments,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_votes') THEN 'EXISTS' ELSE 'MISSING' END as comment_votes,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_flags') THEN 'EXISTS' ELSE 'MISSING' END as comment_flags,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_attachments') THEN 'EXISTS' ELSE 'MISSING' END as comment_attachments,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_reputation') THEN 'EXISTS' ELSE 'MISSING' END as user_reputation,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expert_badges') THEN 'EXISTS' ELSE 'MISSING' END as expert_badges,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges') THEN 'EXISTS' ELSE 'MISSING' END as user_badges,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows') THEN 'EXISTS' ELSE 'MISSING' END as user_follows,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_follows') THEN 'EXISTS' ELSE 'MISSING' END as market_follows,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feed_preferences') THEN 'EXISTS' ELSE 'MISSING' END as feed_preferences,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_aggregations') THEN 'EXISTS' ELSE 'MISSING' END as activity_aggregations,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_moderation_queue') THEN 'EXISTS' ELSE 'MISSING' END as comment_moderation_queue,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_moderation_status') THEN 'EXISTS' ELSE 'MISSING' END as user_moderation_status
FROM information_schema.tables 
WHERE table_schema = 'public'
LIMIT 1;

SELECT '=== FUNCTIONS ===' as check_type;

SELECT 
    proname as function_name,
    proargtypes::text as args
FROM pg_proc 
WHERE proname IN (
    'get_market_comments_threaded',
    'calculate_comment_weighted_score',
    'update_comment_score',
    'update_accuracy_tier',
    'check_comment_moderation',
    'aggregate_user_activities'
)
AND pronamespace = 'public'::regnamespace;

SELECT '=== TYPES ===' as check_type;

SELECT typname as type_name 
FROM pg_type 
WHERE typname IN (
    'sentiment_type',
    'vote_type',
    'flag_reason',
    'moderation_status',
    'badge_category',
    'badge_rarity',
    'accuracy_tier'
)
AND typtype = 'e';
