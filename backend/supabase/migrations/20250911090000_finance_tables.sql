BEGIN;

-- ============================================================================
-- Finance Data Schema
-- Creates core tables to persist finance control data:
--   - finance_accounts
--   - finance_transactions
--   - finance_pending_payments
--   - finance_subscriptions
-- Includes row level security policies scoped to Basejump accounts.
-- ============================================================================

-- Ensure helper function exists to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper trigger to copy account ownership from finance_accounts
CREATE OR REPLACE FUNCTION public.finance_set_account_reference()
RETURNS trigger AS $$
DECLARE
    v_account UUID;
BEGIN
    SELECT account_id INTO v_account
    FROM finance_accounts
    WHERE id = NEW.finance_account_id;

    IF v_account IS NULL THEN
        RAISE EXCEPTION 'Finance account % not found or unauthorized', NEW.finance_account_id;
    END IF;

    NEW.account_id := v_account;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------------
-- finance_accounts
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('FUNDING', 'TRADING', 'SAVINGS', 'CHECKING', 'CREDIT', 'CASH', 'OTHER')),
    currency TEXT NOT NULL DEFAULT 'BRL',
    opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_accounts_account_id ON finance_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_created_by ON finance_accounts(created_by);

DROP TRIGGER IF EXISTS trg_finance_accounts_updated_at ON finance_accounts;
CREATE TRIGGER trg_finance_accounts_updated_at
    BEFORE UPDATE ON finance_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_accounts_select" ON finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_insert" ON finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_update" ON finance_accounts;
DROP POLICY IF EXISTS "finance_accounts_delete" ON finance_accounts;

CREATE POLICY "finance_accounts_select"
    ON finance_accounts
    FOR SELECT
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_accounts_insert"
    ON finance_accounts
    FOR INSERT
    WITH CHECK (
        basejump.has_role_on_account(account_id)
        AND created_by = auth.uid()
    );

CREATE POLICY "finance_accounts_update"
    ON finance_accounts
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_accounts_delete"
    ON finance_accounts
    FOR DELETE
    USING (basejump.has_role_on_account(account_id));

-- --------------------------------------------------------------------------
-- finance_transactions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    finance_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'PENDING', 'CANCELLED')),
    description TEXT,
    category TEXT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    counterparty TEXT,
    notes TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_account_id ON finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_finance_account_id ON finance_transactions(finance_account_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(transaction_date DESC);

DROP TRIGGER IF EXISTS trg_finance_transactions_updated_at ON finance_transactions;
CREATE TRIGGER trg_finance_transactions_updated_at
    BEFORE UPDATE ON finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_finance_transactions_set_account ON finance_transactions;
CREATE TRIGGER trg_finance_transactions_set_account
    BEFORE INSERT OR UPDATE ON finance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_account_reference();

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_transactions_select" ON finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_insert" ON finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_update" ON finance_transactions;
DROP POLICY IF EXISTS "finance_transactions_delete" ON finance_transactions;

CREATE POLICY "finance_transactions_select"
    ON finance_transactions
    FOR SELECT
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_transactions_insert"
    ON finance_transactions
    FOR INSERT
    WITH CHECK (
        basejump.has_role_on_account(account_id)
        AND created_by = auth.uid()
    );

CREATE POLICY "finance_transactions_update"
    ON finance_transactions
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_transactions_delete"
    ON finance_transactions
    FOR DELETE
    USING (basejump.has_role_on_account(account_id));

-- --------------------------------------------------------------------------
-- finance_pending_payments
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_pending_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    finance_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    due_date DATE NOT NULL,
    recurrence TEXT NOT NULL DEFAULT 'ONCE' CHECK (recurrence IN ('ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'OVERDUE', 'PAID')),
    category TEXT,
    counterparty TEXT,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_finance_pending_account_id ON finance_pending_payments(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_pending_account_ref ON finance_pending_payments(finance_account_id);
CREATE INDEX IF NOT EXISTS idx_finance_pending_due_date ON finance_pending_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_pending_status ON finance_pending_payments(status);

DROP TRIGGER IF EXISTS trg_finance_pending_updated_at ON finance_pending_payments;
CREATE TRIGGER trg_finance_pending_updated_at
    BEFORE UPDATE ON finance_pending_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_finance_pending_set_account ON finance_pending_payments;
CREATE TRIGGER trg_finance_pending_set_account
    BEFORE INSERT OR UPDATE ON finance_pending_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_account_reference();

ALTER TABLE finance_pending_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_pending_select" ON finance_pending_payments;
DROP POLICY IF EXISTS "finance_pending_insert" ON finance_pending_payments;
DROP POLICY IF EXISTS "finance_pending_update" ON finance_pending_payments;
DROP POLICY IF EXISTS "finance_pending_delete" ON finance_pending_payments;

CREATE POLICY "finance_pending_select"
    ON finance_pending_payments
    FOR SELECT
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_pending_insert"
    ON finance_pending_payments
    FOR INSERT
    WITH CHECK (
        basejump.has_role_on_account(account_id)
        AND created_by = auth.uid()
    );

CREATE POLICY "finance_pending_update"
    ON finance_pending_payments
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_pending_delete"
    ON finance_pending_payments
    FOR DELETE
    USING (basejump.has_role_on_account(account_id));

-- --------------------------------------------------------------------------
-- finance_subscriptions
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finance_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    finance_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'BRL',
    billing_day SMALLINT NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
    category TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_billing DATE,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_account_id ON finance_subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_status ON finance_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_finance_subscriptions_next_billing ON finance_subscriptions(next_billing);

DROP TRIGGER IF EXISTS trg_finance_subscriptions_updated_at ON finance_subscriptions;
CREATE TRIGGER trg_finance_subscriptions_updated_at
    BEFORE UPDATE ON finance_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_finance_subscriptions_set_account ON finance_subscriptions;
CREATE TRIGGER trg_finance_subscriptions_set_account
    BEFORE INSERT OR UPDATE ON finance_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.finance_set_account_reference();

ALTER TABLE finance_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_subscriptions_select" ON finance_subscriptions;
DROP POLICY IF EXISTS "finance_subscriptions_insert" ON finance_subscriptions;
DROP POLICY IF EXISTS "finance_subscriptions_update" ON finance_subscriptions;
DROP POLICY IF EXISTS "finance_subscriptions_delete" ON finance_subscriptions;

CREATE POLICY "finance_subscriptions_select"
    ON finance_subscriptions
    FOR SELECT
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_subscriptions_insert"
    ON finance_subscriptions
    FOR INSERT
    WITH CHECK (
        basejump.has_role_on_account(account_id)
        AND created_by = auth.uid()
    );

CREATE POLICY "finance_subscriptions_update"
    ON finance_subscriptions
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "finance_subscriptions_delete"
    ON finance_subscriptions
    FOR DELETE
    USING (basejump.has_role_on_account(account_id));

COMMIT;
