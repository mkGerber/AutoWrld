-- Add foreign key relationship between vehicles and profiles
ALTER TABLE vehicles
ADD CONSTRAINT fk_vehicles_user
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id); 