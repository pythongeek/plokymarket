# Advanced Workflows - Quick Testing Guide

After deployment, use this guide to verify the system works correctly.

---

## Pre-Testing Setup (Run Once)

```bash
# 1. Start development server
cd apps/web
npm run dev

# 2. Get admin authentication token
# Login at http://localhost:3000
# Open browser DevTools → Application → Cookies → session or supabase token

# 3. Keep this for API calls below
export ADMIN_TOKEN="your_token_here"
```

---

## Test 1: API Endpoints (5 minutes)

### 1.1 List Workflows
```bash
curl http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response:
# {
#   "success": true,
#   "count": 6,
#   "workflows": [
#     { "id": "default_crypto", "name": "Cryptocurrency Price Verification", ... },
#     ...
#   ]
# }
```

**Result**: ✅ Pass / ❌ Fail

### 1.2 Create Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Testing the system",
    "eventCategory": "crypto",
    "sources": [
      { "method": "api_price_feed", "weight": 100, "timeout": 10000 }
    ]
  }'

# Expected response: 201 with created workflow

# Save the ID for later tests
export WORKFLOW_ID="<id_from_response>"
```

**Result**: ✅ Pass / ❌ Fail

### 1.3 Get Specific Workflow
```bash
curl http://localhost:3000/api/workflows/default_crypto \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Full workflow config with execution history
```

**Result**: ✅ Pass / ❌ Fail

### 1.4 Get Statistics
```bash
curl http://localhost:3000/api/workflows/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Statistics with totalExecutions, yesCount, noCount, etc.
```

**Result**: ✅ Pass / ❌ Fail

### 1.5 Execute Workflow
```bash
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test-event-123",
    "workflowId": "default_crypto",
    "eventData": {
      "question": "Will BTC be above $50000?",
      "category": "crypto"
    }
  }'

# Expected: 200 with result object:
# {
#   "success": true,
#   "result": {
#     "outcome": "yes" | "no" | "uncertain" | "escalated",
#     "confidence": 85,
#     "sources": { ... },
#     "executionTime": 12500
#   }
# }
```

**Result**: ✅ Pass / ❌ Fail

### 1.6 Get Execution History
```bash
curl "http://localhost:3000/api/workflows/execute/history?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Array of execution objects
```

**Result**: ✅ Pass / ❌ Fail

---

## Test 2: Admin Dashboard (10 minutes)

### 2.1 Access Dashboard
1. Open http://localhost:3000/sys-cmd-7x9k2/workflows-advanced
2. Should see dashboard with no errors
3. **Expected**: 
   - Header: "Advanced Verification Workflows"
   - Three tabs: Workflows, Presets, Monitoring
   - Stats cards showing counts

**Result**: ✅ Pass / ❌ Fail

### 2.2 List Workflows
1. Click "Workflows" tab
2. Should see list of workflows
3. Should see 6 default workflows
4. Should see any custom workflows created

**Result**: ✅ Pass / ❌ Fail

### 2.3 Create Workflow
1. Click "Create Workflow" button
2. Fill in form:
   - Name: "Dashboard Test"
   - Description: "Testing from dashboard"
   - Category: Select "crypto"
3. Click "Use Template" on any template
4. Click "Create Workflow"
5. **Expected**: Toast message "Workflow created successfully"
6. Should appear in workflows list

**Result**: ✅ Pass / ❌ Fail

### 2.4 View Workflow Details
1. Find created workflow in list
2. Click view button (eye icon)
3. Should see full config and execution history

**Result**: ✅ Pass / ❌ Fail

### 2.5 Enable/Disable Workflow
1. Click disable button on a workflow
2. Badge should change to "Disabled"
3. Click enable
4. Badge should change back to "Active"

**Result**: ✅ Pass / ❌ Fail

### 2.6 Duplicate Workflow
1. Click duplicate button (copy icon)
2. Should see success message
3. New workflow with "(Copy)" suffix should appear

**Result**: ✅ Pass / ❌ Fail

### 2.7 View Presets
1. Click "Presets" tab
2. Should see all 6 default workflows
3. Each should show description and sources
4. Click "Use Template" button
5. Should create copy of template

**Result**: ✅ Pass / ❌ Fail

### 2.8 View Monitoring
1. Click "Monitoring" tab
2. Should see stats cards with numbers
3. Should see bar chart (outcomes)
4. Should see confidence distribution
5. Charts should render without errors

**Result**: ✅ Pass / ❌ Fail

---

## Test 3: Workflow Execution (15 minutes)

### 3.1 Execute Simple Workflow
```bash
# Use curl to execute default_crypto
export TEST_EVENT_ID="test-$(date +%s)"

curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$TEST_EVENT_ID\",
    \"workflowId\": \"default_crypto\",
    \"eventData\": {
      \"question\": \"Will BTC be above \$50,000?\",
      \"category\": \"crypto\"
    }
  }"

# Should return success with outcome
```

**Result**: ✅ Pass / ❌ Fail

### 3.2 Check Execution Stored
```bash
# Wait 2 seconds, then check if execution was stored
sleep 2

curl "http://localhost:3000/api/workflows/execute/history?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Should show the execution we just created
```

**Result**: ✅ Pass / ❌ Fail

### 3.3 Execute Custom Workflow
```bash
# Execute the workflow we created
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"test-custom-$(date +%s)\",
    \"workflowId\": \"$WORKFLOW_ID\",
    \"eventData\": {
      \"question\": \"Test question?\",
      \"category\": \"crypto\"
    }
  }"

# Should execute without errors
```

**Result**: ✅ Pass / ❌ Fail

### 3.4 Check Stats Update
```bash
# Check if stats were updated with new executions
curl "http://localhost:3000/api/workflows/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Should show totalExecutions > 0
```

**Result**: ✅ Pass / ❌ Fail

---

## Test 4: Error Handling (10 minutes)

### 4.1 Invalid Workflow ID
```bash
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "test",
    "workflowId": "invalid-id",
    "eventData": { "question": "test" }
  }'

# Expected: 500 or 404 error (workflow not found)
```

**Result**: ✅ Pass / ❌ Fail

### 4.2 Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "eventId": "test" }'

# Expected: 400 Bad Request
```

**Result**: ✅ Pass / ❌ Fail

### 4.3 Unauthorized Access
```bash
curl http://localhost:3000/api/workflows

# Expected: 401 Unauthorized
```

**Result**: ✅ Pass / ❌ Fail

### 4.4 Non-Admin Access
```bash
# Use a non-admin token (regular user)
curl http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $USER_TOKEN"

# Expected: 403 Forbidden
```

**Result**: ✅ Pass / ❌ Fail

### 4.5 Delete Default Workflow (Should Fail)
```bash
curl -X DELETE http://localhost:3000/api/workflows/default_crypto \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: 400 Bad Request with error "Cannot delete default workflows"
```

**Result**: ✅ Pass / ❌ Fail

---

## Test 5: Database (5 minutes)

### 5.1 Verify Tables Exist
```bash
# Connect to local database
docker exec -it polymarket-postgres psql -U postgres -d polymarket -c "\dt verification_*"

# Expected output:
# List of relations
#                         Name                       |  Type   | Owner
# 
# verification_workflows                             | table   | postgres
# workflow_executions                                | table   | postgres
```

**Result**: ✅ Pass / ❌ Fail

### 5.2 Check RLS Enabled
```bash
docker exec -it polymarket-postgres psql -U postgres -d polymarket -c "SELECT relname, relrowsecurity FROM pg_class WHERE relname LIKE 'verification_%' OR relname LIKE 'workflow_%';"

# Expected: relrowsecurity should be 't' (true) for both tables
```

**Result**: ✅ Pass / ❌ Fail

### 5.3 Verify Data Stored
```bash
docker exec -it polymarket-postgres psql -U postgres -d polymarket -c "SELECT COUNT(*) FROM workflow_executions;"

# Expected: Should show count > 0 if executions were stored
```

**Result**: ✅ Pass / ❌ Fail

### 5.4 Check Indexes
```bash
docker exec -it polymarket-postgres psql -U postgres -d polymarket -c "SELECT * FROM pg_indexes WHERE tablename LIKE 'workflow_%' OR tablename LIKE 'verification_%';"

# Expected: Should list all indexes created (created_at, workflow_id, outcome, etc.)
```

**Result**: ✅ Pass / ❌ Fail

---

