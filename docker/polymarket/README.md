# Plokymarket Docker - Central Configuration

## Overview

This folder contains the central Docker configuration for Plokymarket's self-hosted components. All containers here are part of the `polymarket` project and are designed for **production persistence and stability**.

## Container Architecture

```
┌─────────────────────────────────────────────────────────┐
│              polymarket-network (bridge)                 │
│                      172.28.0.0/16                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  postgres   │  │  postgrest  │  │    kyc-ai   │   │
│  │  polymarket │  │  polymarket │  │  polymarket │   │
│  │  -port 5432 │  │  -port 3000 │  │  -port 8000 │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐                     │
│  │ prometheus  │  │   (future)  │                     │
│  │  optional   │  │             │                     │
│  └─────────────┘  └─────────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Containers

| Container | Image | Port | Purpose | Protection |
|----------|-------|------|---------|------------|
| polymarket-postgres | postgres:15-alpine | 5432 | PostgreSQL 15 Database | Critical |
| polymarket-postgrest | postgrest:v12.0.1 | 3000 | Auto REST API | High |
| polymarket-kyc-ai | Custom FastAPI | 8000 | KYC Document OCR | High |

## Quick Start

```bash
# 1. Navigate to this folder
cd docker/polymarket

# 2. Copy environment file
copy .env.example .env

# 3. Create data directories
mkdir -p data/postgres data/kyc

# 4. Start containers
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f
```

## Protection Features

### Physical Protection
- **Named Volumes**: `polymarket-postgres-data`, `polymarket-kyc-data`
- **Host Bind Mounts**: Data stored in `./data/` directory
- **Restart Policy**: `unless-stopped` on all containers
- **Health Checks**: All containers have health monitoring

### Deletion Protection
```bash
# ⚠️ DANGER: These commands will DESTROY data
# DO NOT RUN on this server:

docker-compose down -v        # Removes volumes!
docker system prune -a        # Removes ALL unused images/containers
docker volume prune           # Removes ALL volumes
docker container prune        # Removes stopped containers
```

### Safe Commands
```bash
# View running containers (safe)
docker ps --filter "name=polymarket-"

# View all containers including stopped (safe)
docker ps -a --filter "name=polymarket-"

# Restart a specific container (safe)
docker restart polymarket-postgres

# View logs (safe)
docker logs polymarket-postgres --tail 100 -f

# Check volume exists (safe)
docker volume ls --filter "name=polymarket"
```

## Data Persistence

All data is stored in the `./data/` directory:

```
docker/polymarket/
├── data/
│   ├── postgres/          # PostgreSQL data files
│   │   └── (PostgreSQL stores data here)
│   └── kyc/              # KYC SQLite database
│       └── kyc.db
├── docker-compose.yml
├── .env
└── .env.example
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | polymarket_secure_pass_2024 | PostgreSQL password |
| `PGRST_JWT_SECRET` | (must be set) | JWT signing secret |
| `POLYMARKET_DATA_PATH` | ./data | Path for data volumes |

## Ports

| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| PostgreSQL | 5432 | 5432 | localhost:5432 |
| PostgREST | 3000 | 3000 | localhost:3000 |
| KYC AI | 8000 | 8000 | localhost:8000 |

## Health Checks

All containers have health checks configured:

```bash
# Check health status
docker inspect polymarket-postgres --format='{{.State.Health.Status}}'
docker inspect polymarket-postgrest --format='{{.State.Health.Status}}'
docker inspect polymarket-kyc-ai --format='{{.State.Health.Status}}'
```

## Troubleshooting

### PostgreSQL won't start
```bash
# Check logs
docker logs polymarket-postgres

# Check if port is in use
netstat -an | grep 5432

# Reset database (⚠️ DESTRUCTIVE)
rm -rf data/postgres/*
docker restart polymarket-postgres
```

### PostgREST returns 404
```bash
# Ensure postgres is healthy
docker inspect polymarket-postgres --format='{{.State.Health.Status}}'

# Check connection string
docker exec polymarket-postgrest env | grep PGRST
```

### KYC AI won't start
```bash
# Check if Dockerfile exists
ls -la ../../apps/ai-kyc/

# Build manually
docker build -t polymarket-kyc-ai ../../apps/ai-kyc/
```

## N8N Automation (Separate)

**Note**: N8N automation workflows are in the `automation/` folder and run separately. This central polymarket Docker setup does NOT include n8n to avoid duplication.

For n8n automation, see:
- `automation/docker-compose.yml` - Main n8n instance
- `automation/docker-compose.p2p.yml` - P2P scraper instance

## Backup

To backup data:

```bash
# Backup PostgreSQL
docker exec polymarket-postgres pg_dump -U postgres polymarket > backup_$(date +%Y%m%d).sql

# Backup KYC data
cp -r data/kyc data/kyc_backup_$(date +%Y%m%d)
```

## Restore

To restore data:

```bash
# Restore PostgreSQL
cat backup_20240101.sql | docker exec -i polymarket-postgres psql -U postgres polymarket

# Restore KYC data
cp -r data/kyc_backup_20240101/* data/kyc/
```

## Maintenance

### Update Images
```bash
cd docker/polymarket
docker-compose pull
docker-compose up -d
```

### Clean Logs
```bash
docker-compose logs --tail=1000 > logs_$(date +%Y%m%d).txt
echo "" > $(docker inspect --format='{{.LogPath}}' polymarket-postgres)
```

## Support

For issues or questions, refer to:
- Main project: `plans/docker_deployment_plan.md`
- Full inventory: `plans/production_containers_workflows_inventory.md`
