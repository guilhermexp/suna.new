-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Also enable pgcrypto which provides gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Force create uuid_generate_v4 function for compatibility
-- PostgreSQL 17 might not have this function even with uuid-ossp
CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid
AS $$
    SELECT gen_random_uuid()
$$
LANGUAGE SQL;