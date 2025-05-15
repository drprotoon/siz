-- SQL script to update user schema with missing fields

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create addresses table if it doesn't exist
CREATE TABLE IF NOT EXISTS addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  postal_code TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index on user_id to ensure one address per user
CREATE UNIQUE INDEX IF NOT EXISTS addresses_user_id_idx ON addresses(user_id);
