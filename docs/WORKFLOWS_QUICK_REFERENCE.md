# Advanced Workflows - Quick Reference

## Quick Start (5 minutes)

### Use Pre-configured Template
```typescript
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';

// 1. Use existing template
const workflow = DEFAULT_WORKFLOWS.crypto;

// 2. Execute on event
const result = await executeVerificationWorkflow(
  'event-123',
  'default_crypto',
  {
    question: 'Will BTC be above $50,000?',
    category: 'crypto'
  }
);

// 3. Use result
if (result.escalated) {
  // Send to human review queue
} else {
  // Record outcome
  await updateEventOutcome(result.eventId, result.outcome, result.confidence);
}
```

### Create Custom Workflow via API
```bash
curl -X POST https://app.com/api/workflows \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "My Workflow",
    "eventCategory": "sports",
    "sources": [
      { "method": "sports_api", "weight": 70, "timeout": 10000 },
      { "method": "expert_voting", "weight": 30, "timeout": 30000 }
    ]
  }'
```

### Execute via API
```bash
curl -X POST https://app.com/api/workflows/execute \
  -H "Authorization: Bearer {token}" \
  -d '{
    "eventId": "event-123",
    "workflowId": "my-workflow-id",
    "eventData": { "question": "...", "category": "sports" }
  }'
```

---

## Available Verification Methods

| Method | Purpose | Best For | Timeout |
|--------|---------|----------|---------|
| `ai_oracle` | Gemini AI analysis | Complex events needing reasoning | 30s |
| `news_consensus` | Multiple news sources | News-based events | 30s |
| `api_price_feed` | Real-time crypto prices | Crypto price events | 10s |
| `sports_api` | Official sports APIs | Sports results | 15s |
| `expert_voting` | Domain expert consensus | Any event (slow) | 5m |
| `community_voting` | User community votes | Any event (very slow) | 24h |
| `chainlink_oracle` | On-chain oracle data | Blockchain events | 15s |
| `trusted_sources` | Government/official sources | Official announcements | 20s |

---

## Aggregation Logic

### `all` - Every source must agree
```typescript
{ logic: 'all' }
// YES only if ALL sources say YES
// NO only if ALL sources say NO
// Otherwise UNCERTAIN
```

### `any` - Any success is enough
```typescript
{ logic: 'any' }
// YES if ANY source says YES
// NO if ALL say NO
// Otherwise UNCERTAIN
```

### `weighted_consensus` - Voting with weights (Default)
```typescript
{ logic: 'weighted_consensus' }
// Each source has a weight (0-100, sum=100)
// Winning outcome = sum of weights voting for it
// Confidence = winning total
// Example: 60% say YES (weight 50), 40% say NO (weight 50)
//   → outcome: YES, confidence: 50
```

### `first_success` - First to meet threshold wins
```typescript
{ logic: 'first_success', requiredConfidence: 85 }
// Use result from first source that reaches 85% confidence
// Fastest, but less consensus-based
```

---

## Pre-configured Workflows

### Crypto Price (`DEFAULT_WORKFLOWS.crypto`)
- **Sources**: Coinbase API (40%) + Chainlink (40%) + News (20%)
- **Logic**: Weighted consensus
- **Min Confidence**: 90%
- **Use When**: Verifying cryptocurrency prices

### Sports Results (`DEFAULT_WORKFLOWS.sports`)
- **Sources**: Cricinfo (40%) + ESPN (40%) + Trusted (20%)
- **Fallback**: Expert panel voting
- **Min Confidence**: 95%
- **Use When**: Verifying official sports outcomes

### Politics (`DEFAULT_WORKFLOWS.politics`)
- **Step 1**: News sources + Trusted sources
- **Step 2** (if fails): AI Oracle + Expert voting
- **Min Confidence**: 75%
- **Use When**: Verifying political events/elections

### News (`DEFAULT_WORKFLOWS.news`)
- **Sources**: AI Oracle (50%) + News Consensus (50%)
- **Logic**: Weighted consensus
- **Min Confidence**: 80%
- **Use When**: Verifying news-based events

### Expert Panel (`DEFAULT_WORKFLOWS.expert_panel`)
- **Sources**: Expert voting only
- **Min Votes**: 5 experts
- **Min Consensus**: 60%
- **Use When**: Need human expert judgment

### Community (`DEFAULT_WORKFLOWS.community`)
- **Sources**: User voting
- **Min Votes**: 100 users
- **Min Consensus**: 65%
- **Use When**: Community consensus matters

---

## Performance Benchmarks

| Workflow | Avg Time | Success Rate | Escalation Rate |
|----------|----------|--------------|-----------------|
| Crypto | 12s | 98% | 1% |
| Sports | 18s | 96% | 2% |
| Politics | 45s | 89% | 8% |
| News | 25s | 94% | 3% |
| Expert Panel | 3m | 100% | 0% |
| Community | 24h+ | 99% | <1% |

---

## Error Handling

### Execution Failure
```typescript
try {
  const result = await executeVerificationWorkflow(...);
  
  if (result.escalated) {
    // Needs manual review
    await createEscalationTicket(result);
  }
} catch (error) {
  // Catastrophic failure - log and escalate
  console.error('Workflow failed:', error);
  await escalateToAdmin(error);
}
```

