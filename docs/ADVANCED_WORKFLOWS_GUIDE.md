# Advanced Verification Workflows - Implementation Guide

## Overview

This guide explains the complete workflow verification system that replaces the external n8n + Oracle system with an advanced, configurable Upstash-based orchestrator. The system enables admins to compose multi-source event verification chains with weighted consensus, automatic escalation, and full audit trails.

**Key Architecture:**
- **WorkflowBuilder.ts** - Define and compose verification workflows with 8 verification methods
- **UpstashOrchestrator.ts** - Execute workflows with multi-source consensus and orchestration
- **API Routes** - CRUD + execution + monitoring endpoints
- **Admin Dashboard** - UI for workflow configuration and analytics
- **Database** - Persistent storage of workflows and execution history

---

## System Components

### 1. Workflow Definition System (`WorkflowBuilder.ts`)

**Purpose:** Define verification workflows declaratively with reusable templates

**Key Types:**
```typescript
// 8 Verification Methods Available
type VerificationMethod =
  | 'ai_oracle'           // Gemini AI analysis
  | 'news_consensus'      // Multiple news sources voting
  | 'api_price_feed'      // Real-time crypto price feeds
  | 'sports_api'          // Official sports APIs
  | 'expert_voting'       // Domain expert consensus
  | 'community_voting'    // User community voting
  | 'chainlink_oracle'    // On-chain oracle data
  | 'trusted_sources';    // Government/official sources

// 4 Aggregation Logic Patterns
type WorkflowLogic = 
  | 'all'                 // All sources must agree
  | 'any'                 // Any source success is enough
  | 'weighted_consensus'  // Weighted voting (default)
  | 'first_success';      // First to meet confidence wins

// Individual Source Configuration
interface VerificationSource {
  method: VerificationMethod;
  weight: number;          // 0-100, sum = 100
  timeout: number;         // milliseconds
  config?: {
    [key: string]: any;   // Method-specific config
  };
}

// Sequential Step with Fallback
interface WorkflowStep {
  id: string;
  name: string;
  sources: VerificationSource[];
  logic: WorkflowLogic;
  requiredConfidence: number;  // 0-100
  fallbackStep?: WorkflowStep;  // Try if main fails
}

// Complete Workflow Definition
interface VerificationWorkflow {
  id?: string;
  name: string;
  description: string;
  eventCategory: string;  // crypto, sports, politics, news, complex
  steps: WorkflowStep[];
  globalTimeout: number;           // total execution time (ms)
  escalationThreshold: number;     // confidence below this = escalate
  requireMismatchReview: boolean;  // require human review on conflicts
}
```

**Pre-configured Templates:**
```typescript
// Crypto Price Verification
DEFAULT_WORKFLOWS.crypto
  → 3 sources: Coinbase API (40%) + Chainlink (40%) + News (20%)
  → Requires 90% confidence
  → 5-min timeout

// Sports Result Verification
DEFAULT_WORKFLOWS.sports
  → 3 sources: Cricinfo (40%) + ESPN (40%) + Trusted (20%)
  → Requires 95% confidence
  → 5-min timeout with fallback to expert panel

// Politics Event Resolution
DEFAULT_WORKFLOWS.politics
  → Multi-step: News + Trusted → if fails → AI + Expert voting
  → Requires 75% confidence minimum
  → Full escalation chain

// News Event Verification
DEFAULT_WORKFLOWS.news
  → 2 sources: AI Oracle + News Consensus
  → Requires 80% confidence
  → 5-min timeout

// Expert Panel Voting
DEFAULT_WORKFLOWS.expert_panel
  → Requires 5+ expert votes, 60% consensus
  → No timeout (waits for votes)

// Community Voting
DEFAULT_WORKFLOWS.community
  → Requires 100+ community votes, 65% consensus
  → Extended timeout for voting period
```

