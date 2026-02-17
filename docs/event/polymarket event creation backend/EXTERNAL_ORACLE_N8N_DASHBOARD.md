# External Oracle, n8n Workflows এবং Admin Dashboard - Part 4

## 🔗 5. External Oracle System (বহিঃস্থ API)

### Chainlink Oracle Integration (Crypto Prices)

**`app/api/resolution/chainlink/[eventId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient()

    // Load event and resolution config
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.eventId)
      .single()

    const { data: resolution } = await supabase
      .from('resolution_systems')
      .select('*')
      .eq('event_id', params.eventId)
      .single()

    if (!event || !resolution) {
      throw new Error('Event or resolution config not found')
    }

    // Extract price target from question
    // Example: "Will Bitcoin reach $100,000 by Dec 31, 2026?"
    const priceMatch = event.question.match(/\$([0-9,]+)/)
    if (!priceMatch) {
      throw new Error('Could not extract price target from question')
    }

    const targetPrice = parseFloat(priceMatch[1].replace(/,/g, ''))
    const asset = detectAsset(event.question) // 'BTC', 'ETH', etc.

    // Fetch current price from Chainlink
    const currentPrice = await fetchChainlinkPrice(asset)

    // Check resolution criteria
    const outcome = currentPrice >= targetPrice ? 1 : 2

    // Update event
    await supabase
      .from('events')
      .update({
        trading_status: 'resolved',
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
        resolution_source: `chainlink_oracle_${asset}`
      })
      .eq('id', params.eventId)

    await supabase
      .from('resolution_systems')
      .update({
        resolution_status: 'resolved',
        proposed_outcome: outcome,
        confidence_level: 99, // High confidence for price feeds
        evidence: {
          oracle_type: 'chainlink',
          asset,
          target_price: targetPrice,
          actual_price: currentPrice,
          timestamp: new Date().toISOString()
        },
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolution.id)

    return NextResponse.json({
      success: true,
      outcome,
      target_price: targetPrice,
      current_price: currentPrice
    })

  } catch (error: any) {
    console.error('Chainlink oracle error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function detectAsset(question: string): string {
  const assets = {
    'bitcoin': 'BTC',
    'btc': 'BTC',
    'ethereum': 'ETH',
    'eth': 'ETH',
    'solana': 'SOL',
    'sol': 'SOL'
  }

  for (const [keyword, symbol] of Object.entries(assets)) {
    if (question.toLowerCase().includes(keyword)) {
      return symbol
    }
  }

  throw new Error('Could not detect asset from question')
}

async function fetchChainlinkPrice(asset: string): Promise<number> {
  // Chainlink Data Feeds
  // In production, you'd use actual Chainlink smart contracts
  // For now, we'll use a price API as proxy
  
  const priceFeeds: Record<string, string> = {
    'BTC': 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    'ETH': 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
    'SOL': 'https://api.coinbase.com/v2/prices/SOL-USD/spot'
  }

  const url = priceFeeds[asset]
  if (!url) throw new Error(`No price feed for ${asset}`)

  const response = await fetch(url)
  const data = await response.json()

  return parseFloat(data.data.amount)
}
```

### Sports API Oracle (Cricinfo, ESPN)

