-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create gen_random_bytes function if it doesn't exist
-- This is needed for PostgreSQL versions that don't have it built-in
CREATE OR REPLACE FUNCTION gen_random_bytes(integer)
RETURNS bytea
AS $$
  SELECT gen_random_uuid()::text::bytea
$$
LANGUAGE SQL;