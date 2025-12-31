-- Ensure all expected columns exist on public.food_posts and refresh PostgREST schema
ALTER TABLE public.food_posts
  ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS hygiene_covered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hygiene_proper_storage boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hygiene_prepared_today boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hygiene_packed_sealed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prep_time text;

-- Force PostgREST to reload schema so new/updated columns are recognized
NOTIFY pgrst, 'reload schema';