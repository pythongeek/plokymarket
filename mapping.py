
import os

local_files = [
    '001_usdt_schema.sql', '002_usdt_functions.sql', '003_oracle_system.sql', '004_leaderboard_system.sql',
    '005_activity_feed.sql', '006_comments_system.sql', '007_clob_system.sql', '008_clob_functions.sql',
    '009_clob_mev.sql', '010_wallet_system.sql', '011_platform_features.sql', '012_wallet_management.sql',
    '014_unified_wallet_schema.sql', '015_adaptive_tick_config.sql', '016_market_phases.sql',
    '017_atomic_order_commitment.sql', '018_sample_bangladesh_data.sql', '019_advanced_cancellation_system.sql',
    '020_partial_fill_management.sql', '021_advanced_matching_engine.sql', '022_trade_ledger_immutability.sql',
    '023_regulatory_reporting_scalability.sql', '024_advanced_ai_oracle.sql', '024_payout_multioutcome.sql',
    '025_bangladesh_ai_oracle.sql', '026_verification_tracking.sql', '027_advanced_verification.sql',
    '028_dispute_settlement.sql', '029_create_verification_workflows.sql', '029_leaderboard_mock_data.sql',
    '029_leaderboard_mock_data_fixed.sql', '030_add_admin_profile.sql', '030_leaderboard_mock_data_safe.sql',
    '031_fix_user_profiles_rls.sql', '031_leaderboard_mock_data_working.sql', '032_leaderboard_mock_data_final.sql',
    '033_leaderboard_mock_data_bulletproof.sql', '034_leaderboard_data_workaround.sql', '035_leaderboard_data_robust.sql',
    '036_diagnose_and_fix.sql', '037_use_existing_users.sql', '038_diagnostic_only.sql',
    '039_workaround_no_user_insert.sql', '040_social_features.sql', '041_fix_depth_level.sql',
    '042_social_features_fixed.sql', '043_fix_missing_columns.sql', '044_drop_and_recreate_function.sql',
    '045_check_social_status.sql', '046_add_remaining_social.sql', '047_user_follows_and_feed_enhancement.sql',
    '048_maker_rebates_system.sql', '048_maker_rebates_system_fixed.sql', '049_notification_system.sql',
    '050_market_creation_workflow.sql', '051_user_management.sql', '052_fix_missing_tables_and_syntax.sql',
    '053_fix_notification_tables_order.sql', '054_fix_json_syntax.sql', '055_comprehensive_fix.sql',
    '056_admin_security_setup.sql', '057_market_verification_config.sql', '058_analytics_schema.sql',
    '059_events_system.sql', '060_update_create_draft_func.sql', '061_settle_market_function.sql',
    '062_deploy_event_link.sql', '063_kyc_system.sql', '064_kyc_storage.sql', '065_fix_admin_auth.sql',
    '066_fix_kyc_tables.sql', '067_fix_kyc_profiles_rls.sql', '068_fix_kyc_schema_columns.sql',
    '069_p2p_seller_discovery.sql', '070_manual_deposit_system.sql', '071_user_security_updates.sql',
    '072_risk_management_and_kyc.sql', '073_governance_and_compliance.sql', '074_gamification_loyalty.sql',
    '075_kyc_documents.sql', '076_withdrawal_rpc.sql', '077_kyc_review.sql', '078_payment_transactions.sql',
    '079_update_withdrawal_logic.sql', '080_fix_markets_rls.sql', '081_ai_event_creation_schema.sql',
    '084_ai_daily_topics.sql', '085_fix_ai_daily_topics.sql', '086_ai_topic_config.sql',
    '087_settle_market_v2.sql', '088_expert_panel_system.sql', '091_admin_activity_logs.sql',
    '092_ai_daily_topics_system.sql', '093_manual_event_system.sql', '094_fix_events_system_bugs.sql',
    '094_reimplemented_events_markets.sql', '095_workflow_tracking.sql', '096_exchange_rate_live.sql',
    '097_withdrawal_2fa.sql', '097_workflow_consolidation.sql', '100_fix_event_schema_and_rls.sql',
    '101_spec_alignment_patch.sql', '102_market_admin_fields.sql', '103_mfs_deposit_support.sql',
    '104_market_spec_compliance.sql', '106_event_validation_and_realtime.sql', '115_emergency_pause_system.sql',
    '117_market_metrics.sql', '118_clob_industry_standard.sql', '119_events_realtime_rls.sql',
    '119_secure_atomic_wallet_updates.sql', '120_performance_indexes.sql', '121_system_hardening_indexes.sql',
    '121_system_hardening_wallets.sql', '122_wallet_optimistic_locking.sql', '123_create_event_with_markets_rpc.sql',
    '123_phase2_multi_outcome_markets.sql', '123_withdrawal_api_support.sql', '124_phase2_social_layer.sql',
    '125_fix_event_creation_and_markets_fetch.sql', '125_phase2_price_history_analytics.sql',
    '126_phase2_notification_system.sql', '127_phase2_batch_orders.sql', '128_fix_user_profiles_rls_recursion.sql',
    '129_allow_custom_categories.sql', '130_fix_markets_events_fk.sql', '133_fix_jsonb_to_text_array.sql',
    '134_ai_configurations.sql', '134_debug_event_creation.sql', '135_fix_events_markets_relationship.sql',
    '136_fix_events_columns_and_fk.sql', '137_fix_slug_and_required_columns.sql', '138_fix_events_constraints.sql',
    '142a_normalize_events_title.sql', '142b_upstash_workflow_infrastructure.sql',
    '142c_workflow_monitoring_views.sql', '20260301192113_011_integrity_fix.sql',
    '20260301192500_012_integrity_rls.sql', 'combined_089_090.sql'
]

