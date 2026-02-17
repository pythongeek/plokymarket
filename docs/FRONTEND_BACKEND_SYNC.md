# Frontend-Backend Synchronization Guide

## Overview

This document describes the complete synchronization between the Plokymarket frontend and backend systems for production deployment.

## Architecture

### 1. Type System (`src/types/database.ts`)

Comprehensive TypeScript types that mirror the database schema:

- **Core Entities**: Events, Markets, Orders, Trades, Positions
- **Workflow System**: VerificationWorkflow, WorkflowExecution, WorkflowAnalyticsDaily
- **Resolution System**: ResolutionSystem, AIResolutionPipeline
- **Expert Panel**: ExpertPanel, ExpertVote, ExpertAssignment
- **Social Features**: Comments, Followers, Watchlist, Notifications
- **Support Tables**: AdminActivityLog, AIDailyTopic, AITrustScore

### 2. State Management

#### Market Store (`src/store/marketStore.ts`)
- **Purpose**: Manage market/event data with real-time updates
- **Features**:
  - Infinite scroll pagination
  - Category/status filtering
  - Search functionality
  - Real-time subscriptions
  - Optimistic updates
  - Persistent state

#### Workflow Store (`src/store/workflowStore.ts`)
- **Purpose**: Manage verification workflows and executions
- **Features**:
  - Workflow CRUD operations
  - Execution monitoring
  - Schedule management
  - Real-time execution tracking
  - Analytics and statistics

### 3. Service Layer

#### Events Service (`src/services/events.ts`)
- Fetch events with filtering and pagination
- Real-time event subscriptions
- Admin operations (resolve, pause, feature)
- Analytics queries

#### Workflow Service (`src/services/workflows.ts`)
- Workflow CRUD operations
- Execution management
- QStash schedule integration
- Analytics fetching

### 4. UI Components

#### Event Components
- `EventCard`: Display individual market cards with real-time prices
- `EventList`: Grid/list view with infinite scroll and filters

#### Workflow Components
- `WorkflowDashboard`: Admin dashboard for workflow management
- `WorkflowExecutionList`: Monitor execution status and logs
- `WorkflowScheduleManager`: Manage QStash schedules

### 5. Real-Time Subscriptions

Supabase Realtime is used for:
- Event price updates
- Order book changes
- Workflow execution status
- New trade notifications

## Database Schema Integration

### Migrations Synchronized

1. **029_create_verification_workflows.sql**
   - `verification_workflows` table
   - `workflow_executions` table
   - `workflow_analytics_daily` table

2. **093_manual_event_system.sql**
   - Enhanced `events`/`markets` table
   - `resolution_systems` table
   - `ai_resolution_pipelines` table

3. **088_expert_panel_system.sql**
   - `expert_panel` table
   - `expert_votes` table
   - `expert_assignments` table

4. **combined_089_090.sql**
   - `dispute_records` table
   - `manual_review_queue` table
   - `ai_trust_scores` table

5. **091_admin_activity_logs.sql**
   - `admin_activity_logs` table

6. **092_ai_daily_topics_system.sql**
   - `ai_daily_topics` table
   - `admin_ai_settings` table

## API Integration

### Supabase Client Configuration

```typescript
// Browser client for client-side operations
const browserClient = createBrowserClient<Database>(url, key, {
  auth: { autoRefreshToken: true, persistSession: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

// Server client for SSR
const serverClient = createServerClient<Database>(url, key, {
  cookies: { /* cookie handling */ }
});
```

### QStash Workflow Integration

Scheduled endpoints:
- `/api/workflows/execute-crypto` - Every 5 minutes
- `/api/workflows/execute-sports` - Every 10 minutes
- `/api/workflows/execute-news` - Every 15 minutes
- `/api/workflows/check-escalations` - Every 5 minutes
- `/api/workflows/analytics/daily` - Daily at midnight

## Production Checklist

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# QStash
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Database Setup

1. Run all migrations in order:
   ```bash
   # Apply migrations 001-093
   supabase db push
   ```

2. Enable RLS policies on all tables

3. Set up realtime publications:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE events;
   ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;
   ALTER PUBLICATION supabase_realtime ADD TABLE trades;
   ```

### QStash Schedule Setup

1. Navigate to `/admin/workflows` in the app
2. Click "Create Defaults" to create all 5 schedules
3. Verify schedules in Upstash Console

### Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Performance Optimizations

### Implemented
- Zustand with Immer for immutable state updates
- React Query for server state caching
- Virtual scrolling for large lists
- Optimistic updates for better UX
- Debounced search inputs
- Lazy loading of components

### Recommended
- Enable Supabase connection pooling
- Use Redis for session caching
- Implement CDN for static assets
- Enable gzip compression
- Use Next.js Image optimization

## Error Handling

### Global Error Boundary
- Catches React errors
- Shows user-friendly error UI
- Logs errors in production
- Provides retry options

### Loading States
- Global loading overlay
- Skeleton screens for cards/lists
- Inline spinners for buttons
- Progress indicators for long operations

## Security Considerations

### RLS Policies
All tables have Row Level Security enabled with policies for:
- Authenticated users can only access their own data
- Admin users have elevated privileges
- Public data is read-only for anonymous users

### API Security
- Rate limiting on auth endpoints
- CSRF protection
- Secure cookie settings
- Input validation on all forms

## Monitoring

### Recommended Tools
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance monitoring
- **Supabase Dashboard**: Database metrics

### Key Metrics to Monitor
- API response times
- Real-time subscription health
- Workflow execution success rate
- Error rates by endpoint

## Troubleshooting

### Common Issues

1. **Real-time subscriptions not working**
   - Check Supabase realtime is enabled
   - Verify RLS policies allow SELECT
   - Check browser console for errors

2. **Workflow executions failing**
   - Check QStash schedules are created
   - Verify API endpoints return 200
   - Check workflow execution logs

3. **Build errors**
   - Ensure all env vars are set
   - Check TypeScript types match schema
   - Verify all imports are correct

### Debug Mode

Enable debug logging:
```typescript
// In browser console
localStorage.setItem('debug', 'plokymarket:*');
```

## Next Steps

1. **Testing**
   - Unit tests for stores
   - Integration tests for API
   - E2E tests for critical flows

2. **Features to Add**
   - Advanced analytics dashboard
   - Mobile app (React Native)
   - WebSocket order book
   - Push notifications

3. **Scaling**
   - Implement read replicas
   - Add caching layer (Redis)
   - Use CDN for global distribution
   - Implement database sharding