**`app/api/resolution/sports/[eventId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.eventId)
      .single()

    const { data: resolution } = await supabase
      .from('resolution_systems')
      .select('*')
      .eq('event_id', params.eventId)
      .single()

    if (!event || !resolution || !resolution.external_api_endpoint) {
      throw new Error('Configuration missing')
    }

    // Fetch match result from sports API
    const matchResult = await fetchSportsResult(
      resolution.external_api_endpoint,
      resolution.external_oracle_type
    )

    // Determine outcome based on question
    const outcome = determineOutcome(event.question, matchResult)

    // Resolve
    await supabase
      .from('events')
      .update({
        trading_status: 'resolved',
        resolved_outcome: outcome,
        resolved_at: new Date().toISOString(),
        resolution_source: `${resolution.external_oracle_type}_api`
      })
      .eq('id', params.eventId)

    await supabase
      .from('resolution_systems')
      .update({
        resolution_status: 'resolved',
        proposed_outcome: outcome,
        confidence_level: 98,
        evidence: {
          api_response: matchResult,
          api_type: resolution.external_oracle_type
        },
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolution.id)

    return NextResponse.json({
      success: true,
      outcome,
      match_result: matchResult
    })

  } catch (error: any) {
    console.error('Sports API error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function fetchSportsResult(endpoint: string, apiType: string) {
  // Implementation depends on which sports API you're using
  // Example: Cricinfo API, ESPN API, etc.
  
  const response = await fetch(endpoint, {
    headers: {
      // Add API key if needed
      'X-API-Key': process.env.SPORTS_API_KEY || ''
    }
  })

  if (!response.ok) {
    throw new Error(`Sports API error: ${response.statusText}`)
  }

  return await response.json()
}

function determineOutcome(question: string, matchResult: any): 1 | 2 {
  // Parse question and match with result
  // Example: "Will Bangladesh win against India?"
  
  // This is simplified - you'd need sophisticated parsing
  const teamMatch = question.match(/Will (.*?) win/i)
  if (!teamMatch) throw new Error('Could not parse team from question')

  const team = teamMatch[1].trim()
  const winner = matchResult.winner || matchResult.result?.winner

  return winner.toLowerCase().includes(team.toLowerCase()) ? 1 : 2
}
```

---

## 🤖 n8n Automation Workflows

### 1. Daily AI Topic Generation Workflow

**`n8n-workflows/daily-ai-topics.json`**

```json
{
  "name": "Daily AI Topic Generation",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 6 * * *"
            }
          ]
        }
      },
      "name": "Schedule: 6 AM Daily",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "id": "schedule-trigger"
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/ai/suggest-topics",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "categories",
              "value": "=['Sports', 'Politics', 'Crypto', 'Economics', 'Technology']"
            },
            {
              "name": "count",
              "value": "=10"
            }
          ]
        },
        "options": {
          "timeout": 60000
        }
      },
      "name": "Generate AI Topics",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "id": "generate-topics"
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "position": [650, 300],
      "id": "check-success"
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "select": "channel",
        "channelId": {
          "__rl": true,
          "value": "={{$env.SLACK_CHANNEL_ID}}",
          "mode": "id"
        },
        "messageType": "block",
        "blocksUi": {
          "blocksValues": [
            {
              "type": "section",
              "text": {
                "text": "✨ *Daily AI Topic Suggestions Generated*\n\n📊 Total: {{$json.count}} new topics\n📅 Date: {{$now.toFormat('yyyy-MM-dd')}}\n\n[View in Admin Panel]({{$env.NEXT_PUBLIC_APP_URL}}/admin/ai-topics)",
                "type": "mrkdwn"
              }
            }
          ]
        }
      },
      "name": "Notify Slack",
      "type": "n8n-nodes-base.slack",
      "position": [850, 250],
      "id": "notify-slack"
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/notifications/send-to-admins",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "title",
              "value": "=Daily AI Topics Ready"
            },
            {
              "name": "message",
              "value": "={{$json.count}} new topic suggestions are ready for review"
            },
            {
              "name": "type",
              "value": "=ai_topics_generated"
            }
          ]
        }
      },
      "name": "Notify Admins",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 350],
      "id": "notify-admins"
    }
  ],
  "connections": {
    "Schedule: 6 AM Daily": {
      "main": [[{"node": "Generate AI Topics", "type": "main", "index": 0}]]
    },
    "Generate AI Topics": {
      "main": [[{"node": "Check Success", "type": "main", "index": 0}]]
    },
    "Check Success": {
      "main": [
        [
          {"node": "Notify Slack", "type": "main", "index": 0},
          {"node": "Notify Admins", "type": "main", "index": 0}
        ]
      ]
    }
  }
}
```

