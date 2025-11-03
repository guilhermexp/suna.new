BEGIN;

-- ============================================================================
-- CALENDAR EVENTS TABLE MIGRATION
-- Create calendar_events table for calendar functionality
-- ============================================================================

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    
    -- Date and time
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_all_day BOOLEAN DEFAULT FALSE,
    
    -- Categorization and visual
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    color VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    
    -- Ownership
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT calendar_events_title_length CHECK (length(title) >= 1 AND length(title) <= 255),
    CONSTRAINT calendar_events_category_valid CHECK (category IN ('meeting', 'work', 'personal', 'other')),
    CONSTRAINT calendar_events_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT calendar_events_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_end_date ON calendar_events(end_date);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_created_at ON calendar_events(created_at);
CREATE INDEX idx_calendar_events_updated_at ON calendar_events(updated_at);

-- Create composite index for date range queries
CREATE INDEX idx_calendar_events_user_date_range ON calendar_events(user_id, start_date, end_date);

-- Create trigger for updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own events
CREATE POLICY "Users can view own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can create own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE calendar_events IS 'Calendar events table for managing user events and appointments';
COMMENT ON COLUMN calendar_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN calendar_events.title IS 'Event title (1-255 characters)';
COMMENT ON COLUMN calendar_events.description IS 'Optional event description';
COMMENT ON COLUMN calendar_events.location IS 'Optional event location';
COMMENT ON COLUMN calendar_events.start_date IS 'Event start date and time';
COMMENT ON COLUMN calendar_events.end_date IS 'Optional event end date and time';
COMMENT ON COLUMN calendar_events.is_all_day IS 'Whether the event is an all-day event';
COMMENT ON COLUMN calendar_events.category IS 'Event category: meeting, work, personal, other';
COMMENT ON COLUMN calendar_events.color IS 'Hex color code for event display (format: #RRGGBB)';
COMMENT ON COLUMN calendar_events.user_id IS 'Owner of the event';
COMMENT ON COLUMN calendar_events.created_at IS 'Timestamp when event was created';
COMMENT ON COLUMN calendar_events.updated_at IS 'Timestamp when event was last updated';

COMMIT;
