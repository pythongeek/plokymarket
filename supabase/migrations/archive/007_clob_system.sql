-- Order Book Table
CREATE TABLE order_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price DECIMAL(36, 18) NOT NULL,
  size DECIMAL(36, 18) NOT NULL,
  filled DECIMAL(36, 18) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'FILLED', 'CANCELED')),
  order_type VARCHAR(20) DEFAULT 'LIMIT' CHECK (order_type IN ('LIMIT', 'MARKET')),
  time_in_force VARCHAR(10) DEFAULT 'GTC',
  post_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize for Matching Engine Retrieval (Price-Time Priority)
-- For Bids (BUY): we need Highest Price first, then Earliest Time
CREATE INDEX idx_order_book_market_side_price_desc_created_asc 
ON order_book(market_id, side, price DESC, created_at ASC) 
WHERE status IN ('OPEN', 'PARTIAL');

-- For Asks (SELL): we need Lowest Price first, then Earliest Time
CREATE INDEX idx_order_book_market_side_price_asc_created_asc 
ON order_book(market_id, side, price ASC, created_at ASC) 
WHERE status IN ('OPEN', 'PARTIAL');

-- User Order History Index
CREATE INDEX idx_order_book_user_status ON order_book(user_id, status);


-- Trades Table (Execution History)
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  maker_order_id UUID REFERENCES order_book(id),
  taker_order_id UUID REFERENCES order_book(id),
  -- If maker/taker are unknown (e.g. external liquidity), these can be null, but for pure CLOB they should exist
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  
  price DECIMAL(36, 18) NOT NULL,
  size DECIMAL(36, 18) NOT NULL,
  
  taker_side VARCHAR(4) NOT NULL CHECK (taker_side IN ('BUY', 'SELL')), -- Aggressor side
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_market_created ON trades(market_id, created_at DESC);


-- RLS Policies
ALTER TABLE order_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Order Book Policies
-- Public: Everyone can see the open order book (anon access for price discovery)
-- BUT actually, for a CLOB, usually we only expose the AGGREGATED VIEW publicly, not individual orders.
-- However, for simplicity in this frontend, we might fetch individual orders or we fetch aggregate.
-- Let's allow read access to open orders for now to build the depth chart client-side if needed, 
-- though production would use an aggregated view or websocket stream.
CREATE POLICY "Public read access to active orders"
ON order_book FOR SELECT
USING (status IN ('OPEN', 'PARTIAL'));

-- Users can see all their own orders (including history)
CREATE POLICY "Users can see their own orders"
ON order_book FOR SELECT
USING (auth.uid() = user_id);

-- Users can cancel their own orders (update status)
-- Note: Matching engine usually handles updates. If we allow direct cancellation from client,
-- we must be careful matching engine doesn't try to fill it.
-- Depending on architecture: 
-- Method A: Client -> API -> Engine -> DB (Engine cancels it).
-- Method B: Client -> DB (Update Status) -> Engine listens to changes.
-- We are implementing Method A (API driven), so DB RLS for UPDATE might not be strictly necessary for the client 
-- if the client ONLY communicates via the API/Engine. 
-- However, for safety, let's allow users to View. Ideally updates go through Service Role (API).
-- We will RESTRICT direct updates/inserts from client SDK to force usage of the API Endpoint.


-- Trades Policies
-- Public can see recent trades (ticker)
CREATE POLICY "Public read access to trades"
ON trades FOR SELECT
USING (true);
