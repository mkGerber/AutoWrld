-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage bucket for user banners
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Set up RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for banners bucket
CREATE POLICY "Users can upload their own banner" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view banners" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'banners');

CREATE POLICY "Users can update their own banner" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own banner" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]); 