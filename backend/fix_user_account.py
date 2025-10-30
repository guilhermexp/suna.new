#!/usr/bin/env python3
"""Temporary script to fix missing user account."""
import asyncio
from app.core.database import get_supabase_admin

async def fix_user_account():
    """Create missing account for user."""
    user_id = "9fe8e8d6-27da-4747-a9a8-02e3e26bce82"

    supabase = await get_supabase_admin()

    # Check if account exists
    result = supabase.table("accounts").select("*").eq("id", user_id).execute()

    if result.data:
        print(f"✅ Account already exists for user {user_id}")
        return

    print(f"Creating account for user {user_id}...")

    # Execute SQL to create account and account_user
    sql = f"""
    DO $$
    DECLARE
        user_email text;
        generated_name text;
    BEGIN
        -- Get user email
        SELECT email INTO user_email FROM auth.users WHERE id = '{user_id}';

        IF user_email IS NOT NULL THEN
            generated_name := split_part(user_email, '@', 1);
        ELSE
            generated_name := 'User';
        END IF;

        -- Create account
        INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account, created_at, updated_at)
        VALUES ('{user_id}', generated_name, '{user_id}', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;

        -- Create account_user
        INSERT INTO basejump.account_user (user_id, account_id, account_role)
        VALUES ('{user_id}', '{user_id}', 'owner')
        ON CONFLICT (user_id, account_id) DO NOTHING;

    END $$;
    """

    result = supabase.rpc("exec_sql", {"sql": sql}).execute()

    print(f"✅ Account created successfully!")
    print(f"Result: {result.data}")

if __name__ == "__main__":
    asyncio.run(fix_user_account())
