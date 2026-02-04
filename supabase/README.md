# Polymarket Local Supabase Setup

## Quick Start

### 1. Copy Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and set your password:
```env
POSTGRES_PASSWORD=your_secure_password
```

### 2. Start PostgreSQL
```bash
cd supabase
docker-compose up -d postgres
```

### 3. Wait for PostgreSQL to be ready
```bash
# Check if PostgreSQL is ready
docker logs polymarket-postgres --follow
```

### 4. Initialize Database Schema
```bash
# Connect to PostgreSQL and run the schema
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/init.sql
```

### 5. Apply Matching Engine Functions
```bash
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/matching_engine.sql
```

### 6. Start PostgREST (Optional - for REST API)
```bash
docker-compose up -d postgrest
```

## Access Points

| Service | URL | Port |
|---------|-----|------|
| PostgreSQL | localhost:5433 | 5433 |
| PostgREST API | http://localhost:3000 | 3000 |

## Connect with psql
```bash
psql -h localhost -p 5433 -U postgres -d polymarket
```

## Stop Services
```bash
docker-compose down
```

## Database Schema

The database includes:
- **users** - Extended user profiles
- **wallets** - User balances
- **markets** - Prediction markets
- **orders** - Limit and market orders
- **trades** - Completed trades
- **positions** - User positions in markets
- **transactions** - Wallet transactions
- **oracle_verifications** - AI verification results
- **payment_transactions** - Payment history

## Matching Engine

The matching engine is implemented as PostgreSQL functions:
- `match_order(p_order_id UUID)` - Matches a new order against existing orders
- `update_position(...)` - Updates user positions
- `process_trade_settlement(...)` - Settles trades between buyer and seller
- `settle_market(p_market_id, p_winning_outcome)` - Settles a resolved market

## Next Steps

After setting up the database:
1. Configure the frontend environment variables
2. Run the matching engine migrations
3. Start the frontend development server
