#!/bin/bash
set -e

# Load environment variables
source backend/.env

# SQL to add missing column
SQL=$(cat <<'EOF'
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS icon_background VARCHAR(7) NOT NULL DEFAULT '#F3F4F6';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'projects_icon_background_format'
    ) THEN
        ALTER TABLE projects
        ADD CONSTRAINT projects_icon_background_format
        CHECK (icon_background ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;
EOF
)

echo "Applying migration to add icon_background column..."

# Execute SQL using curl
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL" | jq -Rs .)}" \
  || echo "RPC method not available, trying alternative..."

echo ""
echo "Migration script created. You need to run this SQL in Supabase Dashboard:"
echo "=========================================================================="
echo "$SQL"
echo "=========================================================================="
echo ""
echo "Go to: https://supabase.com/dashboard/project/qupamuozvmiewijkvxws/sql/new"
echo "Paste the SQL above and click RUN"
