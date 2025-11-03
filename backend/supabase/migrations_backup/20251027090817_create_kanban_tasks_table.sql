BEGIN;

-- ============================================================================
-- KANBAN TASKS TABLE MIGRATION
-- Create kanban_tasks table for task management within projects
-- ============================================================================

-- Create kanban_tasks table
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
CREATE INDEX idx_kanban_tasks_project_id ON kanban_tasks(project_id);
CREATE INDEX idx_kanban_tasks_user_id ON kanban_tasks(user_id);
CREATE INDEX idx_kanban_tasks_assigned_to ON kanban_tasks(assigned_to);
CREATE INDEX idx_kanban_tasks_status ON kanban_tasks(status);
CREATE INDEX idx_kanban_tasks_priority ON kanban_tasks(priority);
CREATE INDEX idx_kanban_tasks_position ON kanban_tasks(position);
CREATE INDEX idx_kanban_tasks_created_at ON kanban_tasks(created_at);
CREATE INDEX idx_kanban_tasks_updated_at ON kanban_tasks(updated_at);
CREATE INDEX idx_kanban_tasks_due_date ON kanban_tasks(due_date);
CREATE INDEX idx_kanban_tasks_completed_at ON kanban_tasks(completed_at);

-- Create composite index for task ordering within projects and status
CREATE INDEX idx_kanban_tasks_project_status_position ON kanban_tasks(project_id, status, position);

-- Create trigger for updated_at
CREATE TRIGGER update_kanban_tasks_updated_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set completed_at when status changes to 'done'
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

CREATE TRIGGER kanban_tasks_set_completed_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_completed_at_trigger();

-- Add Row Level Security (RLS)
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add comments for documentation
COMMENT ON TABLE kanban_tasks IS 'Kanban tasks for project management';
COMMENT ON COLUMN kanban_tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN kanban_tasks.title IS 'Task title (1-255 characters)';
COMMENT ON COLUMN kanban_tasks.description IS 'Optional task description';
COMMENT ON COLUMN kanban_tasks.project_id IS 'Project this task belongs to';
COMMENT ON COLUMN kanban_tasks.user_id IS 'Creator of the task';
COMMENT ON COLUMN kanban_tasks.created_at IS 'Timestamp when task was created';
COMMENT ON COLUMN kanban_tasks.updated_at IS 'Timestamp when task was last updated';
COMMENT ON COLUMN kanban_tasks.status IS 'Task status: todo, in_progress, review, done';
COMMENT ON COLUMN kanban_tasks.priority IS 'Task priority: low, medium, high, urgent';
COMMENT ON COLUMN kanban_tasks.position IS 'Position for ordering within status column';
COMMENT ON COLUMN kanban_tasks.assigned_to IS 'User assigned to this task';
COMMENT ON COLUMN kanban_tasks.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN kanban_tasks.completed_at IS 'Timestamp when task was completed';
COMMENT ON COLUMN kanban_tasks.tags IS 'Array of tags for task categorization';
COMMENT ON COLUMN kanban_tasks.metadata IS 'Additional task metadata as JSON';
COMMENT ON COLUMN kanban_tasks.icon_name IS 'Optional Lucide React icon name for task visual representation';
COMMENT ON COLUMN kanban_tasks.icon_color IS 'Optional hex color code for icon (format: #RRGGBB)';
COMMENT ON COLUMN kanban_tasks.icon_background IS 'Optional hex color code for icon background (format: #RRGGBB)';

COMMIT;