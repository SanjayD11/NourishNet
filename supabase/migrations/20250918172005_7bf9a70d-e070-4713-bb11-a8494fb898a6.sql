-- Add support for multiple images in food_posts table
ALTER TABLE public.food_posts 
ADD COLUMN images text[] DEFAULT '{}';

-- Update existing posts to move single image to images array
UPDATE public.food_posts 
SET images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url]
  ELSE '{}'
END
WHERE images IS NULL OR array_length(images, 1) IS NULL;