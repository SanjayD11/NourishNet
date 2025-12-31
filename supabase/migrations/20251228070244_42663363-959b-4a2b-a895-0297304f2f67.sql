-- Recreate public.food_posts to ensure clean schema and refresh schema cache

ALTER TABLE public.food_posts RENAME TO food_posts_old;

CREATE TABLE public.food_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_title text NOT NULL,
  description text NOT NULL,
  location_name text NOT NULL,
  location_lat double precision NOT NULL,
  location_long double precision NOT NULL,
  food_category text NOT NULL,
  cuisine_type text,
  images text[] NOT NULL DEFAULT '{}'::text[],
  image_url text,
  best_before timestamptz,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  status text DEFAULT 'available',
  created_at timestamptz DEFAULT now(),
  hygiene_covered boolean DEFAULT false,
  hygiene_proper_storage boolean DEFAULT false,
  hygiene_prepared_today boolean DEFAULT false,
  hygiene_packed_sealed boolean DEFAULT false,
  prep_time text,
  allergens text[] NOT NULL DEFAULT '{}'::text[]
);

-- Migrate existing data safely
INSERT INTO public.food_posts (
  id, user_id, food_title, description, location_name, location_lat, location_long,
  food_category, cuisine_type, images, image_url, best_before, tags, status,
  created_at, hygiene_covered, hygiene_proper_storage, hygiene_prepared_today,
  hygiene_packed_sealed, prep_time, allergens
)
SELECT
  id,
  user_id,
  food_title,
  description,
  location_name,
  location_lat,
  location_long,
  food_category,
  cuisine_type,
  COALESCE(images, '{}'::text[]),
  image_url,
  best_before,
  COALESCE(tags, '{}'::text[]),
  COALESCE(status, 'available'),
  COALESCE(created_at, now()),
  COALESCE(hygiene_covered, false),
  COALESCE(hygiene_proper_storage, false),
  COALESCE(hygiene_prepared_today, false),
  COALESCE(hygiene_packed_sealed, false),
  prep_time,
  COALESCE(allergens, '{}'::text[])
FROM public.food_posts_old;

DROP TABLE public.food_posts_old;

-- Recreate RLS
ALTER TABLE public.food_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available food posts" 
ON public.food_posts
FOR SELECT
USING (status = 'available'::text);

CREATE POLICY "Owners can manage their food posts" 
ON public.food_posts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);