vercel_list = [
    '142c_workflow_monitoring_views', '142b_upstash_workflow_infrastructure', '142a_normalize_events_title',
    '20260301192500_012_integrity_rls', '20260301192113_011_integrity_fix', '137_fix_slug_and_required_columns',
    '135_fix_events_markets_relationship', '136_fix_events_columns_and_fk', '134_debug_event_creation',
    '133_fix_jsonb_to_text_array', 'create_event_complete_function', '130_fix_markets_events_fk',
    '129_allow_custom_categories', '128_fix_user_profiles_rls_recursion', '127_phase2_batch_orders',
    '126_phase2_notification_system', '125_phase2_price_history_analytics', '124_phase2_social_layer',
    '123_phase2_multi_outcome_markets', 'Create Event with Markets Function', '123_withdrawal_api_support',
    '122_wallet_optimistic_locking', '121_system_hardening_wallets', '121_system_hardening_indexes',
    '120_performance_indexes', '119_secure_atomic_wallet_updates', '097_withdrawal_2fa', '119_events_realtime_rls',
    '118_clob_industry_standard', '117_market_metrics', '115_emergency_pause_system', '106_event_validation_and_realtime',
    '104_market_spec_compliance', '103_mfs_deposit_support', '102_market_admin_fields', '101_spec_alignment_patch',
    '097_workflow_consolidation', '100_fix_event_schema_and_rls', '096_exchange_rate_live', '095_workflow_tracking',
    '094_fix_events_system_bugs', '003_oracle_system', '002_usdt_functions', '001_usdt_schema', '031_fix_user_profiles_rls',
    '030_add_admin_profile', '029_create_verification_workflows', 'Drop resolution_systems table if present',
    '092_ai_daily_topics_system', '091_admin_activity_logs', 'combined_089_090', 'news_sources',
    '088_expert_panel_system', '087_settle_market_v2', '086_ai_topic_config', '085_fix_ai_daily_topics',
    '081_ai_event_creation_schema', 'Markets RLS Policy Fix', '079: Update Withdrawal Logic for Automation',
    '078: Payment Transactions & Deposit RPCs', '077: KYC Review RPC', '076: Withdrawal Request RPC & Wallet Transactions',
    '075: KYC Documents and Withdrawal Logic', '074: Gamification & Loyalty System',
    'Governance & Compliance — Audit, Dormant Accounts & KYC', '072: Risk Management & KYC Advanced Workflow',
    '071_user_security_updates', 'Admin Settings, Agent Wallets & Manual Deposits', 'P2P Seller Cache and Deposit Attempts',
    'Binance P2P Seller Cache & Affiliate Deposit Tracking', 'User KYC Profiles Schema Update',
    'User KYC Profiles and RLS Policies', 'KYC schema, storage bucket and access policies', 'KYC Configuration & Workflow',
    'Admin RLS Fixes & User Search RPC', 'KYC Documents Storage & Access Policies', '063_kyc_system',
    'Deploy Market Function with Event Linkage', 'Market Settlement Function', 'Create Market Draft with Event Pre-fill',
    'Events Table and Market Link Migration', 'Platform Analytics Snapshots',
    'Market Verification and Admin Bypass Enhancements', 'Admin Account Lookup', 'User profiles admin flag migration',
    'Add is_dismissed Column to Notifications', 'Admin Security & Audit Controls',
    'User Profiles, Notifications & KYC/Status Setup', '054_fix_json_syntax',
    'User Profiles, Notification Template Fixes & Account Defaults', 'User Admin & Audit Trails',
    'Market Creation Workflow Drafts', 'Comprehensive Notification System Schema', 'Maker Rebates & Spread Rewards System',
    '047_user_follows_and_feed_enhancement', '048_maker_rebates_system', 'Follow System & Activity Feed Integration',
    'Badges, Follows & Feed Preferences + Comment Vote Trigger', 'Threaded Market Comments Retriever',
    '043_fix_missing_columns', 'Advanced Social & Moderation Schema', 'Seed Resolved Markets and Activity Using Existing Users',
    'Users table diagnostic', 'Diagnose and Minimal Fix for Trigger/Constraint Insert Failures',
    'Leaderboard Data Workaround', 'Users Table Introspection', 'Bulletproof Leaderboard Mock Data',
    'Leaderboard Mock Data Seeder', 'Inspect users triggers and wallets foreign keys', '030_leaderboard_mock_data_safe',
    '029_leaderboard_mock_data_fixed', '024_payout_multioutcome', '028_dispute_settlement', '027_advanced_verification',
    '026_verification_tracking', '025_bangladesh_ai_oracle', '024_advanced_ai_oracle',
    '023_regulatory_reporting_scalability', '022_trade_ledger_immutability', '021_advanced_matching_engine',
    '020_partial_fill_management', '019_advanced_cancellation_system', '018_sample_bangladesh_data',
    '017_atomic_order_commitment', '016_market_phases', '015_adaptive_tick_config', '011_platform_features',
    '008_clob_functions', '004_leaderboard_system', '014_unified_wallet_schema', '012_wallet_management',
    '013_risk_engine_sync', '010_ledger_functions', '007_clob_system', '009_clob_mev', '006_comments_system',
    '005_activity_feed'
]

