-- Create food_post_requests table for requesting food posts
CREATE TABLE public.food_post_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_post_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Post owners and requesters can view requests" 
ON public.food_post_requests 
FOR SELECT 
USING (
  auth.uid() = requester_id OR 
  EXISTS (
    SELECT 1 FROM food_posts 
    WHERE food_posts.id = food_post_requests.post_id 
    AND food_posts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create requests" 
ON public.food_post_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Post owners can update request status" 
ON public.food_post_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM food_posts 
    WHERE food_posts.id = food_post_requests.post_id 
    AND food_posts.user_id = auth.uid()
  )
);

-- Create trigger for updating timestamp
CREATE TRIGGER update_food_post_requests_updated_at
BEFORE UPDATE ON public.food_post_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_post_requests;