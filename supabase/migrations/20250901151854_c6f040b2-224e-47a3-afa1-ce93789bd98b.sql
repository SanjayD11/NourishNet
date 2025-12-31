-- Create food_posts table as specified
CREATE TABLE public.food_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat FLOAT8 NOT NULL,
  location_long FLOAT8 NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for food_posts
CREATE POLICY "Food posts are viewable by everyone" 
ON public.food_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own food posts" 
ON public.food_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food posts" 
ON public.food_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food posts" 
ON public.food_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update profiles table to match the specification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make sure profiles table has proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_food_posts_status ON public.food_posts(status);
CREATE INDEX IF NOT EXISTS idx_food_posts_user_id ON public.food_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_food_posts_location ON public.food_posts(location_lat, location_long);

-- Update the existing profiles trigger to handle the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;