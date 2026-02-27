CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  unc_balance NUMERIC(14,4) NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  creator_name VARCHAR(64) NOT NULL,
  base_price NUMERIC(14,6) NOT NULL DEFAULT 1,
  current_price NUMERIC(14,6) NOT NULL DEFAULT 1,
  total_unc_backed NUMERIC(14,4) NOT NULL DEFAULT 0,
  multiplier NUMERIC(14,8) NOT NULL DEFAULT 0.0004,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  units NUMERIC(20,6) NOT NULL,
  cost_basis_unc NUMERIC(14,4) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  action VARCHAR(8) NOT NULL CHECK (action IN ('BUY', 'SELL')),
  unc_amount NUMERIC(14,4) NOT NULL,
  units NUMERIC(20,6) NOT NULL,
  execution_price NUMERIC(14,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_points (
  id BIGSERIAL PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  price NUMERIC(14,6) NOT NULL,
  total_unc_backed NUMERIC(14,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_video_time ON transactions(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_points_video_time ON price_points(video_id, created_at ASC);
