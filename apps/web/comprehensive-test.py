#!/usr/bin/env python3
"""Comprehensive Test Event Creation Verification"""

import requests
import json

supabase_url = 'https://sltcfmqefujecqfbmkvz.supabase.co'
anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE'

print("=" * 60)
print("AUTHENTICATION TEST")
print("=" * 60)

# Step 1: Authenticate
auth_headers = {
    'apikey': anon_key,
    'Content-Type': 'application/json'
}

auth_body = {
    'email': 'admin@plokymarket.bd',
    'password': 'PlokyAdmin2026!'
}

print("\nAttempting authentication...")
auth_resp = requests.post(
    f'{supabase_url}/auth/v1/token?grant_type=password',
    headers=auth_headers,
    json=auth_body
)

print(f'Auth Status: {auth_resp.status_code}')

if auth_resp.status_code != 200:
    print(f'ERROR: {auth_resp.text}')
    exit(1)

auth_data = auth_resp.json()
token = auth_data.get('access_token')
user_id = auth_data.get('user', {}).get('id')

print(f'✓ Token: {token[:40]}...')
print(f'✓ User ID: {user_id}')

# Step 2: Check admin status
print("\n" + "=" * 60)
print("ADMIN ROLE VERIFICATION")
print("=" * 60)

admin_headers = {
    'apikey': anon_key,
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

print(f"\nChecking admin status for user {user_id}...")
profile_resp = requests.get(
    f'{supabase_url}/rest/v1/user_profiles?id=eq.{user_id}',
    headers=admin_headers
)

print(f'Profile Status: {profile_resp.status_code}')

if profile_resp.status_code == 200:
    profiles = profile_resp.json()
    if profiles:
        profile = profiles[0]
        print(f'✓ Name: {profile.get("full_name")}')
        print(f'✓ Is Admin: {profile.get("is_admin")}')
        print(f'✓ Is Super Admin: {profile.get("is_super_admin")}')
    else:
        print('⚠ No profile found')
else:
    print(f'ERROR: {profile_resp.text}')

# Step 3: Test Event Creation (Full Request Logging)
print("\n" + "=" * 60)
print("EVENT CREATION TEST")
print("=" * 60)

event_body = {
    'event_data': {
        'question': 'Will Plokymarket reach 10000 registered users by June 30, 2026?',
        'description': 'Test event to verify complete end-to-end system',
        'category': 'technology',
        'subcategory': 'Platform Metrics',
        'tags': ['plokymarket', 'growth', 'test'],
        'trading_closes_at': '2026-06-30T23:59:59Z',
        'resolution_delay_hours': 24,
        'initial_liquidity': 10000,
        'image_url': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
        'answer1': 'हा (YES)',
        'answer2': 'ना (NO)',
        'is_featured': True,
        'slug': 'plokymarket-10k-users-june-2026'
    },
    'resolution_config': {
        'primary_method': 'ai_oracle',
        'ai_keywords': ['plokymarket', 'users', 'platform'],
        'ai_sources': ['plokymarket.com'],
        'confidence_threshold': 85
    }
}

print(f"\nSending creation request...")
print(f'Authorization: Bearer {token[:20]}...')
print(f'Content: {json.dumps(event_body, indent=2)[:200]}...')

event_resp = requests.post(
    'https://polymarket-bangladesh.vercel.app/api/admin/events/create',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    json=event_body,
    timeout=30
)

print(f'\nResponse Status: {event_resp.status_code}')
print(f'Response Headers: {dict(event_resp.headers)}')

if event_resp.text:
    print(f'Response Body (first 300 chars): {event_resp.text[:300]}')
    
    # Try to parse as JSON
    try:
        resp_json = event_resp.json()
        print(f'\nParsed JSON:')
        print(json.dumps(resp_json, indent=2))
    except:
        print('\n(Response is not JSON)')

# Step 4: Verify in Database
print("\n" + "=" * 60)
print("DATABASE VERIFICATION")
print("=" * 60)

print("\nSearching for test event...")
search_resp = requests.get(
    f'{supabase_url}/rest/v1/markets?slug=eq.plokymarket-10k-users-june-2026&limit=1',
    headers={'apikey': anon_key}
)

print(f'Search Status: {search_resp.status_code}')
results = search_resp.json()
print(f'Results: {len(results)} market(s) found')

if results:
    print('\n✓ TEST EVENT SUCCESSFULLY CREATED!')
    event = results[0]
    print(f'  ID: {event.get("id")}')
    print(f'  Question: {event.get("question")}')
    print(f'  Status: {event.get("status")}')
else:
    print('\n✗ Event not found in database')
    
print("\n" + "=" * 60)