### 2. Auto-Resolution Monitoring Workflow

**`n8n-workflows/auto-resolution-monitor.json`**

```json
{
  "name": "Auto-Resolution Monitor",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule: Every Hour",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "id": "schedule"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT e.id, e.name, e.ends_at, r.primary_method, r.resolution_status\nFROM events e\nJOIN resolution_systems r ON e.id = r.event_id\nWHERE e.trading_status = 'active'\nAND e.ends_at < NOW()\nAND r.resolution_status = 'pending'\nLIMIT 10;"
      },
      "name": "Find Events to Resolve",
      "type": "n8n-nodes-base.postgres",
      "position": [450, 300],
      "credentials": {
        "postgres": {
          "id": "supabase-pg",
          "name": "Supabase PostgreSQL"
        }
      },
      "id": "find-events"
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.count}}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      },
      "name": "Has Events to Resolve?",
      "type": "n8n-nodes-base.if",
      "position": [650, 300],
      "id": "check-events"
    },
    {
      "parameters": {
        "batchSize": 1,
        "options": {}
      },
      "name": "Loop Through Events",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [850, 250],
      "id": "loop-events"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.primary_method}}",
              "value2": "ai_oracle"
            }
          ]
        }
      },
      "name": "Check Method",
      "type": "n8n-nodes-base.switch",
      "position": [1050, 250],
      "id": "check-method"
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/resolution/ai-oracle/{{$json.id}}",
        "method": "POST",
        "options": {
          "timeout": 120000
        }
      },
      "name": "Trigger AI Oracle",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 150],
      "id": "ai-oracle"
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/resolution/chainlink/{{$json.id}}",
        "method": "POST"
      },
      "name": "Trigger Chainlink",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 250],
      "id": "chainlink"
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/resolution/sports/{{$json.id}}",
        "method": "POST"
      },
      "name": "Trigger Sports API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1250, 350],
      "id": "sports-api"
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Resolution Success?",
      "type": "n8n-nodes-base.if",
      "position": [1450, 250],
      "id": "check-resolution"
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "select": "channel",
        "channelId": {
          "__rl": true,
          "value": "={{$env.SLACK_CHANNEL_ID}}",
          "mode": "id"
        },
        "text": "=✅ Event Auto-Resolved\n*{{$node[\"Loop Through Events\"].json.name}}*\nMethod: {{$node[\"Loop Through Events\"].json.primary_method}}\nOutcome: {{$json.outcome === 1 ? 'YES' : 'NO'}}"
      },
      "name": "Log Success",
      "type": "n8n-nodes-base.slack",
      "position": [1650, 200],
      "id": "log-success"
    },
    {
      "parameters": {
        "authentication": "oAuth2",
        "select": "channel",
        "channelId": {
          "__rl": true,
          "value": "={{$env.SLACK_ALERTS_CHANNEL}}",
          "mode": "id"
        },
        "text": "=⚠️ Auto-Resolution Failed\n*{{$node[\"Loop Through Events\"].json.name}}*\nMethod: {{$node[\"Loop Through Events\"].json.primary_method}}\nError: {{$json.error}}\n\n[Review Manually]({{$env.NEXT_PUBLIC_APP_URL}}/admin/events/{{$node[\"Loop Through Events\"].json.id}}/resolve)"
      },
      "name": "Alert Admins",
      "type": "n8n-nodes-base.slack",
      "position": [1650, 300],
      "id": "alert-admins"
    }
  ],
  "connections": {
    "Schedule: Every Hour": {
      "main": [[{"node": "Find Events to Resolve"}]]
    },
    "Find Events to Resolve": {
      "main": [[{"node": "Has Events to Resolve?"}]]
    },
    "Has Events to Resolve?": {
      "main": [[{"node": "Loop Through Events"}]]
    },
    "Loop Through Events": {
      "main": [[{"node": "Check Method"}]]
    },
    "Check Method": {
      "main": [
        [{"node": "Trigger AI Oracle"}],
        [{"node": "Trigger Chainlink"}],
        [{"node": "Trigger Sports API"}]
      ]
    },
    "Trigger AI Oracle": {
      "main": [[{"node": "Resolution Success?"}]]
    },
    "Trigger Chainlink": {
      "main": [[{"node": "Resolution Success?"}]]
    },
    "Trigger Sports API": {
      "main": [[{"node": "Resolution Success?"}]]
    },
    "Resolution Success?": {
      "main": [
        [{"node": "Log Success"}],
        [{"node": "Alert Admins"}]
      ]
    }
  }
}
```

