-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
CREATE POLICY "Authenticated users can view profile images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload their own profile images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile_images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);