-- Add group_vehicles table for club garage feature
-- This allows users to showcase their vehicles in group garages

CREATE TABLE IF NOT EXISTS group_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  description TEXT,
  
  -- Ensure a user can only add a vehicle once per group
  UNIQUE(group_chat_id, vehicle_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_vehicles_group_chat_id ON group_vehicles(group_chat_id);
CREATE INDEX IF NOT EXISTS idx_group_vehicles_user_id ON group_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_group_vehicles_vehicle_id ON group_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_group_vehicles_featured ON group_vehicles(is_featured);

-- Enable RLS
ALTER TABLE group_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view vehicles in groups they're members of
CREATE POLICY "Users can view group vehicles" ON group_vehicles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_id = group_vehicles.group_chat_id 
      AND user_id = auth.uid()
    )
  );

-- Users can add their own vehicles to groups they're members of
CREATE POLICY "Users can add vehicles to groups" ON group_vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM group_chat_members 
      WHERE group_chat_id = group_vehicles.group_chat_id 
      AND user_id = auth.uid()
    )
  );

-- Users can update their own vehicle entries
CREATE POLICY "Users can update their group vehicles" ON group_vehicles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can remove their own vehicles from groups
CREATE POLICY "Users can remove their group vehicles" ON group_vehicles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Group owners can manage all vehicles in their group
CREATE POLICY "Group owners can manage all vehicles" ON group_vehicles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chats 
      WHERE id = group_vehicles.group_chat_id 
      AND created_by = auth.uid()
    )
  ); 