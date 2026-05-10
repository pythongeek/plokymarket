# Ploky Resolution System v2.1 — Open Source Stack
# প্লোকি রিজলুশন সিস্টেম v2.1 — ওপেন সোর্ছ স্ট্যাক

**Stack:** MiniMax API (paid) + Ollama (self-hosted) | Redis (local) | Kubo IPFS (local) | Public Polygon RPC
**Timeline:** 1–2 days for AI service, 2–3 days for full integration
**Cost:** ~$0/month infrastructure (only MiniMax API usage)

---

## Architecture

```
Frontend (Next.js)
    ↓
Next.js API Routes (/api/resolution/*)
    ↓
AI Service (FastAPI) — localhost:8081
    ┌────────────────────────────────────────┬───────────────────────────┬───────────────┐
    ↓ Primary              ↓ Fallback           ↓ Storage
MiniMax API              Ollama (local)       Redis (local)
ollama:11434             llama3.2/mistral     redis:6379
    ↓                      ↓
Analysis Results ────────→ IPFS Kubo (local)
                         ipfs:5001/8080
    ↓
Blockchain (Amoy/Polygon)
Public RPC (free)
```

---

## Phase 1: AI Service Deployment (Day 1)

### Step 1.1: Run Setup Script on Hetzner

```bash
# SSH into Hetzner .195
ssh root@204.168.167.195

# Copy setup script
cd /opt
git clone https://github.com/your-repo/plokymarket.git
cd plokymarket

# Run setup
chmod +x scripts/setup-hetzner-resolution.sh
./scripts/setup-hetzner-resolution.sh
```

This installs:
- Redis (cache)
- Ollama (self-hosted LLM: llama3.2, mistral)
- Kubo IPFS (evidence storage)
- Python + dependencies
- Nginx reverse proxy
- Firewall rules

### Step 1.2: Configure Environment

```bash
# Edit AI service environment
nano /etc/systemd/system/ploky-ai.service

# Add your MiniMax API key (get from minimaxi.com)
Environment=MINIMAX_API_KEY=your_key_here
Environment=MINIMAX_GROUP_ID=your_group_id

# If contracts deployed, add:
# Environment=PLKY_RESOLVER_ADDRESS=0x...
# Environment=AI_SERVICE_PRIVATE_KEY=0x...

# Reload and start
systemctl daemon-reload
systemctl start ploky-ai

# Verify
systemctl status ploky-ai
curl http://localhost:8081/health
curl http://localhost:8081/status
```

### Step 1.3: Test AI Service

```bash
# Test analysis endpoint
curl -X POST http://localhost:8081/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": "test-001",
    "title": "Will Bangladesh win the next cricket match?",
    "description": "Bangladesh vs India T20 match",
    "category": "sports",
    "tier": 1,
    "evidence": [],
    "news_urls": []
  }'

# Test with MiniMax disabled (forces Ollama fallback)
# Temporarily remove MINIMAX_API_KEY and restart
```

---

## Phase 2: Smart Contract Deploy (Day 1-2)

### Step 2.1: Install Hardhat + OpenZeppelin

```bash
cd contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify dotenv typescript ts-node
npm install @openzeppelin/contracts
npx hardhat init  # Choose “Create a TypeScript project”
```

### Step 2.2: Deploy to Amoy Testnet

```bash
# Get Amoy MATIC from faucet:
# https://amoy.polygonscan.com/faucet

# Set private key
export PRIVATE_KEY=your_private_key

# Deploy
npx hardhat run scripts/deploy-open-source.ts --network amoy

# Output:
# PlokyToken: 0x...
# PlokyResolver: 0x...
```

### Step 2.3: Update Environment

```bash
# Add contract addresses to AI service
systemctl edit ploky-ai --full
# Add: Environment=PLKY_RESOLVER_ADDRESS=0x...
# Add: Environment=AI_SERVICE_PRIVATE_KEY=0x...

# Add to Next.js .env
# NEXT_PUBLIC_RESOLVER_ADDRESS=0x...
# NEXT_PUBLIC_PLKY_ADDRESS=0x...
# AI_SERVICE_URL=http://localhost:8081
```

---

## Phase 3: Database Migration (Day 1)

### Step 3.1: Apply Supabase Migration

```bash
# Using Supabase CLI
supabase migration up

# Or run SQL directly in Supabase Studio SQL Editor
cat supabase/migrations/20260508000000_resolution_system_v2.sql | psql ...
```

### Step 3.2: Verify Tables

```sql
-- Check tables created
\dt resolution_questions
\dt evidence
\dt proposals
\dt ai_analyses
\dt resolvers
\dt dispute_records

-- Test insert
INSERT INTO resolution_questions (title, description, category, tier)
VALUES ('Test Question', 'Test description', 'general', 0);
```

