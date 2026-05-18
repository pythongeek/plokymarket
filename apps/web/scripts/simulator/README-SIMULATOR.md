# PlokySimulator — End-to-End Testing Engine

> ⚠️ **Scope: EXTERNAL** — This simulator lives completely outside the main `plokymarket` codebase. It does not modify any project files.

## What It Does

1. **Creates 5–10 synthetic users** with Supabase Auth + wallets pre-funded with $1,000
2. **Spins up a live prediction market** (10-minute duration by default)
3. **Simulates realistic betting** — market/limit orders, YES/NO, various position sizes, different trader personas (whale, hedger, degen, etc.)
4. **Triggers the PostgreSQL matching engine** (`match_order`) after each order
5. **Waits for market expiry** then **resolves** with a random oracle verdict
6. **Executes settlement** (`settle_market`) and verifies profit/loss distribution
7. **Runs stress tests** — double-spend attempts, zero-amount orders, overdrafts, invalid market IDs
8. **Generates a JSON audit report** with every log entry, user P&L, and system-wide consistency checks

## Quick Start

```bash
# 1. Create a folder outside your project
cd /tmp
mkdir ploky-simulator && cd ploky-simulator

# 2. Copy the files
cp /path/to/ploky-simulator.ts .
cp /path/to/package.json .
cp /path/to/.env.example .env

# 3. Edit .env with your Supabase service_role key
nano .env

# 4. Install & run
npm install
npm run sim
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | `http://localhost:54321` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **Required.** Bypasses RLS. Never commit this. |
| `SIMULATION_DURATION_MINUTES` | `10` | How long the market stays open |
| `USER_COUNT` | `8` | Number of simulated traders (3–20) |
| `INITIAL_BALANCE` | `1000` | Starting USDC per wallet |
| `ENABLE_STRESS_TEST` | `true` | Run edge-case attack simulations |
| `LOG_TO_FILE` | `true` | Save full JSON report to disk |

## Fast Mode (for CI/CD)

```bash
SIMULATION_DURATION_MINUTES=1 USER_COUNT=5 npm run sim
```

## Interpreting Results

The console output shows:
- **Phase-by-phase execution** with timestamps
- **User P&L table** — who won, who lost, by how much
- **System drift check** — verifies conservation of money (total balances should equal initial capital ± fees)
- **Inconsistency counter** — orphaned orders, failed settlements, etc.

The JSON report (`simulation-report-<timestamp>.json`) contains every log entry with full context for debugging.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `Matching engine error` | `match_order` function signature differs | Check your PostgreSQL function params |
| `Profile insert failed` | `users` table schema mismatch | Adjust column names in the script |
| `Wallet insert failed` | Column `available_balance` vs `balance` | Script auto-retries alt schema |
| `settle_market` not found | Function missing in Supabase | Run `supabase/migrations` first |
| Drift > $0.01 | Settlement bug or fees not tracked | Expected if house fees exist |
