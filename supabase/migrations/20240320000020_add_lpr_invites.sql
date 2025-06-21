-- Add LPR invites table for license plate recognition invites
-- This allows users to send invites to vehicle owners when they find their license plate

CREATE TABLE IF NOT EXISTS lpr_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  license_state TEXT,
  image_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lpr_invites_recipient_id ON lpr_invites(recipient_id);
CREATE INDEX IF NOT EXISTS idx_lpr_invites_status ON lpr_invites(status);
CREATE INDEX IF NOT EXISTS idx_lpr_invites_created_at ON lpr_invites(created_at);
CREATE INDEX IF NOT EXISTS idx_lpr_invites_license_plate ON lpr_invites(license_plate);

-- Enable RLS
ALTER TABLE lpr_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view invites they sent or received
CREATE POLICY "Users can view their LPR invites"
ON lpr_invites FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can create invites
CREATE POLICY "Users can create LPR invites"
ON lpr_invites FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

-- Recipients can update (accept/decline) invites sent to them
CREATE POLICY "Recipients can update LPR invites"
ON lpr_invites FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- Users can delete their own invites
CREATE POLICY "Users can delete their LPR invites"
ON lpr_invites FOR DELETE
TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_lpr_invites_updated_at 
    BEFORE UPDATE ON lpr_invites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 