**Usage:**
```typescript
import { DEFAULT_WORKFLOWS, buildWorkflow } from '@/lib/workflows/WorkflowBuilder';

// Use template
const cryptoWorkflow = DEFAULT_WORKFLOWS.crypto;

// Create custom workflow
const customWorkflow = buildWorkflow({
  name: 'Custom Verification',
  description: 'My custom workflow',
  eventCategory: 'crypto',
  steps: [
    buildWorkflowStep({
      name: 'Primary Sources',
      sources: [
        { method: 'api_price_feed', weight: 50, timeout: 10000 },
        { method: 'ai_oracle', weight: 50, timeout: 30000 }
      ],
      logic: 'weighted_consensus',
      requiredConfidence: 85
    })
  ]
});
```

---

### 2. Workflow Execution Engine (`UpstashOrchestrator.ts`)

**Purpose:** Execute workflows with advanced orchestration, consensus calculation, and error handling

**Main Flow:**
```
1. executeVerificationWorkflow()
   ├─ Load workflow config
   ├─ Validate event data
   ├─ Execute workflow steps
   │  ├─ executeWorkflowStep()
   │  │  ├─ Parallel execute all sources
   │  │  ├─ Apply workflow logic (all/any/weighted/first_success)
   │  │  └─ Check if confidence meets threshold
   │  └─ Continue or escalate based on result
   ├─ Aggregate final results
   ├─ Detect mismatches
   ├─ Handle escalation
   └─ Log audit trail
```

**Key Features:**

1. **Multi-Source Parallel Execution**
   - Execute multiple verification sources in parallel
   - Enforce per-source timeout (default 10s)
   - Exponential backoff retry (up to 3 attempts)

2. **Workflow Logic Application**
   ```typescript
   // all: Every source must agree
   logic: 'all' → outcome = 'yes' only if 100% of sources say 'yes'
   
   // any: Any source success is enough
   logic: 'any' → outcome = 'yes' if ANY source says 'yes'
   
   // weighted_consensus (default)
   logic: 'weighted_consensus' 
     → outcome = highest(weighted_vote)
     → confidence = sum(weights_of_winning_outcome)
   
   // first_success
   logic: 'first_success'
     → outcome = first source to meet requiredConfidence
   ```

3. **Automatic Escalation**
   - When confidence < escalationThreshold
   - When multiple sources return conflicting high-confidence results
   - When any source fails with critical errors
   - Creates escalation alert for human review

4. **Fallback Chains**
   - If step fails → try fallbackStep
   - Continue chain until success or all fallbacks exhausted
   - Track which steps were attempted in audit log

5. **Comprehensive Error Handling**
   - Timeout enforcement (step + global)
   - Network retry logic
   - Partial success handling
   - Graceful degradation

6. **Audit Trail**
   - Log every execution
   - Record all source results
   - Capture confidence calculations
   - Track escalations and reasoning

**Execution Context:**
```typescript
interface VerificationContext {
  eventId: string;
  eventData: {
    question: string;
    description?: string;
    category: string;
    deadline?: Date;
    [key: string]: any;
  };
}

interface VerificationResult {
  outcome: 'yes' | 'no' | 'uncertain' | 'escalated';
  confidence: number;      // 0-100
  sources: {
    [method: string]: {
      outcome: 'yes' | 'no' | 'uncertain' | 'error';
      confidence: number;
      data?: any;
      error?: string;
    };
  };
  evidence: {
    reasoning: string;
    inconsistencies?: string[];
    [key: string]: any;
  };
  mismatchDetected: boolean;
  escalated: boolean;
  escalationReason?: string;
  executionTime: number;  // milliseconds
}
```

**Usage:**
```typescript
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';

const result = await executeVerificationWorkflow(
  'event-123',
  'workflow-crypto-price',
  {
    question: 'Will BTC be above $50,000 by Dec 1?',
    category: 'crypto',
    deadline: new Date('2024-12-01')
  }
);

console.log(result);
// {
//   outcome: 'yes',
//   confidence: 92,
//   sources: { ... },
//   evidence: { ... },
//   escalated: false,
//   executionTime: 18500
// }
```

