-- Add new columns to food_posts table for enhanced post details
ALTER TABLE public.food_posts 
ADD COLUMN food_category TEXT,
ADD COLUMN cuisine_type TEXT,
ADD COLUMN tags TEXT[],
ADD COLUMN location_name TEXT;