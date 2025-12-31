-- Add best_before field to food_posts table for availability tracking
ALTER TABLE public.food_posts 
ADD COLUMN best_before TIMESTAMP WITH TIME ZONE;