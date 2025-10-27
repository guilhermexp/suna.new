BEGIN;

-- ============================================================================
-- PROJECTS TABLE MIGRATION
-- Create projects table for Kanban board functionality
-- ============================================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Icon system (following agents table pattern)
    icon_name VARCHAR(100) NOT NULL DEFAULT 'folder',
    icon_color VARCHAR(7) NOT NULL DEFAULT '#000000',
    icon_background VARCHAR(7) NOT NULL DEFAULT '#F3F4F6',

    -- Project metadata
    is_archived BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT projects_name_length CHECK (length(name) >= 1 AND length(name) <= 255),
    CONSTRAINT projects_icon_color_format CHECK (icon_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT projects_icon_background_format CHECK (icon_background ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);
CREATE INDEX idx_projects_is_public ON projects(is_public);

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own projects and public projects
CREATE POLICY "Users can view own projects and public projects" ON projects
    FOR SELECT USING (
        auth.uid() = user_id OR
        is_public = true
    );

-- Users can insert their own projects
CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Projects table for organizing Kanban boards and tasks';
COMMENT ON COLUMN projects.id IS 'Unique identifier for the project';
COMMENT ON COLUMN projects.name IS 'Project name (1-255 characters)';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.user_id IS 'Owner of the project';
COMMENT ON COLUMN projects.created_at IS 'Timestamp when project was created';
COMMENT ON COLUMN projects.updated_at IS 'Timestamp when project was last updated';
COMMENT ON COLUMN projects.icon_name IS 'Lucide React icon name for project visual representation';
COMMENT ON COLUMN projects.icon_color IS 'Hex color code for icon (format: #RRGGBB)';
COMMENT ON COLUMN projects.icon_background IS 'Hex color code for icon background (format: #RRGGBB)';
COMMENT ON COLUMN projects.is_archived IS 'Whether the project is archived';
COMMENT ON COLUMN projects.is_public IS 'Whether the project is publicly visible';
COMMENT ON COLUMN projects.settings IS 'Additional project settings as JSON';

COMMIT;