### 3. News Scanner Workflow (AI Oracle Support)

**`n8n-workflows/news-scanner.json`**

```json
{
  "name": "News Scanner for AI Oracle",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "minutes",
              "minutesInterval": 30
            }
          ]
        }
      },
      "name": "Schedule: Every 30 Min",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "id": "schedule"
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM news_sources WHERE is_active = true AND is_whitelisted = true;"
      },
      "name": "Get Active News Sources",
      "type": "n8n-nodes-base.postgres",
      "position": [450, 300],
      "id": "get-sources"
    },
    {
      "parameters": {
        "batchSize": 1
      },
      "name": "Loop Sources",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "id": "loop"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.source_type}}",
              "value2": "rss_feed"
            }
          ]
        }
      },
      "name": "Check Source Type",
      "type": "n8n-nodes-base.switch",
      "position": [850, 300],
      "id": "check-type"
    },
    {
      "parameters": {
        "url": "={{$json.rss_feed_url}}"
      },
      "name": "Fetch RSS Feed",
      "type": "n8n-nodes-base.rssFeedRead",
      "position": [1050, 200],
      "id": "fetch-rss"
    },
    {
      "parameters": {
        "url": "={{$json.api_endpoint}}",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$json.api_key_encrypted}}"
            }
          ]
        }
      },
      "name": "Fetch from API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 300],
      "id": "fetch-api"
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "news_articles",
        "columns": "title, content, url, source_id, published_at, fetched_at"
      },
      "name": "Store Articles",
      "type": "n8n-nodes-base.postgres",
      "position": [1250, 250],
      "id": "store"
    },
    {
      "parameters": {
        "operation": "update",
        "schema": "public",
        "table": "news_sources",
        "updateKey": "id",
        "columns": "total_articles_fetched, last_fetch_at, last_fetch_status"
      },
      "name": "Update Source Stats",
      "type": "n8n-nodes-base.postgres",
      "position": [1450, 250],
      "id": "update-stats"
    }
  ],
  "connections": {
    "Schedule: Every 30 Min": {
      "main": [[{"node": "Get Active News Sources"}]]
    },
    "Get Active News Sources": {
      "main": [[{"node": "Loop Sources"}]]
    },
    "Loop Sources": {
      "main": [[{"node": "Check Source Type"}]]
    },
    "Check Source Type": {
      "main": [
        [{"node": "Fetch RSS Feed"}],
        [{"node": "Fetch from API"}]
      ]
    },
    "Fetch RSS Feed": {
      "main": [[{"node": "Store Articles"}]]
    },
    "Fetch from API": {
      "main": [[{"node": "Store Articles"}]]
    },
    "Store Articles": {
      "main": [[{"node": "Update Source Stats"}]]
    }
  }
}
```

---

## 📊 Comprehensive Admin Dashboard

