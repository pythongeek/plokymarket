#!/usr/bin/env python3
"""Test API with Cookie-based Authentication"""

import requests
import json
from http.cookiejar import CookieJar

supabase_url = 'https://sltcfmqefujecqfbmkvz.supabase.co'
anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE'

print("Attempting API call with cookies...")
print("=" * 60)

# Create session with cookies
session = requests.Session()

# Step 1: Authenticate to get session
print("\n1. Authenticating with Supabase...")
auth_resp = session.post(
    f'{supabase_url}/auth/v1/token?grant_type=password',
    headers={
        'apikey': anon_key,
        'Content-Type': 'application/json'
    },
    json={
        'email': 'admin@plokymarket.bd',
        'password': 'PlokyAdmin2026!'
    }
)

print(f'   Status: {auth_resp.status_code}')

if auth_resp.status_code != 200:
    print(f'   ERROR: {auth_resp.text}')
    exit(1)

auth_data = auth_resp.json()
token = auth_data.get('access_token')
refresh_token = auth_data.get('refresh_token')

print(f'   ✓ Got access token')
print(f'   ✓ Cookies in session: {list(session.cookies.keys())}')

# Step 2: Set token as cookie in session
# Supabase uses 'sb-auth-token' or 'sb-<projectid>-auth-token' for the access token
# We need to manually set the auth cookie since the auth endpoint doesn't set it
from http.cookies import SimpleCookie
cookie = SimpleCookie()

# Set the session cookie with the token and refresh token
session_data = {
    'access_token': token,
    'refresh_token': refresh_token,
    'expires_at': auth_data.get('expires_at'),
    'token_type': 'Bearer',
    'user': auth_data.get('user')
}

# Supabase stores this in a specific cookie format
project_id = 'sltcfmqefujecqfbmkvz'
session.cookies.set(
    f'sb-{project_id}-auth-token',
    json.dumps([token, refresh_token]),
    domain='.polymarket-bangladesh.vercel.app'
)

print("   ✓ Set auth cookie in session")

# Step 3: Try API call with this session
print("\n2. Creating event via API (with session)...")

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
        'answer1': 'Yes',
        'answer2': 'No',
        'is_featured': True,
        'slug': 'plokymarket-10k-users-june-2026'
    },
    'resolution_config': {
        'primary_method': 'ai_oracle',
        'ai_keywords': ['plokymarket', 'users'],
        'ai_sources': ['plokymarket.com'],
        'confidence_threshold': 85
    }
}

# Use the session with cookies
event_resp = session.post(
    'https://polymarket-bangladesh.vercel.app/api/admin/events/create',
    json=event_body,
    headers={'Content-Type': 'application/json'},
    timeout=30
)

print(f'   Status: {event_resp.status_code}')
print(f'   Response Type: {event_resp.headers.get("content-type", "unknown")}')

if event_resp.status_code == 200:
    # Try to parse as JSON
    try:
        result = event_resp.json()
        print('\n✓ SUCCESS: Event created!')
        print(json.dumps(result, indent=2))
    except:
        print('✓ Status 200 but response is not JSON')
        print(f'   Body: {event_resp.text[:300]}')
else:
    print(f'\n✗ Failed with status {event_resp.status_code}')
    print(f'   Body: {event_resp.text[:500]}')

print("\n" + "=" * 60)
