-- Create food_posts table with Safety Shield fields
CREATE TABLE IF NOT EXISTS public.food_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_title text NOT NULL,
  description text NOT NULL,
  location_name text NOT NULL,
  location_lat double precision NOT NULL,
  location_long double precision NOT NULL,
  food_category text NOT NULL,
  cuisine_type text,
  images text[] DEFAULT '{}'::text[],
  image_url text,
  best_before timestamptz,
  tags text[] DEFAULT '{}'::text[],
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  -- Safety Shield fields
  hygiene_covered boolean,
  hygiene_proper_storage boolean,
  hygiene_prepared_today boolean,
  hygiene_packed_sealed boolean,
  prep_time text,
  allergens text[]
);

-- Enable Row Level Security
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

-- Allow owners to manage their own posts
CREATE POLICY "Owners can manage their food posts"
ON public.food_posts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anyone to view available posts
CREATE POLICY "Anyone can view available food posts"
ON public.food_posts
FOR SELECT
TO public
USING (status = 'available');