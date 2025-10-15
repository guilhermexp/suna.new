-- Create documents table with version control
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(100) DEFAULT 'text/plain',

    -- Version control fields
    version INTEGER DEFAULT 1 NOT NULL,
    parent_version_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,

    -- Ownership and permissions
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],

    -- Conflict detection
    last_modified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    etag VARCHAR(64) GENERATED ALWAYS AS (MD5(content || version::text || last_modified_at::text)) STORED,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),

    -- Constraints
    CONSTRAINT valid_version CHECK (version > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_account_id ON public.documents(account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_parent_version ON public.documents(parent_version_id) WHERE parent_version_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON public.documents USING GIN(metadata);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view documents in their account
CREATE POLICY "Users can view documents in their account"
    ON public.documents
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id
            FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

-- Users can create documents in their account
CREATE POLICY "Users can create documents in their account"
    ON public.documents
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Users can update documents in their account
CREATE POLICY "Users can update documents in their account"
    ON public.documents
    FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id
            FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
        AND deleted_at IS NULL
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id
            FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Users can delete (soft delete) documents in their account
CREATE POLICY "Users can delete documents in their account"
    ON public.documents
    FOR DELETE
    USING (
        account_id IN (
            SELECT account_id
            FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Create document_versions table for version history
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(100) DEFAULT 'text/plain',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(document_id, version)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON public.document_versions(created_at DESC);

-- Enable RLS on document_versions
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for document_versions
CREATE POLICY "Users can view document versions they have access to"
    ON public.document_versions
    FOR SELECT
    USING (
        document_id IN (
            SELECT id
            FROM public.documents
            WHERE account_id IN (
                SELECT account_id
                FROM basejump.account_user
                WHERE user_id = auth.uid()
            )
        )
    );
