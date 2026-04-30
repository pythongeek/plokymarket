# Plokymarket Docker Container Deployment Plan

## Overview

This document outlines all Docker containers required to run the Plokymarket prediction marketplace application, following the 4 key architectural rules for permanent, resilient containers.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "External Cloud Services"
        SUPABASE["Supabase Cloud<br/>(d3c0f0a88d3c4...)]
        UPSTASH_REDIS["Upstash Redis"]
        CRONJOBS["Vercel Cronjobs"]
        GEMINI["Google Gemini API"]
        VERCEL["Vercel Frontend + Cronjobs"]
    end

    subgraph "Docker Network: polymarket_plus_net"
        subgraph "Database Layer"
            POSTGRES["polymarket-postgres<br/>postgres:15-alpine"]
            POSTGREST["polymarket-postgrest<br/>postgrest:v12.0.1"]
        end

        subgraph "Workflow Automation"
            N8N_MAIN["polymarket-n8n-main<br/>n8n:1.70.0"]
            N8N_PLAYWRIGHT["polymarket-playwright<br/>browserless/chrome:latest"]
            N8N_P2P["polymarket-n8n-p2p<br/>n8n:1.70.0"]
        end

        subgraph "AI Services"
            KYC_AI["polymarket-kyc-ai<br/>FastAPI + PaddleOCR"]
        end
    end

    POSTGRES --> POSTGREST
    N8N_MAIN --> N8N_PLAYWRIGHT
    N8N_P2P --> UPSTASH_REDIS
    KYC_AI --> POSTGRES
    
    VERCEL --> SUPABASE
    N8N_MAIN --> CRONJOBS
```

---

## Complete Container List

### 1. Database Layer

| Container Name | Image | Purpose | Restart Policy | Data Volume |
|----------------|-------|---------|----------------|-------------|
| `polymarket-postgres` | `postgres:15-alpine` | PostgreSQL 15 database | `unless-stopped` | `supabase-data:/var/lib/postgresql/data` |
| `polymarket-postgrest` | `postgrest/postgrest:v12.0.1` | Auto-generated REST API | `unless-stopped` | None (stateless) |

### 2. Workflow Automation (n8n)

| Container Name | Image | Purpose | Restart Policy | Data Volume |
|----------------|-------|---------|----------------|-------------|
| `polymarket-n8n-main` | `docker.n8n.io/n8nio/n8n:1.70.0` | Main workflow engine | `unless-stopped` | `n8n_data:/home/node/.n8n` |
| `polymarket-playwright` | `browserless/chrome:latest` | Browser automation for scraping | `unless-stopped` | None (stateless) |
| `polymarket-n8n-p2p` | `n8nio/n8n:1.70.0` | Isolated P2P scraper | `unless-stopped` | `n8n_p2p_data:/home/node/.n8n` |

### 3. AI Services

| Container Name | Image | Purpose | Restart Policy | Data Volume |
|----------------|-------|---------|----------------|-------------|
| `polymarket-kyc-ai` | Custom Build (`./apps/ai-kyc`) | KYC document verification | `unless-stopped` | `./apps/ai-kyc/kyc.db` |

---

## External Services (NOT Docker - Cloud Hosted)

| Service | Purpose | Connection |
|---------|---------|------------|
| **Supabase Cloud** (`d3c0f0a88d3c4...`) | Production database, auth, realtime | Environment variables |
| **Upstash Redis** | Caching layer | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| **Google Gemini API** | AI oracle, content generation | `GEMINI_API_KEY` |
| **Vercel** | Frontend + Cronjobs hosting | GitHub integration |

---

## Vercel Cronjobs (NOT Docker - Serverless)

The following cronjobs run on Vercel's serverless infrastructure:

| Cronjob | Endpoint | Schedule | Purpose |
|---------|----------|----------|---------|
| Sync Orphaned Events | `/api/cron/sync-orphaned-events` | Daily 6:00 PM | Sync orphaned events |
| Dispute Workflow | `/api/dispute-workflow` | Daily 6:00 PM | Process disputes |
| Leaderboard | `/api/leaderboard/cron` | Daily 6:00 PM | Update leaderboard rankings |
| Cleanup Deposits | `/api/workflows/cleanup-expired` | Daily 6:00 PM | Cleanup expired deposits |
| Daily Report | `/api/workflows/daily-report` | Daily 9:00 AM | Generate daily reports |
| News Market | `/api/workflows/execute-news` | Daily 12:00 AM | Execute news market workflows |
| Batch Markets | `/api/cron/batch-markets` | Weekly (Sat 11:00 PM) | Create batch markets |
| AI Topics | `/api/cron/daily-ai-topics` | Daily 6:00 AM | Generate daily AI topics |
| Analytics | `/api/workflows/analytics/daily` | Daily 11:00 PM | Run analytics |
| Auto Verify | `/api/workflows/auto-verify` | Daily 11:00 PM | Auto-verify markets |
| Escalations | `/api/workflows/check-escalations` | Daily 11:00 PM | Check escalations |
| Crypto Market | `/api/workflows/execute-crypto` | Weekly (Sat 12:00 PM) | Execute crypto markets |
| Sports | `/api/workflows/execute-sports` | Weekly (Sat 12:00 PM) | Execute sports markets |
| Market Close | `/api/workflows/market-close-check` | Weekly (Thu 8:00 AM) | Check market closures |
| Price Snapshot | `/api/workflows/price-snapshot` | Weekly (Wed 6:00 AM) | Snapshot prices |
| Exchange Rate | `/api/workflows/update-exchange-rate` | Weekly (Thu 8:00 AM) | Update exchange rates |

---

## Architectural Rules Applied

### Rule 1: Restart Policy (`unless-stopped`)

All containers use `restart: unless-stopped` to ensure auto-healing:

```yaml
restart: unless-stopped
```

This ensures containers auto-restart after:
- Server reboot
- Container crash
- Docker daemon restart

**Exception:** Containers will NOT restart if manually stopped with `docker stop`.

### Rule 2: Image Version Pinning

All images use specific version tags (NOT `:latest`):

| Wrong (Unsafe) | Correct (Pinned) |
|----------------|------------------|
| `postgres:latest` | `postgres:15-alpine` |
| `n8n:latest` | `n8nio/n8n:1.70.0` |
| `chrome:latest` | `browserless/chrome:latest` |

### Rule 3: Docker Volumes for Data Persistence

Named volumes ensure data survives container recreation:

```yaml
volumes:
  supabase-data:
    name: polymarket-supabase-data
  n8n_data:
    name: polymarket-n8n-data
  n8n_p2p_data:
    name: polymarket-n8n-p2p-data
```

### Rule 4: Network Isolation

All containers use a dedicated bridge network:

```yaml
networks:
  polymarket_plus_net:
    name: polymarket_plus_net
    driver: bridge
```

---

## Deployment Strategy for New Windows PC

### Prerequisites

1. **Docker Desktop for Windows**
   - Enable WSL 2 backend
   - Allocate 4GB+ RAM minimum

2. **Required Ports (must be available)**

   | Port | Service |
   |------|---------|
   | 5432 | PostgreSQL |
   | 3000 | PostgREST API |
   | 5678 | n8n Main |
   | 3001 | Browserless Chrome |
   | 5680 | n8n P2P |
   | 8000 | KYC AI Service |

### Quick Start Commands

```bash
# 1. Clone repository
git clone https://github.com/your-repo/plokymarket.git
cd plokymarket

# 2. Create .env file
cp .env.example .env
# Edit .env with your credentials

# 3. Start all containers
docker-compose up -d

# 4. Verify containers are running
docker ps --filter "name=polymarket-"

# 5. Check container health
docker-compose ps
```

### Container Startup Order

```mermaid
sequenceDiagram
    participant Docker as Docker Daemon
    participant Postgres as polymarket-postgres
    participant PostgREST as polymarket-postgrest
    participant N8N as polymarket-n8n-main
    participant Playwright as polymarket-playwright
    participant KYC as polymarket-kyc-ai

    Docker->>Postgres: Start (restart: unless-stopped)
    Postgres->>Postgres: Initialize database
    Postgres->>Docker: Health check passed
    Docker->>PostgREST: Start (depends_on: postgres)
    PostgREST->>Docker: Ready
    Docker->>N8N: Start
    Docker->>Playwright: Start
    Docker->>KYC: Start (depends_on: postgres)
```

---

## Docker Compose File Structure

### Main docker-compose.yml (Root Project)

```yaml
version: '3.8'

services:
  # Database Layer
  postgres:
    image: postgres:15-alpine
    container_name: polymarket-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: polymarket
    volumes:
      - supabase-data:/var/lib/postgresql/data
    networks:
      - polymarket_plus_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgrest:
    image: postgrest/postgrest:v12.0.1
    container_name: polymarket-postgrest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/polymarket
      PGRST_DB_SCHEMAS: public
      PGRST_DB_ANON_ROLE: anon
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - polymarket_plus_net

  # n8n Main Instance
  n8n:
    image: docker.n8n.io/n8nio/n8n:1.70.0
    container_name: polymarket-n8n-main
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://your-domain.com/
      - GENERIC_TIMEZONE=Asia/Dhaka
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - polymarket_plus_net

  # Browserless Chrome for Scraping
  n8n-playwright:
    image: browserless/chrome:latest
    container_name: polymarket-playwright
    restart: unless-stopped
    environment:
      - MAX_CONCURRENT_SESSIONS=10
    networks:
      - polymarket_plus_net

  # n8n P2P Scraper Instance
  n8n-p2p:
    image: n8nio/n8n:1.70.0
    container_name: polymarket-n8n-p2p
    restart: unless-stopped
    ports:
      - "5680:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_P2P_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_P2P_BASIC_AUTH_PASSWORD}
      - NODE_FUNCTION_ALLOW_EXTERNAL=axios,cheerio,puppeteer
      - BINANCE_AFFILIATE_CODE=${BINANCE_AFFILIATE_CODE}
      - GENERIC_TIMEZONE=Asia/Dhaka
    volumes:
      - n8n_p2p_data:/home/node/.n8n
    networks:
      - polymarket_plus_net

  # AI-KYC Service
  kyc-ai:
    build:
      context: ./apps/ai-kyc
      dockerfile: Dockerfile
    container_name: polymarket-kyc-ai
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
    networks:
      - polymarket_plus_net

volumes:
  supabase-data:
    name: polymarket-supabase-data
  n8n_data:
    name: polymarket-n8n-data
  n8n_p2p_data:
    name: polymarket-n8n-p2p-data

networks:
  polymarket_plus_net:
    name: polymarket_plus_net
    driver: bridge
```

---

## Safety Rules - DO NOT TOUCH

### ❌ NEVER run these commands on this server:

```bash
# These will DESTROY all data and containers
docker system prune -a --volumes
docker-compose down -v
docker container prune
docker volume prune
```

### ✅ Safe commands for maintenance:

```bash
# View running containers (safe)
docker ps --filter "name=polymarket-"

# View all containers including stopped (safe)
docker ps -a --filter "name=polymarket-"

# Restart a specific container (safe)
docker restart polymarket-postgres

# View logs (safe)
docker logs polymarket-n8n-main --tail 100

# Stop a container (container will auto-restart due to restart: unless-stopped)
docker stop polymarket-n8n-main
```

---

## Container Identification

| Container ID Hash | Container Name | Purpose |
|-------------------|----------------|---------|
| `d3c0f0a88d3c4...` | **Supabase Cloud** | External production database (DO NOT MODIFY - cloud hosted) |
| `polymarket-*` | Local containers | All local Docker containers follow this naming |

---

## Troubleshooting

### Check container status:
```bash
docker ps --filter "name=polymarket-"
```

### Check container logs:
```bash
docker logs polymarket-n8n-main --tail 50 -f
```

### Restart a specific container:
```bash
docker restart polymarket-postgres
```

### Verify volume data persists:
```bash
docker volume ls --filter "name=polymarket"
```

### Network connectivity test:
```bash
docker exec polymarket-n8n-main ping polymarket-postgres
```

---

## Next Steps

1. [ ] Copy this `docker-compose.yml` to your new Windows PC
2. [ ] Ensure Docker Desktop is running with WSL 2 backend
3. [ ] Create `.env` file with required credentials
4. [ ] Run `docker-compose up -d`
5. [ ] Verify all containers are healthy with `docker ps`
6. [ ] Access services at their respective ports