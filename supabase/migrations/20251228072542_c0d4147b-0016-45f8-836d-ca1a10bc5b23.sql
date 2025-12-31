-- Add safety_level column to food_posts if it does not exist and refresh PostgREST schema
ALTER TABLE public.food_posts
  ADD COLUMN IF NOT EXISTS safety_level text;

-- Force PostgREST to reload schema so new/updated columns are recognized
NOTIFY pgrst, 'reload schema';