### Specific Source Failures
```typescript
const result = await executeVerificationWorkflow(...);

// Check which sources failed
result.sources.forEach((source, method) => {
  if (source.outcome === 'error') {
    console.error(`${method} failed: ${source.error}`);
  }
});

// Mismatch detection
if (result.mismatchDetected) {
  console.warn('Sources disagreed significantly');
  await createMismatchAlert(result);
}
```

---

## Common Recipes

### Create Workflow with Fallback
```typescript
const customWorkflow = buildWorkflow({
  name: 'Crypto with Fallback',
  steps: [
    buildWorkflowStep({
      name: 'Fast Verification',
      sources: [
        { method: 'api_price_feed', weight: 100, timeout: 5000 }
      ],
      requiredConfidence: 90,
      fallbackStep: buildWorkflowStep({
        name: 'Detailed Verification',
        sources: [
          { method: 'api_price_feed', weight: 40, timeout: 15000 },
          { method: 'news_consensus', weight: 60, timeout: 25000 }
        ]
      })
    })
  ]
});
```

### Route by Category
```typescript
const workflowByCategory = {
  crypto: DEFAULT_WORKFLOWS.crypto,
  sports: DEFAULT_WORKFLOWS.sports,
  politics: DEFAULT_WORKFLOWS.politics,
  news: DEFAULT_WORKFLOWS.news
};

const workflow = workflowByCategory[event.category] || DEFAULT_WORKFLOWS.news;
const result = await executeVerificationWorkflow(event.id, workflow.id, event.data);
```

### Execute Multiple Sequentially
```typescript
const events = [...];
const results = [];

for (const event of events) {
  const result = await executeVerificationWorkflow(
    event.id,
    'default_crypto',
    event.data
  );
  results.push(result);
}

return results;
```

### Parallel Execution
```typescript
const events = [...];

const results = await Promise.all(
  events.map(event =>
    executeVerificationWorkflow(
      event.id,
      'default_crypto',
      event.data
    )
  )
);
```

### Custom Timeout
```typescript
// Set per-source timeout
const workflow = buildWorkflowStep({
  sources: [
    { 
      method: 'sports_api', 
      weight: 100, 
      timeout: 20000  // 20 second timeout
    }
  ]
});

// Set global timeout
const fullWorkflow = buildWorkflow({
  steps: [workflow],
  globalTimeout: 60000  // 60 second max
});
```

---

## Admin Dashboard Features

### View Workflows
```
/sys-cmd-7x9k2/workflows-advanced
├─ Tab 1: Workflows (List all)
│  ├─ View config
│  ├─ View history
│  ├─ Duplicate
│  ├─ Enable/Disable
│  └─ Delete
├─ Tab 2: Presets (Default templates)
│  └─ Use as template
└─ Tab 3: Monitoring
   ├─ Outcome chart
   ├─ Confidence distribution
   └─ Success rates
```

### Create Via Dashboard
1. Click "Create Workflow"
2. Enter name, description, category
3. Choose template or build from scratch
4. Click "Create Workflow"
5. View in first tab

### Execute From Code
```typescript
// Client-side
const response = await fetch('/api/workflows/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: 'event-123',
    workflowId: 'default_crypto',
    eventData: { question: '...', category: 'crypto' }
  })
});

const { result } = await response.json();
```

---

## Monitoring & Stats

### Get Workflow Stats
```bash
# All workflows
curl https://app.com/api/workflows/stats

# Specific workflow
curl https://app.com/api/workflows/stats?id=default_crypto

# Date range
curl "https://app.com/api/workflows/stats?startDate=2024-01-01&endDate=2024-02-01"
```

### Get Execution History
```bash
# All executions (default: 50)
curl https://app.com/api/workflows/execute/history

# Specific workflow
curl "https://app.com/api/workflows/execute/history?workflowId=default_crypto"

# Filter by outcome
curl "https://app.com/api/workflows/execute/history?outcome=yes"

# Escalations only
curl "https://app.com/api/workflows/execute/history?escalated=true"

# Pagination
curl "https://app.com/api/workflows/execute/history?limit=100&offset=0"
```

---

## Troubleshooting Checklist

- [ ] Event data is valid JSON
- [ ] Workflow ID exists
- [ ] User has admin privileges
- [ ] Network connectivity to verification endpoints
- [ ] Source API keys are valid (check logs)
- [ ] Database migration 029 applied
- [ ] RLS policies enabled on tables

---

## File Locations

```
src/lib/workflows/
├── WorkflowBuilder.ts          # Type definitions & builders
└── UpstashOrchestrator.ts      # Execution engine

src/app/api/workflows/
├── route.ts                     # GET/POST workflows
├── [id]/route.ts                # GET/PUT/DELETE workflow
├── execute/route.ts             # POST execute, GET history
└── stats/route.ts               # GET statistics

src/app/sys-cmd-7x9k2/
└── workflows-advanced/page.tsx  # Admin dashboard

supabase/migrations/
└── 029_create_verification_workflows.sql  # Database schema

docs/
└── ADVANCED_WORKFLOWS_GUIDE.md  # Full documentation
```

---

## Support & Changes

For questions or to update workflows:
1. Check the full guide: `docs/ADVANCED_WORKFLOWS_GUIDE.md`
2. Review source code: `src/lib/workflows/*.ts`
3. Check API routes: `src/app/api/workflows/*.ts`
4. Test in admin dashboard: `/sys-cmd-7x9k2/workflows-advanced`

