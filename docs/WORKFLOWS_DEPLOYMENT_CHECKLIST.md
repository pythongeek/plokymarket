# Advanced Workflows - Deployment Checklist

## Pre-Deployment (Day 1)

### Code Review
- [ ] Review all 4 API route files for security issues
- [ ] Check TypeScript types in WorkflowBuilder.ts
- [ ] Verify error handling in UpstashOrchestrator.ts
- [ ] Audit database migration for SQL injection
- [ ] Check dashboard component for XSS vulnerabilities

### Testing
- [ ] Run `npm run build` (should succeed)
- [ ] Run `npm run lint` (should pass)
- [ ] Unit test WorkflowBuilder functions
- [ ] Unit test aggregation logic functions
- [ ] Integration test workflow execution
- [ ] Test admin dashboard UI
- [ ] Test API endpoints with Postman

### Documentation Review
- [ ] Review ADVANCED_WORKFLOWS_GUIDE.md for accuracy
- [ ] Review WORKFLOWS_QUICK_REFERENCE.md
- [ ] Check database schema documentation
- [ ] Verify API endpoint documentation

---

## Database Setup (Day 1 - Evening)

### Local Development
```bash
# [ ] 1. Apply migration to local database
cd supabase
docker exec -i polymarket-postgres psql -U postgres -d polymarket < migrations/029_create_verification_workflows.sql

# [ ] 2. Verify tables exist
docker exec -i polymarket-postgres psql -U postgres -d polymarket -c "\dt verification_*"

# [ ] 3. Test RLS policies
# [ ] 4. Seed default workflows (optional)
```

### Staging Environment
- [ ] Create backup of staging database
- [ ] Apply migration to staging
- [ ] Verify migration success
- [ ] Test RLS in staging
- [ ] Load test with 100+ concurrent workflows

---

## Code Deployment (Day 2 - Morning)

### GitHub & Vercel
```bash
# [ ] 1. Commit all changes
git add apps/web/src/app/api/workflows/
git add apps/web/src/app/sys-cmd-7x9k2/workflows-advanced/
git add supabase/migrations/029_create_verification_workflows.sql
git add docs/ADVANCED_WORKFLOWS_GUIDE.md
git add docs/WORKFLOWS_QUICK_REFERENCE.md
git commit -m "feat: Add advanced verification workflows system"

# [ ] 2. Push to GitHub
git push origin main

# [ ] 3. Vercel deployment
# - Automatically triggers on push
# - Check build logs for errors
# - Wait for production deployment

# [ ] 4. Verify deployment
# - Test API endpoints: curl https://polymarket-bangladesh.vercel.app/api/workflows
# - Check admin dashboard: https://.../sys-cmd-7x9k2/workflows-advanced
```

### Vercel Environment
- [ ] Set deployment preview domains
- [ ] Enable analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up performance monitoring

---

## Production Database Migration (Day 2 - Afternoon)

### Supabase Cloud
```sql
-- [ ] 1. Create backup
-- (Do this in Supabase dashboard: Project → Backups → Create Backup)

-- [ ] 2. Connect to production database
-- In Supabase Web Editor or via psql:

-- [ ] 3. Run migration 029
-- (Copy entire migration file into Supabase SQL editor)

-- [ ] 4. Verify tables created
SELECT * FROM information_schema.tables 
WHERE table_name LIKE 'verification%' OR table_name LIKE 'workflow%';

-- [ ] 5. Check RLS policies enabled
SELECT * FROM pg_class WHERE relname = 'verification_workflows';
```

### Data Validation
- [ ] Verify table row counts: `SELECT COUNT(*) FROM verification_workflows;`
- [ ] Check index creation: `SELECT * FROM pg_indexes WHERE tablename LIKE 'verification_%';`
- [ ] Test RLS: Create test user and verify they can't see admin workflows
- [ ] Performance test: Insert 1000 test rows into workflow_executions

---

## API Testing (Day 2 - Evening)

