-- Ensure all required columns exist on food_posts table with correct types
-- Add allergens column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'allergens'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN allergens text[] DEFAULT '{}';
  END IF;
END $$;

-- Add hygiene columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'hygiene_covered'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN hygiene_covered boolean DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'hygiene_proper_storage'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN hygiene_proper_storage boolean DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'hygiene_prepared_today'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN hygiene_prepared_today boolean DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'hygiene_packed_sealed'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN hygiene_packed_sealed boolean DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'food_posts' 
    AND column_name = 'prep_time'
  ) THEN
    ALTER TABLE public.food_posts 
    ADD COLUMN prep_time text;
  END IF;
END $$;