## Test 6: Performance (10 minutes)

### 6.1 Execution Time
```bash
# Measure execution time
time curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "perf-test-1",
    "workflowId": "default_crypto",
    "eventData": { "question": "test", "category": "crypto" }
  }'

# Expected: Should complete in < 60 seconds (development mode may be slower)
```

**Result**: ✅ Pass / ❌ Fail

### 6.2 API Response Time
```bash
# Measure API list response time
time curl http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Should be < 500ms
```

**Result**: ✅ Pass / ❌ Fail

### 6.3 Dashboard Load Time
```bash
# Open browser DevTools → Network tab
# Navigate to http://localhost:3000/sys-cmd-7x9k2/workflows-advanced
# Check load time (DOMContentLoaded)

# Expected: < 3 seconds
```

**Result**: ✅ Pass / ❌ Fail

---

## Final Verification Checklist

### Core Functionality
- [ ] All 7 API endpoints respond correctly
- [ ] Admin dashboard loads without errors
- [ ] Workflows can be created, edited, deleted
- [ ] Workflow executions are recorded
- [ ] Statistics update correctly
- [ ] Default workflows cannot be modified or deleted
- [ ] Non-admin users get 403 errors

### Data Integrity
- [ ] Executions stored in database
- [ ] Results match workflow configuration
- [ ] Confidence values are calculated correctly
- [ ] Evidence is captured in audit trail

### Error Handling
- [ ] Invalid requests return appropriate errors
- [ ] Unauthenticated requests get 401
- [ ] Non-admin requests get 403
- [ ] Invalid workflow ID returns 404
- [ ] Missing fields return 400

### Performance
- [ ] API endpoints respond < 500ms
- [ ] Dashboard loads < 3 seconds
- [ ] Workflow execution < 60 seconds (development)
- [ ] No database connection issues

### Security
- [ ] Authentication required for all endpoints
- [ ] Admin check enforced
- [ ] RLS policies prevent data leakage
- [ ] Default workflows protected

---

## Troubleshooting

### API Returns 500
→ Check browser console and terminal for errors  
→ Verify database migration was applied  
→ Check authentication token is valid  

### Dashboard Won't Load
→ Check Network tab in DevTools for failed requests  
→ Verify all API routes are created  
→ Check console for TypeScript errors  

### Workflows Not Executing
→ Verify workflow ID is correct  
→ Check event data is valid JSON  
→ See logs in terminal for execution errors  

### Database Errors
→ Verify migration 029 was applied  
→ Check tables exist: `\dt verification_*`  
→ Verify RLS policies: `\dRs verification_*`  

### Authentication Issues
→ Verify token is valid: doesn't expire  
→ Check Authorization header format: `Bearer {token}`  
→ Verify user is admin: check `users` table `is_admin` column  

---

## Success Criteria

**All tests pass** if:
- ✅ All 7 API endpoints return 200 OK
- ✅ Dashboard loads and displays data
- ✅ Can create, read, update, delete workflows
- ✅ Executions are recorded and stats update
- ✅ Default workflows are protected
- ✅ All error cases handled correctly
- ✅ Both authenticated and unauthorized requests handled
- ✅ Performance is acceptable (<500ms API, <3s dashboard)

---

## Next Steps After Testing

1. **If all tests pass**:
   - System is ready for production
   - Proceed with deployment checklist
   - Train team on using workflows

2. **If some tests fail**:
   - Check error messages carefully
   - Review troubleshooting section
   - Fix issues and re-test
   - Contact development team if needed

---

## Quick Commands Reference

```bash
# List all workflows
curl http://localhost:3000/api/workflows -H "Authorization: Bearer $TOKEN"

# Create workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "...", "eventCategory": "...", "sources": [...] }'

# Execute workflow
curl -X POST http://localhost:3000/api/workflows/execute \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "eventId": "...", "workflowId": "...", "eventData": {...} }'

# Get stats
curl http://localhost:3000/api/workflows/stats \
  -H "Authorization: Bearer $TOKEN"

# Get history
curl "http://localhost:3000/api/workflows/execute/history?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Access dashboard
http://localhost:3000/sys-cmd-7x9k2/workflows-advanced
```

---

**Testing Complete!** 🎉

If all tests pass, proceed with production deployment.