### Endpoint Testing
```bash
# [ ] GET /api/workflows - List workflows
curl https://polymarket-bangladesh.vercel.app/api/workflows \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# [ ] POST /api/workflows - Create workflow
curl -X POST https://polymarket-bangladesh.vercel.app/api/workflows \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Test", "eventCategory": "crypto", "sources": [...] }'

# [ ] GET /api/workflows/[id] - Get specific workflow
curl https://polymarket-bangladesh.vercel.app/api/workflows/default_crypto \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# [ ] PUT /api/workflows/[id] - Update workflow
curl -X PUT https://polymarket-bangladesh.vercel.app/api/workflows/workflow-id \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{ "enabled": false }'

# [ ] DELETE /api/workflows/[id] - Delete custom workflow
curl -X DELETE https://polymarket-bangladesh.vercel.app/api/workflows/custom-id \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# [ ] POST /api/workflows/execute - Execute workflow
curl -X POST https://polymarket-bangladesh.vercel.app/api/workflows/execute \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{ "eventId": "event-id", "workflowId": "workflow-id", "eventData": {...} }'

# [ ] GET /api/workflows/execute/history - Get history
curl https://polymarket-bangladesh.vercel.app/api/workflows/execute/history \
  -H "Authorization: Bearer {ADMIN_TOKEN}"

# [ ] GET /api/workflows/stats - Get statistics
curl https://polymarket-bangladesh.vercel.app/api/workflows/stats \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### Error Testing
- [ ] Test with invalid event data
- [ ] Test with non-existent workflow ID
- [ ] Test with unauthenticated request
- [ ] Test with non-admin user
- [ ] Test with missing required fields
- [ ] Test with malformed JSON

---

## Admin Dashboard Testing (Day 3 - Morning)

### Dashboard Access
- [ ] Login as admin user
- [ ] Navigate to `/sys-cmd-7x9k2/workflows-advanced`
- [ ] Should see dashboard with stats

### Feature Testing
- [ ] [ ] **List Workflows**
  - [ ] Default workflows visible
  - [ ] Custom workflows visible
  - [ ] Filters work (category, enabled)
  - [ ] Pagination works

- [ ] **Create Workflow Dialog**
  - [ ] Dialog opens
  - [ ] Can enter name and description
  - [ ] Can select category
  - [ ] Can choose template
  - [ ] Templates load correctly
  - [ ] Workflow creates successfully

- [ ] **Workflow Management**
  - [ ] Can enable/disable workflow
  - [ ] Can duplicate workflow
  - [ ] Can view workflow details
  - [ ] Can delete custom workflow
  - [ ] Cannot delete default workflow

- [ ] **Monitoring Tab**
  - [ ] Charts render correctly
  - [ ] YES/NO/Escalated bars show
  - [ ] Confidence distribution displays
  - [ ] Statistics auto-refresh

- [ ] **Presets Tab**
  - [ ] All 6 defaults visible
  - [ ] Can use template button
  - [ ] Description accurate

### UI/UX Tests
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Dark mode (if applicable)
- [ ] Accessibility (tab order, labels)
- [ ] Load time < 3 seconds

---

## Integration Testing (Day 3 - Afternoon)

### End-to-End Workflows
```typescript
// [ ] Test complete flow:
// 1. Create event in markets table
// 2. Create custom workflow via API
// 3. Execute workflow on event
// 4. Verify result stored in workflow_executions
// 5. Check stats updated
// 6. View in admin dashboard
```

### Workflow Execution
- [ ] Crypto workflow executes successfully
- [ ] Sports workflow executes successfully
- [ ] Politics workflow executes successfully
- [ ] News workflow executes successfully
- [ ] Expert panel workflow (manual)
- [ ] Community voting workflow (manual)

### Data Integrity
- [ ] Outcomes recorded correctly
- [ ] Confidence values make sense
- [ ] Execution times reasonable
- [ ] Evidence chain preserved
- [ ] Audit trails complete

### Load Testing
- [ ] Execute 10 workflows concurrently
- [ ] Execute 50 workflows over 2 minutes
- [ ] Check database doesn't get overwhelmed
- [ ] Check API response times stay acceptable
- [ ] No race conditions

---

## Monitoring & Alerting (Day 3 - Evening)

### Set Up Monitoring
- [ ] Configure Sentry for error tracking
- [ ] Set up Vercel Analytics
- [ ] Configure database monitoring (Supabase)
- [ ] Set up logging (CloudWatch or similar)
- [ ] Create alerts for:
  - [ ] API errors > 1%
  - [ ] Workflow execution > 10 seconds
  - [ ] Database connection pool exhausted
  - [ ] Escalation rate > 10%

### Dashboard Setup
- [ ] Create admin monitoring dashboard
- [ ] Add workflow success rate metric
- [ ] Add execution time percentiles (p50, p95, p99)
- [ ] Add source reliability scores
- [ ] Set up daily email report

---

## Documentation Deployment (Day 3 - Evening)

### Internal Team
- [ ] Share ADVANCED_WORKFLOWS_GUIDE.md
- [ ] Share WORKFLOWS_QUICK_REFERENCE.md
- [ ] Hold team training (1 hour)
  - [ ] How to create workflows
  - [ ] How to use presets
  - [ ] How to interpret results
  - [ ] Troubleshooting common issues

### External/Public (if applicable)
- [ ] Update API documentation website
- [ ] Create public API reference
- [ ] Add code examples to developer docs
- [ ] Post to developer blog

### Support
- [ ] Create FAQ document
- [ ] Set up support email
- [ ] Create issue tracking for bugs
- [ ] Prepare hotfix procedures

---

## Post-Deployment (Day 4 - Day 7)

### Monitoring
- [ ] Daily check of error logs
- [ ] Daily review of execution stats
- [ ] Check that no critical errors occurring
- [ ] Monitor database performance
- [ ] Review user feedback
- [ ] Check Sentry for new issues

### Optimization
- [ ] Analyze slow workflow executions
- [ ] Identify unreliable verification methods
- [ ] Adjust confidence thresholds based on data
- [ ] Optimize database queries if needed
- [ ] Fine-tune timeouts based on real execution times

### Scaling
- [ ] If traffic increases:
  - [ ] Scale database read replicas
  - [ ] Enable caching for frequently used workflows
  - [ ] Consider workflow result caching
  - [ ] Monitor API rate limits

### Bug Fixes
- [ ] Fix any reported issues
- [ ] Update documentation based on feedback
- [ ] Add error handling for edge cases
- [ ] Patch security vulnerabilities immediately

---

## Rollback Plan (If Needed)

### Immediate Rollback (< 5 minutes)
```bash
# [ ] 1. Revert deployment in Vercel
# Go to Vercel Dashboard → Deployments → Previous Version → Promote

