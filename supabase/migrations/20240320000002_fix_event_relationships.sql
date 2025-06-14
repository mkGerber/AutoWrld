-- First, let's check and drop any existing constraints that might be causing issues
DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    ALTER TABLE events DROP CONSTRAINT IF EXISTS fk_events_created_by;
    ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS fk_event_attendees_event;
    ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS fk_event_attendees_profile;
    
    -- Drop any existing indexes that might be causing issues
    DROP INDEX IF EXISTS idx_events_created_by;
    DROP INDEX IF EXISTS idx_event_attendees_event_id;
    DROP INDEX IF EXISTS idx_event_attendees_user_id;
END $$;

-- Now let's recreate the tables with proper structure
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    type TEXT DEFAULT 'Car Meet',
    max_attendees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view events"
ON events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
ON events FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
ON events FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can view event attendees"
ON event_attendees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can RSVP to events"
ON event_attendees FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can cancel their RSVP"
ON event_attendees FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 