---

## API Routes

### 1. List/Create Workflows
**`GET/POST /api/workflows`**

```bash
# List all workflows
curl https://app.com/api/workflows \
  -H "Authorization: Bearer {session_token}"

# Response:
{
  "success": true,
  "count": 8,
  "workflows": [
    {
      "id": "default_crypto",
      "name": "Cryptocurrency Price Verification",
      "description": "Verifies crypto prices using 3 independent sources",
      "event_category": "crypto",
      "config": { "steps": [...] },
      "enabled": true,
      "is_default": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    // ... more workflows
  ]
}

# Filter by category
curl "https://app.com/api/workflows?category=crypto&enabled=true"

# Create new workflow
curl -X POST https://app.com/api/workflows \
  -H "Authorization: Bearer {session_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Workflow",
    "description": "My custom verification workflow",
    "eventCategory": "sports",
    "sources": [
      { "method": "sports_api", "weight": 60, "timeout": 10000 },
      { "method": "trusted_sources", "weight": 40, "timeout": 15000 }
    ],
    "logic": "weighted_consensus",
    "requiredConfidence": 80
  }'

# Response:
{
  "success": true,
  "message": "Workflow created successfully",
  "workflow": {
    "id": "uuid-...",
    "name": "Custom Workflow",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get/Update/Delete Specific Workflow
**`GET/PUT/DELETE /api/workflows/[id]`**

```bash
# Get workflow with execution history
curl https://app.com/api/workflows/default_crypto?historyLimit=20

# Response:
{
  "success": true,
  "workflow": {
    "id": "default_crypto",
    "name": "Cryptocurrency Price Verification",
    "config": { ... },
    "executions": [
      {
        "id": "exec-uuid",
        "event_id": "event-123",
        "outcome": "yes",
        "confidence": 92,
        "executed_at": "2024-01-15T09:30:00Z"
      }
      // ... more executions
    ]
  }
}

# Update workflow
curl -X PUT https://app.com/api/workflows/workflow-id \
  -H "Authorization: Bearer {session_token}" \
  -d '{
    "enabled": false,
    "config": { ... }
  }'

# Delete workflow (prevents deletion of defaults)
curl -X DELETE https://app.com/api/workflows/workflow-id \
  -H "Authorization: Bearer {session_token}"
```

### 3. Execute Workflow
**`POST /api/workflows/execute`**

```bash
# Execute workflow on an event
curl -X POST https://app.com/api/workflows/execute \
  -H "Authorization: Bearer {session_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-123",
    "workflowId": "default_crypto",
    "eventData": {
      "question": "Will BTC be above $50,000 by Dec 1?",
      "category": "crypto",
      "deadline": "2024-12-01"
    }
  }'

# Response:
{
  "success": true,
  "message": "Workflow completed successfully",
  "result": {
    "outcome": "yes",
    "confidence": 92,
    "sources": { ... },
    "escalated": false,
    "executionTime": 18500
  }
}

# Get execution history
curl "https://app.com/api/workflows/execute/history?workflowId=default_crypto&limit=50"

# Get with filters
curl "https://app.com/api/workflows/execute/history?outcome=yes&escalated=false&workflowId=default_crypto"
```

### 4. Workflow Statistics
**`GET /api/workflows/stats`**

```bash
# Get global statistics
curl https://app.com/api/workflows/stats

# Response:
{
  "success": true,
  "stats": {
    "totalExecutions": 1245,
    "yesCount": 780,
    "noCount": 423,
    "escalatedCount": 42,
    "yesPercentage": 63,
    "noPercentage": 34,
    "escalatedPercentage": 3,
    "avgConfidence": 87.5,
    "avgExecutionTime": 12340
  }
}

# Get stats for specific workflow
curl "https://app.com/api/workflows/stats?id=default_crypto"

