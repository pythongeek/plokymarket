CREATE TABLE order_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_hash TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commitments_hash ON order_commitments(commitment_hash);
