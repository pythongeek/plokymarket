#!/usr/bin/env python3
"""Test Event Creation for Plokymarket"""

import json
import requests
from datetime import datetime, timedelta
import sys

print("=" * 50)
print("Plokymarket Test Event Creation")
print("=" * 50)

# Step 1: Authenticate
print("\nStep 1: Authenticating admin user...")

supabase_url = "https://sltcfmqefujecqfbmkvz.supabase.co"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE"

auth_headers = {
    "apikey": anon_key,
    "Content-Type": "application/json"
}

auth_body = {
    "email": "admin@plokymarket.bd",
    "password": "PlokyAdmin2026!"
}

try:
    auth_response = requests.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers=auth_headers,
        json=auth_body,
        timeout=10
    )
    auth_response.raise_for_status()
    auth_data = auth_response.json()
    token = auth_data.get('access_token')
    
    if not token:
        print("✗ No access token in response")
        print(f"Response: {auth_data}")
        sys.exit(1)
    
    print("✓ Authentication successful")
    print(f"  Token: {token[:40]}...")
except Exception as e:
    print(f"✗ Authentication failed: {e}")
    sys.exit(1)

# Step 2: Create Test Event
print("\nStep 2: Creating test event...")

event_headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

end_date = (datetime.utcnow() + timedelta(days=135)).isoformat() + "Z"

event_body = {
    "event_data": {
        "question": "Will Plokymarket reach 10000 registered users by June 30, 2026?",
        "description": "Test event to verify the complete event creation and trading system is working end-to-end. This includes market creation, order matching, and real-time price updates.",
        "category": "technology",
        "subcategory": "Platform Metrics",
        "tags": ["plokymarket", "growth", "platform", "test"],
        "trading_closes_at": end_date,
        "resolution_delay_hours": 24,
        "initial_liquidity": 10000,
        "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
        "answer1": "হ্যাঁ (YES)",
        "answer2": "না (NO)",
        "is_featured": True,
        "slug": "plokymarket-10k-users-june-2026"
    },
    "resolution_config": {
        "primary_method": "ai_oracle",
        "ai_keywords": ["plokymarket", "users", "platform", "registered"],
        "ai_sources": ["plokymarket.com"],
        "confidence_threshold": 85
    }
}

try:
    event_response = requests.post(
        "https://polymarket-bangladesh.vercel.app/api/admin/events/create",
        headers=event_headers,
        json=event_body,
        timeout=30
    )
    
    print(f"Response Status: {event_response.status_code}")
    
    if event_response.status_code == 200:
        print("✓ Event created successfully")
        
        # Try to parse JSON response
        try:
            resp_data = event_response.json()
            print(f"\nEvent Details:")
            print(f"  Event ID: {resp_data.get('event_id', 'N/A')}")
            print(f"  Message: {resp_data.get('message', 'N/A')}")
            if 'execution_time_ms' in resp_data:
                print(f"  Execution Time: {resp_data['execution_time_ms']}ms")
        except:
            print("  (API responded with valid status, response parsing skipped)")
        
        print(f"\nView Test Event:")
        print(f"  Live: https://polymarket-bangladesh.vercel.app")
        print(f"  Admin: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events")
    else:
        print(f"✗ Event creation failed with status {event_response.status_code}")
        print(f"Response: {event_response.text[:500]}")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Event creation failed: {e}")
    sys.exit(1)

print("\n✓ Test event creation complete!")
