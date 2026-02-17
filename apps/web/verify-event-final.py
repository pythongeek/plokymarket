#!/usr/bin/env python3

import requests

supabase_url = 'https://sltcfmqefujecqfbmkvz.supabase.co'
anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE'

headers = {'apikey': anon_key}

# Search for test event with specific slug
print("Searching for test event by slug...")
resp = requests.get(f'{supabase_url}/rest/v1/markets?slug=eq.plokymarket-10k-users-june-2026', headers=headers)
print(f'Response: {resp.status_code}')
if resp.status_code == 200:
    markets = resp.json()
    if markets:
        print(f'✓ FOUND TEST EVENT!')
        m = markets[0]
        print(f'  Question: {m.get("question")}')
        print(f'  Status: {m.get("status")}')
        print(f'  ID: {m.get("id")}')
    else:
        print('✗ Test event not found by slug')
        
        # Try  searching by question text
        print('\nSearching all pending markets...')
        resp2 = requests.get(f'{supabase_url}/rest/v1/markets?status=eq.pending&limit=100', headers=headers)
        if resp2.status_code == 200:
            pending = resp2.json()
            print(f'Found {len(pending)} pending markets')
            for m in pending[:10]:
                print(f'  - {m.get("question")[:60]}...')
else:
    print(f'Error: {resp.text}')
