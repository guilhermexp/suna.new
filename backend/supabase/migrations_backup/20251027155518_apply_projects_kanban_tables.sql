BEGIN;

-- ============================================================================
-- MIGRATION: APPLY PROJECTS AND KANBAN_TASKS TABLES
-- This migration applies the previously created projects and kanban_tasks tables
-- to the local Supabase instance, ensuring RLS and triggers are correct.
-- ============================================================================

-- Ensure the gen_random_uuid() function exists (should exist in recent Supabase)
-- Note: Supabase already provides this function in pgcrypto extension

-- Create projects table if it doesn't exist
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
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects(is_archived);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Users can view own projects and public projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

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

-- Create kanban_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Task status and organization
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    position INTEGER DEFAULT 0,

    -- Task metadata
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Icon system (optional for tasks)
    icon_name VARCHAR(100),
    icon_color VARCHAR(7),
    icon_background VARCHAR(7),

    -- Constraints
    CONSTRAINT kanban_tasks_title_length CHECK (length(title) >= 1 AND length(title) <= 255),
    CONSTRAINT kanban_tasks_status_valid CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    CONSTRAINT kanban_tasks_priority_valid CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT kanban_tasks_position_positive CHECK (position >= 0),
    CONSTRAINT kanban_tasks_icon_color_format CHECK (icon_color IS NULL OR icon_color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT kanban_tasks_icon_background_format CHECK (icon_background IS NULL OR icon_background ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT kanban_tasks_completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project_id ON kanban_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id ON kanban_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned_to ON kanban_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_priority ON kanban_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_position ON kanban_tasks(position);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_created_at ON kanban_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_updated_at ON kanban_tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_due_date ON kanban_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_completed_at ON kanban_tasks(completed_at);

-- Create composite index for task ordering within projects and status
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project_status_position ON kanban_tasks(project_id, status, position);

-- Create trigger for updated_at on kanban_tasks
DROP TRIGGER IF EXISTS update_kanban_tasks_updated_at ON kanban_tasks;
CREATE TRIGGER update_kanban_tasks_updated_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set completed_at when status changes to 'done'
DROP FUNCTION IF EXISTS set_completed_at_trigger() CASCADE;
CREATE OR REPLACE FUNCTION set_completed_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when task is marked as done
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
        NEW.completed_at = NOW();
    END IF;

    -- Clear completed_at when task is moved away from done status
    IF NEW.status != 'done' AND OLD.status = 'done' THEN
        NEW.completed_at = NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kanban_tasks_set_completed_at ON kanban_tasks;
CREATE TRIGGER kanban_tasks_set_completed_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at_trigger();

-- Add Row Level Security (RLS) to kanban_tasks
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks in own projects or assigned tasks" ON kanban_tasks;
DROP POLICY IF EXISTS "Users can create tasks in own projects" ON kanban_tasks;
DROP POLICY IF EXISTS "Users can update tasks in own projects or assigned tasks" ON kanban_tasks;
DROP POLICY IF EXISTS "Users can delete tasks in own projects" ON kanban_tasks;

-- RLS Policies for kanban_tasks
-- Users can view tasks in their own projects or assigned to them
CREATE POLICY "Users can view tasks in own projects or assigned tasks" ON kanban_tasks
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() = assigned_to OR
        project_id IN (
            SELECT id FROM projects
            WHERE user_id = auth.uid() OR is_public = true
        )
    );

-- Users can create tasks in their own projects
CREATE POLICY "Users can create tasks in own projects" ON kanban_tasks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can update tasks in their own projects or assigned to them
CREATE POLICY "Users can update tasks in own projects or assigned tasks" ON kanban_tasks
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() = assigned_to
    );

-- Users can delete tasks in their own projects
CREATE POLICY "Users can delete tasks in own projects" ON kanban_tasks
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Enable realtime updates for projects table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Projects table for organizing Kanban boards and tasks';
COMMENT ON COLUMN projects.id IS 'Unique identifier for project';
COMMENT ON COLUMN projects.name IS 'Project name (1-255 characters)';
COMMENT ON COLUMN projects.description IS 'Optional project description';
COMMENT ON COLUMN projects.user_id IS 'Owner of the project';
COMMENT ON COLUMN projects.created_at IS 'Timestamp when project was created';
COMMENT ON COLUMN projects.updated_at IS 'Timestamp when project was last updated';
COMMENT ON COLUMN projects.icon_name IS 'Lucide React icon name for project visual representation';
COMMENT ON COLUMN projects.icon_color IS 'Hex color code for icon (format: #RRGGBB)';
COMMENT ON COLUMN projects.icon_background IS 'Hex color code for icon background (format: #RRGGBB)';
COMMENT ON COLUMN projects.is_archived IS 'Whether project is archived';
COMMENT ON COLUMN projects.is_public IS 'Whether project is publicly visible';
COMMENT ON COLUMN projects.settings IS 'Additional project settings as JSON';

COMMENT ON TABLE kanban_tasks IS 'Kanban tasks for project management';
COMMENT ON COLUMN kanban_tasks.id IS 'Unique identifier for task';
COMMENT ON COLUMN kanban_tasks.title IS 'Task title (1-255 characters)';
COMMENT ON COLUMN kanban_tasks.description IS 'Optional task description';
COMMENT ON COLUMN kanban_tasks.project_id IS 'Project this task belongs to';
COMMENT ON COLUMN kanban_tasks.user_id IS 'Creator of task';
COMMENT ON COLUMN kanban_tasks.created_at IS 'Timestamp when task was created';
COMMENT ON COLUMN kanban_tasks.updated_at IS 'Timestamp when task was last updated';
COMMENT ON COLUMN kanban_tasks.status IS 'Task status: todo, in_progress, review, done';
COMMENT ON COLUMN kanban_tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN kanban_tasks.position IS 'Position for ordering within status column';
COMMENT ON COLUMN kanban_tasks.assigned_to IS 'User assigned to this task';
COMMENT ON COLUMN kanban_tasks.due_date IS 'Optional due date for task';
COMMENT ON COLUMN kanban_tasks.completed_at IS 'Timestamp when task was completed';
COMMENT ON COLUMN kanban_tasks.tags IS 'Array of tags for task categorization';
COMMENT ON COLUMN kanban_tasks.metadata IS 'Additional task metadata as JSON';
COMMENT ON COLUMN kanban_tasks.icon_name IS 'Optional Lucide React icon name for task visual representation';
COMMENT ON COLUMN kanban_tasks.icon_color IS 'Optional hex color code for icon (format: #RRGGBB)';
COMMENT ON COLUMN kanban_tasks.icon_background IS 'Optional hex color code for icon background (format: #RRGGBB)';

COMMIT;
