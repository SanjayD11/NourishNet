-- Check if policies exist and create missing ones
DO $$
BEGIN
  -- Create policy for uploading images if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload their own food images'
  ) THEN
    CREATE POLICY "Users can upload their own food images" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (
      bucket_id = 'food-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Create policy for viewing images if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can view food images'
  ) THEN
    CREATE POLICY "Users can view food images" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'food-images');
  END IF;

  -- Create policy for deleting images if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own food images'
  ) THEN
    CREATE POLICY "Users can delete their own food images" 
    ON storage.objects 
    FOR DELETE 
    USING (
      bucket_id = 'food-images' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;