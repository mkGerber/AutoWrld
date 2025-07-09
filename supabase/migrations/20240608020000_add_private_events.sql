-- Add group_chat_id to events table for private events
ALTER TABLE events ADD COLUMN group_chat_id UUID REFERENCES group_chats(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_events_group_chat_id ON events(group_chat_id);

-- Update RLS policies to handle private events
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Public events are viewable by everyone" ON events 
  FOR SELECT USING (group_chat_id IS NULL);

CREATE POLICY "Private events are viewable by group members" ON events 
  FOR SELECT USING (
    group_chat_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_id = events.group_chat_id 
      AND user_id = auth.uid()
    )
  );

-- Update insert policy to allow group members to create private events
DROP POLICY IF EXISTS "Users can create events" ON events;
CREATE POLICY "Users can create public events" ON events 
  FOR INSERT WITH CHECK (
    group_chat_id IS NULL AND 
    created_by = auth.uid()
  );

CREATE POLICY "Group members can create private events" ON events 
  FOR INSERT WITH CHECK (
    group_chat_id IS NOT NULL AND 
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_id = events.group_chat_id 
      AND user_id = auth.uid()
    )
  );

-- Update update policy
DROP POLICY IF EXISTS "Users can update their own events" ON events;
CREATE POLICY "Users can update their own events" ON events 
  FOR UPDATE USING (created_by = auth.uid());

-- Update delete policy
DROP POLICY IF EXISTS "Users can delete their own events" ON events;
CREATE POLICY "Users can delete their own events" ON events 
  FOR DELETE USING (created_by = auth.uid()); 