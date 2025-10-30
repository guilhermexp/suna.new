"""Temporary endpoint to fix missing user accounts."""
from fastapi import APIRouter, HTTPException
from app.core.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/fix-missing-account/{user_id}")
async def fix_missing_account(user_id: str):
    """
    Temporary endpoint to create missing account for a user.
    This should be removed after fixing all affected users.
    """
    try:
        supabase = await get_supabase_admin()

        # Check if account exists
        result = supabase.table("accounts").select("*").eq("id", user_id).execute()

        if result.data:
            return {
                "status": "already_exists",
                "message": f"Account already exists for user {user_id}"
            }

        # Get user email from auth.users
        user_result = supabase.auth.admin.get_user(user_id)
        user_email = user_result.user.email if user_result.user else None

        if not user_email:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate name from email
        generated_name = user_email.split('@')[0]

        # Create account in basejump.accounts
        account_data = {
            "id": user_id,
            "name": generated_name,
            "primary_owner_user_id": user_id,
            "personal_account": True
        }

        # Use RPC to insert into basejump schema
        result = supabase.rpc(
            "exec_sql",
            {
                "sql": f"""
                INSERT INTO basejump.accounts (id, name, primary_owner_user_id, personal_account, created_at, updated_at)
                VALUES ('{user_id}', '{generated_name}', '{user_id}', true, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;

                INSERT INTO basejump.account_user (user_id, account_id, account_role)
                VALUES ('{user_id}', '{user_id}', 'owner')
                ON CONFLICT (user_id, account_id) DO NOTHING;
                """
            }
        ).execute()

        return {
            "status": "created",
            "message": f"Account created successfully for user {user_id}",
            "account_id": user_id
        }

    except Exception as e:
        logger.error(f"Error fixing account for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
