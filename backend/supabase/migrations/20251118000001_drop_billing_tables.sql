-- Drop Billing Tables Migration
-- Created: 2025-11-18
-- Purpose: Remove all billing-related tables, functions, triggers and types
-- IMPORTANT: Run backup migration (20251118000000) before running this

-- Drop triggers first
DROP TRIGGER IF EXISTS tr_update_billing_customer ON basejump.billing_customers CASCADE;
DROP TRIGGER IF EXISTS tr_update_billing_subscription ON basejump.billing_subscriptions CASCADE;
DROP TRIGGER IF EXISTS tr_credit_account_updated ON credit_accounts CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS basejump.update_billing_customer_updated_at() CASCADE;
DROP FUNCTION IF EXISTS basejump.update_billing_subscription_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_credit_balance(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_expiring_credits(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_non_expiring_credits(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_trial_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_commitment_info(UUID) CASCADE;

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.credit_purchases CASCADE;
DROP TABLE IF EXISTS public.commitment_history CASCADE;
DROP TABLE IF EXISTS public.trial_history CASCADE;
DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.credit_accounts CASCADE;
DROP TABLE IF EXISTS public.admin_actions_log CASCADE;
DROP TABLE IF EXISTS basejump.billing_subscriptions CASCADE;
DROP TABLE IF EXISTS basejump.billing_customers CASCADE;

-- Drop types/enums
DROP TYPE IF EXISTS public.credit_transaction_type CASCADE;
DROP TYPE IF EXISTS public.trial_status_enum CASCADE;
DROP TYPE IF EXISTS public.commitment_status_enum CASCADE;

-- Note: finance_* tables are kept as they may have independent uses
-- If you want to remove them too, uncomment the following lines:
-- DROP TABLE IF EXISTS public.finance_transactions CASCADE;
-- DROP TABLE IF EXISTS public.finance_accounts CASCADE;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Billing tables, functions, triggers and types successfully dropped';
    RAISE NOTICE 'Billing data is preserved in billing_backup table';
END $$;
