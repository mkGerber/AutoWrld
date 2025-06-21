-- Create vehicle_wishlist table
CREATE TABLE IF NOT EXISTS vehicle_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    estimated_cost DECIMAL(10,2),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_wishlist_vehicle_id ON vehicle_wishlist(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_wishlist_priority ON vehicle_wishlist(priority);
CREATE INDEX IF NOT EXISTS idx_vehicle_wishlist_completed ON vehicle_wishlist(completed);
CREATE INDEX IF NOT EXISTS idx_vehicle_wishlist_created_at ON vehicle_wishlist(created_at);

-- Enable RLS
ALTER TABLE vehicle_wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view wishlist items for vehicles they own"
ON vehicle_wishlist FOR SELECT
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert wishlist items for their vehicles"
ON vehicle_wishlist FOR INSERT
TO authenticated
WITH CHECK (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update wishlist items for their vehicles"
ON vehicle_wishlist FOR UPDATE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete wishlist items for their vehicles"
ON vehicle_wishlist FOR DELETE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vehicle_wishlist_updated_at
    BEFORE UPDATE ON vehicle_wishlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 