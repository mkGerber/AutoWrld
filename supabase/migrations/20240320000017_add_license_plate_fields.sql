-- Add license plate fields to vehicles table
-- These fields are private and only visible to the vehicle owner

-- Add license_plate column
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS license_plate TEXT;

-- Add license_state column  
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS license_state TEXT;

-- Create index for license plate lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Note: No RLS policy changes needed since these fields will be protected
-- by the existing vehicle ownership policies 