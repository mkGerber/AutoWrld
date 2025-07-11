-- Add maintenance reminders system
-- This allows users to track maintenance schedules and get reminders

-- Create maintenance_reminders table
CREATE TABLE IF NOT EXISTS maintenance_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('mileage', 'time', 'both')),
    interval_miles INTEGER,
    interval_months INTEGER,
    last_service_miles INTEGER,
    last_service_date DATE,
    next_reminder_date DATE,
    next_reminder_miles INTEGER,
    is_active BOOLEAN DEFAULT true,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    estimated_cost DECIMAL(10,2),
    service_provider TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_log table for tracking completed services
CREATE TABLE IF NOT EXISTS maintenance_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    reminder_id UUID REFERENCES maintenance_reminders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_date DATE NOT NULL,
    service_miles INTEGER,
    cost DECIMAL(10,2),
    service_provider TEXT,
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_vehicle_id ON maintenance_reminders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_next_date ON maintenance_reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_next_miles ON maintenance_reminders(next_reminder_miles);
CREATE INDEX IF NOT EXISTS idx_maintenance_reminders_active ON maintenance_reminders(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_vehicle_id ON maintenance_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_service_date ON maintenance_log(service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_reminder_id ON maintenance_log(reminder_id);

-- Enable RLS
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_log ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance_reminders
CREATE POLICY "Users can view maintenance reminders for their vehicles"
ON maintenance_reminders FOR SELECT
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert maintenance reminders for their vehicles"
ON maintenance_reminders FOR INSERT
TO authenticated
WITH CHECK (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update maintenance reminders for their vehicles"
ON maintenance_reminders FOR UPDATE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete maintenance reminders for their vehicles"
ON maintenance_reminders FOR DELETE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

-- Create policies for maintenance_log
CREATE POLICY "Users can view maintenance log for their vehicles"
ON maintenance_log FOR SELECT
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert maintenance log for their vehicles"
ON maintenance_log FOR INSERT
TO authenticated
WITH CHECK (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update maintenance log for their vehicles"
ON maintenance_log FOR UPDATE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete maintenance log for their vehicles"
ON maintenance_log FOR DELETE
TO authenticated
USING (
    vehicle_id IN (
        SELECT id FROM vehicles WHERE user_id = auth.uid()
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_maintenance_reminders_updated_at
    BEFORE UPDATE ON maintenance_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_reminders_updated_at();

-- Create function to calculate next reminder date/miles
CREATE OR REPLACE FUNCTION calculate_next_maintenance_reminder()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a new reminder, calculate next reminder based on current vehicle miles
    IF TG_OP = 'INSERT' THEN
        -- Get current vehicle miles
        SELECT miles INTO NEW.last_service_miles
        FROM vehicles
        WHERE id = NEW.vehicle_id;
        
        -- Calculate next reminder date if time-based
        IF NEW.interval_months IS NOT NULL THEN
            NEW.next_reminder_date = CURRENT_DATE + (NEW.interval_months || ' months')::INTERVAL;
        END IF;
        
        -- Calculate next reminder miles if mileage-based
        IF NEW.interval_miles IS NOT NULL AND NEW.last_service_miles IS NOT NULL THEN
            NEW.next_reminder_miles = NEW.last_service_miles + NEW.interval_miles;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for calculating next reminders
CREATE TRIGGER trigger_calculate_next_maintenance_reminder
    BEFORE INSERT ON maintenance_reminders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_maintenance_reminder(); 