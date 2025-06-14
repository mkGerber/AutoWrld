-- Add foreign key relationship between events and profiles
ALTER TABLE events
ADD CONSTRAINT fk_events_created_by
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add foreign key relationship between event_attendees and events
ALTER TABLE event_attendees
ADD CONSTRAINT fk_event_attendees_event
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE;

-- Add foreign key relationship between event_attendees and profiles
ALTER TABLE event_attendees
ADD CONSTRAINT fk_event_attendees_profile
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE; 