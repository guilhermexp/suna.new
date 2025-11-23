-- Backup Billing Data Migration
-- Created: 2025-11-18
-- Purpose: Backup all billing-related data before removal
-- Tables backed up: credit_accounts, credit_ledger, trial_history, commitment_history, credit_purchases, basejump.billing_customers, basejump.billing_subscriptions

-- Create backup table with JSONB storage for all billing data
CREATE TABLE IF NOT EXISTS billing_backup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    account_id UUID,
    data JSONB NOT NULL,
    backed_up_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_backup_table ON billing_backup(table_name);
CREATE INDEX IF NOT EXISTS idx_billing_backup_account ON billing_backup(account_id);

-- Backup credit_accounts
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'credit_accounts' as table_name,
    account_id,
    to_jsonb(credit_accounts.*) as data
FROM credit_accounts;

-- Backup credit_ledger
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'credit_ledger' as table_name,
    account_id,
    to_jsonb(credit_ledger.*) as data
FROM credit_ledger;

-- Backup trial_history
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'trial_history' as table_name,
    account_id,
    to_jsonb(trial_history.*) as data
FROM trial_history;

-- Backup commitment_history
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'commitment_history' as table_name,
    account_id,
    to_jsonb(commitment_history.*) as data
FROM commitment_history;

-- Backup credit_purchases
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'credit_purchases' as table_name,
    account_id,
    to_jsonb(credit_purchases.*) as data
FROM credit_purchases;

-- Backup basejump.billing_customers
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'billing_customers' as table_name,
    account_id,
    to_jsonb(basejump.billing_customers.*) as data
FROM basejump.billing_customers;

-- Backup basejump.billing_subscriptions
INSERT INTO billing_backup (table_name, account_id, data)
SELECT
    'billing_subscriptions' as table_name,
    account_id,
    to_jsonb(basejump.billing_subscriptions.*) as data
FROM basejump.billing_subscriptions;

-- Log backup completion
DO $$
DECLARE
    backup_count INT;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM billing_backup;
    RAISE NOTICE 'Billing data backup completed: % records backed up', backup_count;
END $$;
