# Supabase Local Docker Stack

## Overview

This configuration provides a complete Supabase stack running in Docker for local development. It includes all Supabase services with proper isolation to not affect existing containers.

## Files

| File | Purpose |
|------|---------|
| `docker-compose.supabase.yml` | Complete Supabase stack configuration |
| `.env.supabase.example` | Environment variables template |
| `volumes/kong.yml` | Kong API Gateway configuration |

## Containers (13 Total)

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| supabase-postgres | postgres:15-alpine | 5432 | PostgreSQL 15 database |
| supabase-kong | kong:2.8.1 | 8000/8001 | API Gateway |
| supabase-gotrue | supabase/gotrue:v2.99.0 | 9999 | Authentication |
| supabase-postgres-meta | supabase/postgres-meta:v0.68.0 | 8081 | Metadata REST API |
| supabase-realtime | supabase/realtime:v2.25.50 | 4000 | Realtime WebSocket |
| supabase-storage-api | supabase/storage-api:v0.43.11 | 5000 | File storage API |
| supabase-imgproxy | darthsim/imgproxy:v3.8 | 5001 | Image transformations |
| supabase-studio | supabase/studio:v20231010 | 3001 | Admin UI |
| supabase-functions | supabase/edge-runtime:v1.22.4 | 3002 | Edge functions |
| supabase-logflare | supabase/logflare:v1.1.0 | 4001 | Logging |
| supabase-postgrest | postgrest/postgrest:v11.2.0 | 3000 | REST API |
| supabase-inbucket | inbucket/inbucket:v3.0.3 | 9000/2500 | Email testing |

## Quick Start

```bash
# 1. Navigate to supabase folder
cd supabase

# 2. Copy environment file
copy .env.supabase.example .env

# 3. Generate keys
# Run these commands to generate secure keys:
# openssl rand -base64 32

# 4. Start all containers
docker-compose -f docker-compose.supabase.yml up -d

# 5. Check status
docker-compose -f docker-compose.supabase.yml ps

# 6. View logs
docker-compose -f docker-compose.supabase.yml logs -f
```

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| Kong Gateway | http://localhost:8000 | 8000 |
| PostgREST API | http://localhost:3000/rest/v1 | 3000 |
| GoTrue Auth | http://localhost:9999/auth/v1 | 9999 |
| Storage API | http://localhost:5000/storage/v1 | 5000 |
| Postgres Meta | http://localhost:8081/meta/v1 | 8081 |
| Realtime | http://localhost:4000/realtime/v1 | 4000 |
| Studio UI | http://localhost:3001 | 3001 |
| Edge Functions | http://localhost:3002/functions/v1 | 3002 |
| Inbucket Email | http://localhost:9000 | 9000 |

## Protection Features

### Permanent Containers
- **restart: unless-stopped** on all containers
- **Named volumes** with `supabase-` prefix
- **Health checks** on all services
- **Labels** for identification

### DO NOT RUN (Data Loss)
```bash
docker-compose -f docker-compose.supabase.yml down -v    # Removes volumes!
docker system prune -a                                 # Removes ALL
docker volume prune                                    # Removes volumes
```

### Safe Commands
```bash
# View running containers
docker ps --filter "name=supabase-"

# Restart a container
docker restart supabase-postgres

# View logs
docker logs supabase-postgres --tail 100 -f

# Check health
docker inspect supabase-postgres --format='{{.State.Health.Status}}'
```

## Container Naming

All containers use `supabase-` prefix to avoid conflicts:
- `supabase-postgres` (not `polymarket-postgres`)
- `supabase-kong` (API gateway)
- `supabase-gotrue` (auth)
- etc.

## Volumes

| Volume | Purpose |
|--------|---------|
| `supabase-postgres-data` | Database files |
| `supabase-storage-data` | Uploaded files |
| `supabase-logs-data` | Log data |
| `supabase-inbucket-data` | Email storage |

## Network

- Network name: `supabase-network`
- Subnet: `172.30.0.0/16`
- Isolated from other Docker networks

## Linking to Vercel/Supabase Cloud

To link this local instance to remote Supabase Cloud:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# Push local schema to remote
supabase db push

# Pull remote schema to local
supabase db pull
```

## Stopping

```bash
# Stop all containers
docker-compose -f docker-compose.supabase.yml stop

# Start again
docker-compose -f docker-compose.supabase.yml start

# Full stop and remove containers (NOT volumes)
docker-compose -f docker-compose.supabase.yml down
```

## Troubleshooting

### Postgres won't start
```bash
docker logs supabase-postgres
# Check if port 5432 is in use
netstat -an | grep 5432
```

### Kong 502 Bad Gateway
```bash
# Ensure postgres is healthy
docker inspect supabase-postgres --format='{{.State.Health.Status}}'
# Restart kong
docker restart supabase-kong
```

### Storage not working
```bash
# Check storage API logs
docker logs supabase-storage-api
# Check imgproxy logs
docker logs supabase-imgproxy
```

## Documentation

- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Kong Configuration](https://docs.konghq.com/)
