-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Set up RLS policies for event-images bucket
CREATE POLICY "Users can upload their own event images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view event images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'event-images');

CREATE POLICY "Users can update their own event images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]); 