---

## Phase 4: Frontend API Integration (Day 2)

### Step 4.1: API Routes Already Created

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/resolution/analyze` | POST | Proxy to AI service |
| `/api/resolution/questions` | GET/POST | List/create questions |
| `/api/resolution/evidence` | GET/POST | Submit/retrieve evidence |
| `/api/resolution/proposals` | GET/POST/PATCH | Verdict proposals |
| `/api/resolution/health` | GET | System health check |

### Step 4.2: Connect Frontend to AI Service

```typescript
// In your .env.local
AI_SERVICE_URL=http://127.0.0.1:8081
NEXT_PUBLIC_RESOLVER_ADDRESS=0x...

// Use the API routes
const analyze = async (questionData) => {
  const res = await fetch('/api/resolution/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questionData)
  });
  return res.json();
};
```

---

## Phase 5: Docker Deployment (Alternative)

Instead of manual setup, use Docker Compose:

```bash
# Copy docker-compose.resolution.yml to server
scp docker-compose.resolution.yml root@204.168.167.195:/opt/plokymarket/

# On server
cd /opt/plokymarket

# Create .env file
cat > .env << 'EOF'
MINIMAX_API_KEY=your_key_here
MINIMAX_GROUP_ID=your_group_id
OLLAMA_MODEL=llama3.2
OLLAMA_FALLBACK_MODEL=mistral
PLKY_RESOLVER_ADDRESS=
AI_SERVICE_PRIVATE_KEY=
EOF

# Start everything
docker compose -f docker-compose.resolution.yml up -d

# View logs
docker compose logs -f ploky-ai
docker compose logs -f ollama

# Pull additional models
docker exec ploky-ollama ollama pull llama3.2
docker exec ploky-ollama ollama pull mistral
```

---

## Service Status Commands

```bash
# Check all services
systemctl status redis-server
systemctl status ollama
systemctl status ipfs
systemctl status ploky-ai

# View logs
journalctl -u ploky-ai -f
tail -f /opt/plokymarket/ai-resolution/logs/*.log

# Restart services
systemctl restart ploky-ai
systemctl restart ollama

# Test endpoints
curl http://localhost:8081/health
curl http://localhost:11434/api/tags
curl http://localhost:5001/api/v0/id
```

---

## Cost Breakdown (Open Source)

| Service | Cost | Why |
|---------|------|-----|
| Hetzner VPS | ~$6/month | Already paying |
| Redis | $0 | Self-hosted |
| Ollama/LLM | $0 | Self-hosted (CPU) |
| IPFS Kubo | $0 | Self-hosted |
| Polygon RPC | $0 | Public endpoint |
| MiniMax API | ~$0.001–0.01/call | Only paid service |
| **Total** | **~$6–10/month** | vs $200+ with paid stack |

---

## Troubleshooting

### Ollama model download fails
```bash
# Manually pull models
ollama pull llama3.2
ollama pull mistral

# Check GPU availability (optional)
ollama run llama3.2  # Test interactive
```

### IPFS not accessible
```bash
# Check IPFS daemon
ipfs daemon &
ipfs id

# Test add/cat
echo "test" | ipfs add
ipfs cat <cid>
```

### MiniMax API errors
```bash
# Check if key is set
echo $MINIMAX_API_KEY

# Test MiniMax directly
curl https://api.minimaxi.chat/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-Text-01","messages":[{"role":"user","content":"Hello"}]}'
```

### AI service won't start
```bash
# Check Python deps
source /opt/plokymarket/ai-resolution/venv/bin/activate
pip list | grep -E "fastapi|uvicorn|httpx|redis|web3|ollama"

# Test manually
cd /opt/plokymarket/ai-resolution
python -c "from main import app; print('OK')"
```

---

## File Reference

| File | Purpose |
|------|---------|
| `ai-service/main.py` | FastAPI AI service (MiniMax → Ollama fallback) |
| `ai-service/requirements.txt` | Python dependencies |
| `ai-service/Dockerfile` | Container build |
| `ai-service/.env.example` | Environment template |
| `docker-compose.resolution.yml` | Full stack orchestration |
| `contracts/PlokyResolver.sol` | Resolution smart contract |
| `contracts/hardhat.config.ts` | Network config (public RPC) |
| `contracts/scripts/deploy-open-source.ts` | Deploy script |
| `supabase/migrations/20260508_resolution_system_v2.sql` | DB schema |
| `scripts/setup-hetzner-resolution.sh` | Server setup script |
| `apps/web/src/app/api/resolution/*/route.ts` | Next.js API routes |

---

*Version: 2.1.0 | Open Source Stack | Updated: May 2026*
