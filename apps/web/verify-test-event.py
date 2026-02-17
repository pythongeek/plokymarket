#!/usr/bin/env python3
"""Verify test event creation in Supabase"""

import requests
import json

supabase_url = 'https://sltcfmqefujecqfbmkvz.supabase.co'
anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE'

headers = {
    'apikey': anon_key,
    'Content-Type': 'application/json'
}

print("Checking Supabase for test event...")
print("=" * 50)

# Check for recent markets
print("\nQuerying markets table...")
resp = requests.get(f'{supabase_url}/rest/v1/markets?order=created_at.desc&limit=10', headers=headers)

print(f'Response Status: {resp.status_code}')

if resp.status_code == 200:
    markets = resp.json()
    print(f'Total Markets Found: {len(markets)}')
    print("\nRecent Markets:")
    print("-" * 50)
    
    for i, market in enumerate(markets[:5], 1):
        question = market.get('question', 'N/A')
        status = market.get('status', 'N/A')
        slug = market.get('slug', 'N/A')
        created = market.get('created_at', 'N/A')
        
        print(f"\n{i}. {question}")
        print(f"   Status: {status}")
        print(f"   Slug: {slug}")
        print(f"   Created: {created}")
        
        # Check if this is our test event
        if 'plokymarket' in question.lower() and '10000' in question.lower():
            print("   ✓ THIS IS OUR TEST EVENT!")
            print(f"   Market ID: {market.get('id', 'N/A')}")
            break
else:
    print(f'Error: {resp.status_code}')
    print(f'Response: {resp.text[:500]}')

print("\n" + "=" * 50)
