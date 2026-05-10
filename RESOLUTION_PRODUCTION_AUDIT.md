# Ploky Resolution v2.1 — Production Audit

## Status: NOT PRODUCTION READY

---

## 🔴 CRITICAL (Deploy = Break / Lose Money)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | **Corrupted API key line** `MINIMAX_API_KEY=os.get...` — truncated, will crash | `ai-service/main.py:34` | Rewrite line properly |
| 2 | **No auth on AI service** — anyone can call /analyze, drain MiniMax credits | `ai-service/main.py` | Add API key middleware |
| 3 | **CORS `allow_origins=["*"]`** — any site can hit your AI | `ai-service/main.py` | Restrict to your domain |
| 4 | **No rate limiting** — single user can spam /analyze, burn $$$ | `ai-service/main.py` | Add slowapi or custom rate limiter |
| 5 | **Docker `--reload` in production** — memory leak, slow, insecure | `ai-service/Dockerfile:20` | Remove `--reload` |
| 6 | **API routes missing auth** — anyone can create questions, proposals | `api/resolution/*/route.ts` | Add `requireAuth()` check |
| 7 | **Proposal race condition** — concurrent PATCH can double-count approvals | `api/resolution/proposals/route.ts:156` | Use DB transaction or atomic increment |
| 8 | **Resolver check uses `.single()`** — crashes if 2+ resolvers exist | `api/resolution/proposals/route.ts:65` | Use `.maybeSingle()` or check by user ID |
| 9 | **Contract: no access control on `createQuestion`** — anyone can spam | `PlokyResolverLite.sol:116` | Add role check or bond requirement |
| 10 | **Hardcoded gas 300000** — may fail on network congestion | `ai-service/main.py:~610` | Use `estimateGas` + buffer |

---

## 🟠 HIGH (Security Risk / Bad UX)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 11 | **No input validation** — SQL injection via title/description possible | `api/resolution/questions/route.ts` | Add zod schema validation |
| 12 | **No retry for MiniMax** — one network blip = failed analysis | `ai-service/main.py` | Add 3-retry with backoff |
| 13 | **No IPFS fallback** — IPFS down = analysis lost | `ai-service/main.py` | Store in DB + IPFS async |
| 14 | **Blockchain tx not awaited** — `send_raw_transaction` may fail silently | `ai-service/main.py:~619` | Add receipt polling |
| 15 | **No health check for Polygon RPC** — dead RPC = silent failures | `ai-service/main.py` | Add RPC health endpoint |
| 16 | **Redis down = no cache = hammer MiniMax** — $$$ burn | `ai-service/main.py` | Add circuit breaker |
| 17 | **Ollama models not version-pinned** — `llama3.2` may change | `docker-compose.resolution.yml` | Pin digest or version tag |
| 18 | **No request logging** — can't debug production issues | `ai-service/main.py` | Add structured logging (JSON) |
| 19 | **No alert on AI service down** — users see 500, no one knows | All | Add webhook/PagerDuty alert |
| 20 | **DB migration: `auth.users(id)`** — breaks if not using Supabase Auth | `20260508_resolution_system_v2.sql` | Make optional or use custom users table |

---

## 🟡 MEDIUM (Missing Features / Debt)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 21 | **No frontend components** — API exists, no UI | Missing | Build ResolutionDashboard, EvidenceViewer |
| 22 | **No event webhook** — resolution happens, frontend doesn't know | Missing | Add Supabase realtime or webhook |
| 23 | **No cache warming** — first request always slow | `ai-service/main.py` | Pre-analyze upcoming markets |
| 24 | **No backup for Redis** — cache lost on restart | `docker-compose.resolution.yml` | Add Redis AOF persistence |
| 25 | **Contract not verified on Polygonscan** — users can't verify code | Missing | Add `npx hardhat verify` step |
| 26 | **No admin panel for resolvers** — can't manage who resolves | Missing | Add /admin/resolvers CRUD |
| 27 | **Missing Bengali UI labels** — you wanted dual-lang | All frontend | Add i18n |
| 28 | **No load balancing** — single AI service instance | `docker-compose.resolution.yml` | Add nginx upstream or k8s |
| 29 | **No graceful shutdown** — requests dropped on restart | `ai-service/main.py` | Handle SIGTERM |
| 30 | **No test suite** — no confidence changes don't break things | Missing | Add pytest + hardhat tests |

---

## What's Actually Working

| Component | Status | Notes |
|-----------|--------|-------|
| AI service code | ✅ Structure OK | Needs security fixes |
| MiniMax client | ✅ Correct endpoint | Needs retry logic |
| Ollama fallback | ✅ Chain works | Needs version pinning |
| Redis cache | ✅ TTL works | Needs persistence |
| IPFS client | ✅ Local Kubo | Needs fallback |
| DB schema | ✅ Tables created | Needs auth.users fix |
| API routes | ✅ CRUD works | Needs auth + validation |
| Contracts (local) | ✅ Deployed | Amoy blocked by MATIC |
| Docker compose | ✅ Runs | Needs prod hardening |
| Hetzner setup script | ✅ Complete | Untested on .195 |

---

## Fix Priority Order

### Phase 1 (Before any deploy)
1. Fix corrupted API key line in main.py
2. Add auth middleware to AI service
3. Remove `--reload` from Dockerfile
4. Fix CORS to your domain only
5. Add rate limiting

### Phase 2 (Before production)
6. Add auth checks to API routes
7. Fix proposal race condition
8. Add input validation (zod)
9. Add MiniMax retry logic
10. Add request logging

### Phase 3 (Before public launch)
11. Build frontend components
12. Add event webhooks
13. Add admin panel
14. Add test suite
15. Verify contracts on Polygonscan

---

## Time Estimate

| Phase | Time | Cost |
|-------|------|------|
| Phase 1 (Critical fixes) | 2-3 hours | $0 |
| Phase 2 (Security hardening) | 1 day | $0 |
| Phase 3 (Frontend + polish) | 3-5 days | $0 |
| **Total to production** | **~1 week** | **$0 infra** |

---

## Decision

**Current state: Demo/Local test only**

**Can deploy to Hetzner for internal testing?** YES — after Phase 1 fixes (2-3 hours)

**Can show to users?** NO — needs Phase 2 + frontend (1 week)

**Say "fix critical" and I'll do Phase 1 now.**
