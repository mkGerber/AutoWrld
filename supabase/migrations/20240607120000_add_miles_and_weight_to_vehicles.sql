-- Add miles and weight columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS miles INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS weight INTEGER; 