# [ ] 2. Monitor error rate drops
# [ ] 3. Notify team
```

### Database Rollback (1-2 hours)
```bash
# [ ] 1. Restore database from backup
# (In Supabase Dashboard → Backups → Restore)

# [ ] 2. Deploy previous code version
# [ ] 3. Verify data integrity
```

### Partial Rollback
- [ ] Disable new workflows via feature flag
- [ ] Keep database changes
- [ ] Deploy fixed version incrementally

---

## Sign-Off

### Team Lead Checklist
- [ ] All testing completed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring in place
- [ ] Rollback plan tested

**Approve Date**: _______________  
**Approver Name**: _______________

### Post-Deployment Review (Day 5)
**Meeting Date**: _______________

Attendees:
- [ ] System Administrator
- [ ] Database Administrator
- [ ] Lead Engineer
- [ ] Product Manager
- [ ] Support Lead

Agenda:
- [ ] Deployment success review
- [ ] Metrics and performance review
- [ ] Issues encountered and solutions
- [ ] Learnings and improvements
- [ ] Action items for next iteration

---

## Quick Reference Links

- **Admin Dashboard**: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows-advanced
- **API Docs**: `/docs/ADVANCED_WORKFLOWS_GUIDE.md`
- **Quick Reference**: `/docs/WORKFLOWS_QUICK_REFERENCE.md`
- **GitHub**: https://github.com/.../apps/web/src/app/api/workflows
- **Vercel Dashboard**: https://vercel.com/login
- **Supabase Dashboard**: https://app.supabase.com

---

## Emergency Contacts

**System Down**: [Emergency Contact #1]  
**Database Issues**: [Emergency Contact #2]  
**API Issues**: [Emergency Contact #3]  
**Escalation**: [On-Call Manager]

