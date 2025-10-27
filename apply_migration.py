#!/usr/bin/env python3
"""
Script to apply the projects table migration directly to Supabase
"""
import os
import sys
import requests

# Get credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://qupamuozvmiewijkvxws.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment")
    sys.exit(1)

# SQL to add missing column
SQL = """
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
"""

print("Attempting to add icon_background column to projects table...")
print(f"Supabase URL: {SUPABASE_URL}")

# Try to execute via REST API using a custom function
# First, let's try to query the table to see what columns exist
headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Check current schema
try:
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/projects?select=*&limit=0",
        headers=headers,
        timeout=10
    )
    print(f"\nCurrent projects table status: {response.status_code}")
    if response.status_code == 200:
        print("✓ Projects table exists")
    else:
        print(f"✗ Error: {response.text}")
except Exception as e:
    print(f"✗ Error checking table: {e}")

print("\n" + "="*70)
print("MIGRATION REQUIRED")
print("="*70)
print("\nYou need to run this SQL in Supabase Dashboard:")
print("\nhttps://supabase.com/dashboard/project/qupamuozvmiewijkvxws/sql/new\n")
print("-"*70)
print(SQL)
print("-"*70)
print("\nSteps:")
print("1. Click the URL above")
print("2. Paste the SQL code")
print("3. Click 'RUN' button")
print("4. Reload http://localhost:3000/projects")
print("\nAlternatively, if you have Supabase CLI installed:")
print("  cd backend && supabase db push")