def clean(s):
    return s.replace('.sql', '').strip().lower()

cleaned_local = {clean(f): f for f in local_files}
cleaned_vercel = [c.lower().strip() for c in vercel_list]

to_keep = {}

# Descriptive map logic
descriptive_map = {
    'create market draft with event pre-fill': '060_update_create_draft_func',
    'market settlement function': '061_settle_market_function',
    'deploy market function with event linkage': '062_deploy_event_link',
    'kyc documents storage & access policies': '064_kyc_storage',
    'admin rls fixes & user search rpc': '065_fix_admin_auth',
    'kyc configuration & workflow': '066_fix_kyc_tables',
    'user kyc profiles and rls policies': '067_fix_kyc_profiles_rls',
    'user kyc profiles schema update': '068_fix_kyc_schema_columns',
    'p2p seller cache and deposit attempts': '069_p2p_seller_discovery',
    'admin settings, agent wallets & manual deposits': '070_manual_deposit_system',
    '072: risk management & kyc advanced workflow': '072_risk_management_and_kyc',
    'governance & compliance — audit, dormant accounts & kyc': '073_governance_and_compliance',
    '074: gamification & loyalty system': '074_gamification_loyalty',
    '075: kyc documents and withdrawal logic': '075_kyc_documents',
    '076: withdrawal request rpc & wallet transactions': '076_withdrawal_rpc',
    '077: kyc review rpc': '077_kyc_review',
    '078: payment transactions & deposit rpcs': '078_payment_transactions',
    '079: update withdrawal logic for automation': '079_update_withdrawal_logic',
    'markets rls policy fix': '080_fix_markets_rls',
    'create event with markets function': '123_create_event_with_markets_rpc',
    'seed resolved markets and activity using existing users': '037_use_existing_users',
    'diagnose and minimal fix for trigger/constraint insert failures': '036_diagnose_and_fix',
    'leaderboard data workaround': '034_leaderboard_data_workaround',
    'bulletproof leaderboard mock data': '033_leaderboard_mock_data_bulletproof',
    'user admin & audit trails': '051_user_management',
    'user profiles, notification template fixes & account defaults': '052_fix_missing_tables_and_syntax',
    'user profiles, notifications & kyc/status setup': '055_comprehensive_fix',
    'admin security & audit controls': '056_admin_security_setup',
    'market verification and admin bypass enhancements': '057_market_verification_config',
    'platform analytics snapshots': '058_analytics_schema',
    'events table and market link migration': '059_events_system',
    'comprehensive notification system schema': '049_notification_system',
    'market creation workflow drafts': '050_market_creation_workflow',
    '047_user_follows_and_feed_enhancement': '047_user_follows_and_feed_enhancement',
    '048_maker_rebates_system': '048_maker_rebates_system',
    'maker rebates & spread rewards system': '048_maker_rebates_system',
    'follow system & activity feed integration': '047_user_follows_and_feed_enhancement',
    'badges, follows & feed preferences + comment vote trigger': '046_add_remaining_social',
    'threaded market comments retriever': '044_drop_and_recreate_function',
    'advanced social & moderation schema': '042_social_features_fixed',
    'advanced social & moderation schema extra': '040_social_features',
    'users table diagnostic': '038_diagnostic_only'
}

kept_local_keys = set()
missing_from_local = []

for v in cleaned_vercel:
    if v in cleaned_local:
        to_keep[cleaned_local[v]] = v
        kept_local_keys.add(v)
    elif v in descriptive_map:
        local_key = descriptive_map[v]
        if local_key in cleaned_local:
            to_keep[cleaned_local[local_key]] = v
            kept_local_keys.add(local_key)
        else:
            missing_from_local.append(v)
    else:
        missing_from_local.append(v)

orphans = [f for f in local_files if clean(f) not in kept_local_keys]

print('--- TO KEEP ---')
for k, v in sorted(to_keep.items()):
    print(f'{k} (maps to: {v})')

print('\n--- ORPHANS (NOT IN VERCEL LIST - PROPOSED FOR DELETION) ---')
for o in sorted(orphans):
    print(o)

print('\n--- MISSING FROM LOCAL (IN VERCEL LIST BUT NOT FOUND LOCALLY) ---')
for m in sorted(list(set(missing_from_local))):
    if m not in kept_local_keys:
        print(m)