**`app/admin/dashboard/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  FileText
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const supabase = createClient()
  
  const [stats, setStats] = useState({
    total_events: 0,
    active_events: 0,
    pending_events: 0,
    resolved_events: 0,
    total_users: 0,
    total_volume: 0,
    pending_ai_topics: 0,
    active_disputes: 0,
    total_experts: 0
  })

  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [pendingActions, setPendingActions] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Load stats
    const [
      eventsStats,
      usersCount,
      volumeStats,
      aiTopics,
      disputes,
      experts
    ] = await Promise.all([
      supabase.from('events').select('trading_status', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('trades').select('total_cost').limit(1000),
      supabase.from('ai_daily_topics').select('*', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('dispute_records').select('*', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('expert_panel').select('*', { count: 'exact' })
    ])

    // Calculate stats
    setStats({
      total_events: eventsStats.count || 0,
      active_events: 0, // You'd need to count by status
      pending_events: 0,
      resolved_events: 0,
      total_users: usersCount.count || 0,
      total_volume: volumeStats.data?.reduce((sum, t) => sum + Number(t.total_cost), 0) || 0,
      pending_ai_topics: aiTopics.count || 0,
      active_disputes: disputes.count || 0,
      total_experts: experts.count || 0
    })

    // Load recent admin activity
    const { data: activity } = await supabase
      .from('admin_activity_logs')
      .select('*, admin:admin_id(username)')
      .order('created_at', { ascending: false })
      .limit(10)

    setRecentActivity(activity || [])

    // Load pending actions
    const pendingItems = []

    // Pending AI topics
    if (aiTopics.data && aiTopics.data.length > 0) {
      pendingItems.push({
        type: 'ai_topics',
        count: aiTopics.data.length,
        message: `${aiTopics.data.length} AI topic suggestions waiting for review`,
        link: '/admin/ai-topics',
        priority: 'medium'
      })
    }

    // Pending disputes
    if (disputes.data && disputes.data.length > 0) {
      pendingItems.push({
        type: 'disputes',
        count: disputes.data.length,
        message: `${disputes.data.length} active disputes need resolution`,
        link: '/admin/disputes',
        priority: 'high'
      })
    }

    // Events needing resolution
    const { data: needsResolution } = await supabase
      .from('events')
      .select('*')
      .eq('trading_status', 'active')
      .lt('ends_at', new Date().toISOString())

    if (needsResolution && needsResolution.length > 0) {
      pendingItems.push({
        type: 'resolution',
        count: needsResolution.length,
        message: `${needsResolution.length} events need manual resolution`,
        link: '/admin/events?filter=needs_resolution',
        priority: 'high'
      })
    }

    setPendingActions(pendingItems)
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Platform overview and management
        </p>
      </div>

      {/* Pending Actions Alert */}
      {pendingActions.length > 0 && (
        <Card className="p-6 mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
                Pending Actions ({pendingActions.length})
              </h3>
              <div className="space-y-2">
                {pendingActions.map((action, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={action.priority === 'high' ? 'destructive' : 'secondary'}
                      >
                        {action.priority}
                      </Badge>
                      <span className="text-sm text-orange-800 dark:text-orange-200">
                        {action.message}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = action.link}
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="secondary">Events</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.total_events}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats.active_events} active, {stats.pending_events} pending
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="secondary">Users</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.total_users.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total registered users
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge variant="secondary">Volume</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              ${(stats.total_volume / 1000).toFixed(1)}K
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total trading volume
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge variant="secondary">AI Topics</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.pending_ai_topics}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pending review
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Button
          size="lg"
          className="h-24 text-lg"
          onClick={() => window.location.href = '/admin/events/create/manual'}
        >
          <FileText className="w-6 h-6 mr-3" />
          Create Event (Manual)
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-24 text-lg"
          onClick={() => window.location.href = '/admin/events/create/ai-assisted'}
        >
          <Sparkles className="w-6 h-6 mr-3" />
          Create Event (AI)
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-24 text-lg"
          onClick={() => window.location.href = '/admin/experts'}
        >
          <Award className="w-6 h-6 mr-3" />
          Manage Experts
        </Button>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Admin Activity</h2>
        
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {activity.action_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {activity.admin?.username || 'Unknown'} • {' '}
                    {new Date(activity.created_at).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
              {activity.resource_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/admin/${activity.resource_type}s/${activity.resource_id}`
                  }}
                >
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

চলবে শেষ পার্টে...