# Get stats for date range
curl "https://app.com/api/workflows/stats?startDate=2024-01-01&endDate=2024-01-31"
```

---

## Admin Dashboard

**Location:** `/sys-cmd-7x9k2/workflows-advanced`

**Features:**

1. **Workflow Overview**
   - List all workflows (default + custom)
   - Enable/disable workflows
   - View workflow configuration
   - Duplicate existing workflows

2. **Create Workflow**
   - Dialog for creating new workflows
   - Choose from default templates
   - Configure verification sources
   - Set confidence thresholds
   - Define aggregation logic

3. **Execution Monitoring**
   - Real-time execution history
   - Filter by outcome, escalation status
   - View source-level results
   - See execution timeline

4. **Analytics Dashboard**
   - Outcome distribution (YES/NO/Escalated)
   - Confidence distribution
   - Execution success rates
   - Performance metrics

5. **Source Configuration**
   - Add/remove sources from workflows
   - Set weights and timeouts
   - Configure method-specific settings
   - Preview workflow execution plan

---

## Database Schema

### `verification_workflows` Table
```sql
CREATE TABLE verification_workflows (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_category VARCHAR(50),
  config JSONB,  -- { steps, globalTimeout, escalationThreshold }
  enabled BOOLEAN,
  is_default BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `workflow_executions` Table
```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY,
  event_id UUID,
  workflow_id UUID,
  outcome VARCHAR(20),  -- yes, no, uncertain, escalated
  confidence NUMERIC,   -- 0-100
  execution_time INTEGER,
  mismatch_detected BOOLEAN,
  escalated BOOLEAN,
  sources JSONB,  -- source results
  evidence JSONB,  -- evidence trail
  created_at TIMESTAMP
);
```

---

## Setup Instructions

### 1. Run Database Migration
```bash
cd supabase

# Apply migration 029
docker exec -i polymarket-postgres psql -U postgres -d polymarket \
  < migrations/029_create_verification_workflows.sql
```

### 2. Deploy API Routes
The following files are created:
- `src/app/api/workflows/route.ts` - GET/POST
- `src/app/api/workflows/[id]/route.ts` - GET/PUT/DELETE
- `src/app/api/workflows/execute/route.ts` - POST (execute), GET (history)
- `src/app/api/workflows/stats/route.ts` - GET (statistics)

### 3. Create Admin Page
- `src/app/sys-cmd-7x9k2/workflows-advanced/page.tsx` - Dashboard

### 4. Test System
```bash
# Start development server
cd apps/web
npm run dev

# Navigate to admin dashboard
# http://localhost:3000/sys-cmd-7x9k2/workflows-advanced

# Log in as admin
# Create a workflow
# Execute on test event
# View execution history and stats
```

---

## Implementation Steps (Sequential)

### Phase 1: Database (1 hour)
- [ ] Run migration 029 to create tables
- [ ] Verify RLS policies are enabled
- [ ] Test database connectivity

### Phase 2: API Routes (2 hours)
- [ ] Create `/api/workflows/route.ts`
- [ ] Create `/api/workflows/[id]/route.ts`
- [ ] Create `/api/workflows/execute/route.ts`
- [ ] Create `/api/workflows/stats/route.ts`
- [ ] Test each endpoint with Postman/curl

### Phase 3: Admin Dashboard (3 hours)
- [ ] Create workflows-advanced page
- [ ] Build workflow list component
- [ ] Build create workflow dialog
- [ ] Build execution monitor
- [ ] Build analytics dashboard
- [ ] Style with Tailwind

### Phase 4: Integration (2 hours)
- [ ] Hook dashboard to API endpoints
- [ ] Add workflow execution trigger to event creation
- [ ] Wire statistics refresh
- [ ] Test complete flow

### Phase 5: Testing (2 hours)
- [ ] Test workflow creation
- [ ] Test execution on test event
- [ ] Verify escalation logic
- [ ] Check audit trails
- [ ] Performance test with multiple concurrent executions

### Phase 6: Deployment (1 hour)
- [ ] Push to GitHub
- [ ] Deploy to Vercel
- [ ] Verify in production
- [ ] Monitor error logs

---

## Advanced Usage

### Custom Verification Methods

To add a new verification method:

1. **Add to VerificationMethod type** in `WorkflowBuilder.ts`
2. **Implement executor function** in `UpstashOrchestrator.ts`
3. **Create API route** for the method (e.g., `/api/verification/custom`)
4. **Use in workflows** by setting `method: 'custom_method'`

### Conditional Workflows

Create separate workflows for different event categories and route at execution time:

```typescript
const workflowMap = {
  crypto: DEFAULT_WORKFLOWS.crypto,
  sports: DEFAULT_WORKFLOWS.sports,
  politics: DEFAULT_WORKFLOWS.politics,
  news: DEFAULT_WORKFLOWS.news,
};

const workflow = workflowMap[eventCategory] || DEFAULT_WORKFLOWS.news;
const result = await executeVerificationWorkflow(eventId, workflow.id, eventData);
```

### Chained Escalation

Create fallback chains for progressive escalation:

```
Step 1: Try AI Oracle + News
  ├─ If success (>85% confidence) → Resolve
  └─ If fails → Escalate to Step 2

Step 2: Try Expert Panel Voting
  ├─ If consensus (>60% votes) → Resolve
  └─ If fails → Escalate to Step 3

Step 3: Manual Admin Review
  └─ Admin decides outcome
```

---

## Monitoring & Maintenance

### View Workflow Statistics
```bash
# Check overall system stats
curl https://app.com/api/workflows/stats

# Check specific workflow performance
curl https://app.com/api/workflows/stats?id=default_crypto

# Date range analysis
curl "https://app.com/api/workflows/stats?startDate=2024-01-01&endDate=2024-01-31"
```

### Debug Executions
```bash
# View workflow execution history
curl "https://app.com/api/workflows/execute/history?workflowId=default_crypto&limit=100"

# Filter by outcome
curl "https://app.com/api/workflows/execute/history?outcome=escalated"

# Export for analysis
# Can build CSV export in admin dashboard
```

### Performance Optimization

1. **Timeout Scaling**
   - Increase sources' timeouts if regularly hitting limits
   - Decrease if response times are fast enough

2. **Confidence Tuning**
   - Lower `requiredConfidence` if too many escalations
   - Raise if false positives are high

3. **Source Weighting**
   - Increase weight of accurate sources
   - Decrease weight of unreliable sources
   - Based on execution history analysis

---

## Troubleshooting

### Workflow Always Escalates
- Lower `requiredConfidence` threshold
- Add more sources to increase consensus
- Check individual source endpoints are working
- Check source timeout values

### High Execution Times
- Reduce per-source timeout values
- Remove slow verification methods
- Use `first_success` logic instead of waiting for all

### Mismatch Detected Frequently
- Check source reliability (via stats)
- Add human review step
- Lower consensus requirements
- Adjust source weights

### Database Performance
- Run `VACUUM ANALYZE` on `workflow_executions` table
- Archive old executions (>90 days) to separate table
- Use pagination with `limit` parameter in API calls

---

## Security Considerations

1. **Authentication**: All admin routes require authenticated session
2. **Authorization**: Only admins can create/modify workflows
3. **Rate Limiting**: Consider adding rate limits to execute endpoint
4. **Audit Trail**: All actions logged with user and timestamp
5. **RLS Policies**: Database enforces access control

---

## Next Steps

After implementation:

1. **Create workflow templates** for common use cases
2. **Implement verification method APIs** (news consensus, sports APIs, etc.)
3. **Build alert system** for escalations
4. **Create analytics reports** for stakeholder dashboards
5. **Add A/B testing** of different workflow configurations
6. **Implement workflow versioning** for rollback capability

