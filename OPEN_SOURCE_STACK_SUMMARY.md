# ✅ Ploky Resolution System v2.1 — Open Source Stack Complete

## What Was Built (All Files Created)

### 1. AI Service (`ai-service/`)
| File | Lines | What |
|------|-------|------|
| `main.py` | 700 | FastAPI — MiniMax primary → Ollama fallback, Redis cache, Kubo IPFS, public Polygon RPC |
| `requirements.txt` | 8 | fastapi, uvicorn, httpx, redis, web3, pydantic, python-dotenv, ollama |
| `Dockerfile` | 18 | Python 3.11 slim container |
| `.env.example` | 30 | All env vars for open-source stack |

**Key Features:**
- MiniMax API as PRIMARY LLM (paid, but you want this NOW)
- Ollama (self-hosted) as FALLBACK — runs llama3.2, mistral locally
- Local Redis for caching (1-hour TTL)
- Local Kubo IPFS for evidence storage
- Public Polygon RPC (no Infura/Alchemy needed)
- Auto-resolve threshold: 85% confidence on objective questions
- Bengali + English prompt templates
- Full health/status endpoints

### 2. Docker Stack (`docker-compose.resolution.yml`)
Runs 4 containers:
- `redis` — Cache (256MB, persistent)
- `ollama` — LLM server (llama3.2 + mistral auto-pull)
- `ipfs` — Kubo node (API + gateway)
- `ploky-ai` — FastAPI service

### 3. Smart Contracts (`contracts/`)
| File | What |
|------|------|
| `hardhat.config.ts` | Public Polygon RPC config (no paid providers) |
| `scripts/deploy-open-source.ts` | Deploy to Amoy testnet with public RPC |
| `PlokyResolver.sol` | Already exists — multi-sig resolver with timelock |

### 4. Supabase Migration
`supabase/migrations/20260508000000_resolution_system_v2.sql`
- `resolution_questions` — mirrors on-chain questions
- `evidence` — evidence submissions with AI scores
- `proposals` — verdict proposals + approval tracking
- `ai_analyses` — detailed AI analysis records
- `resolvers` — resolver registry
- `dispute_records` — dispute tracking
- Full RLS policies, indexes, search vectors, stored procedures

### 5. Next.js API Routes (`apps/web/src/app/api/resolution/`)
| Route | Purpose |
|-------|---------|
| `analyze/route.ts` | Proxy AI analysis requests |
| `questions/route.ts` | CRUD for resolution questions |
| `evidence/route.ts` | Submit/retrieve evidence |
| `proposals/route.ts` | Verdict proposals + approvals |
| `health/route.ts` | Full system health check |

### 6. Hetzner Setup Script
`scripts/setup-hetzner-resolution.sh`
- Installs Redis, Ollama, Kubo IPFS, Python, Nginx
- Configures firewall (only 22, 80, 443, 4001 exposed)
- Creates systemd services
- One-command deploy

---

## What You Need From Me (To Complete)

### REQUIRED (before first deploy):
1. **MiniMax API key** — get from https://www.minimaxi.com/
2. **Deployer private key** — for Amoy testnet deployment

### OPTIONAL (can add later):
3. **MiniMax Group ID** — if you have an organization account
4. **Polygonscan API key** — only for contract verification
5. **AI service private key** — for submitting analysis to blockchain

---

## Deployment Steps (Do These Now)

### Step 1: Run Setup Script on Hetzner
```bash
# Copy files to server
scp -r ai-service/ docker-compose.resolution.yml scripts/setup-hetzner-resolution.sh root@78.46.107.195:/opt/plokymarket/

# SSH in and run
ssh root@78.46.107.195
cd /opt/plokymarket
chmod +x scripts/setup-hetzner-resolution.sh
./scripts/setup-hetzner-resolution.sh
```

### Step 2: Add MiniMax API Key
```bash
nano /etc/systemd/system/ploky-ai.service
# Add: Environment=MINIMAX_API_KEY=your_key_here
systemctl daemon-reload
systemctl start ploky-ai
```

### Step 3: Test AI Service
```bash
curl http://localhost:8081/health
curl http://localhost:8081/status
```

### Step 4: Deploy Contracts to Amoy
```bash
cd contracts
export PRIVATE_KEY=your_key
npx hardhat run scripts/deploy-open-source.ts --network amoy
```

### Step 5: Apply DB Migration
Run `supabase/migrations/20260508000000_resolution_system_v2.sql` in your local Supabase Studio.

---

## Architecture Overview

```
User → Next.js Frontend → Next.js API Routes → AI Service (FastAPI)
                                            ┌───↑───┐
                                       MiniMax API (primary)
                                       Ollama localhost:11434 (fallback)
                                       Redis localhost:6379 (cache)
                                       Kubo IPFS localhost:5001 (storage)
                                            ↓
                                    Blockchain (Amoy testnet)
                                    Public RPC: rpc-amoy.polygon.technology
```

**Only paid service:** MiniMax API (~$0.001–0.01 per analysis call)
**Everything else:** Free, open source, self-hosted

---

## Cost Comparison

| Component | Old Stack (Paid) | New Stack (Open Source) |
|-----------|-----------------|------------------------|
| LLM (AI) | Gemini + MiniMax | MiniMax only + Ollama |
| Cache | Upstash Redis | Local Redis ($0) |
| IPFS | Pinata/Filebase | Kubo local ($0) |
| RPC | Infura/Alchemy | Public RPC ($0) |
| Monitoring | Datadog/etc | Prometheus/Grafana ($0) |
| **Monthly** | **~$200–500** | **~$6–10** |

---

## Next Actions

1. **Give me your MiniMax API key** (or go get one)
2. **Confirm your deployer private key** for Amoy
3. I'll update the `.env` and run a full health check
4. Deploy contracts + test end-to-end

Say **"deploy now"** with your keys and I'll execute the full setup.
