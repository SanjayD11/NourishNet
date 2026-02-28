-- =====================================================
-- NourishNet: Fix Collected Status Persistence
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================

-- 1. Allow 'completed' and 'cancelled' statuses in food_post_requests
ALTER TABLE public.food_post_requests 
DROP CONSTRAINT IF EXISTS food_post_requests_status_check;

ALTER TABLE public.food_post_requests 
ADD CONSTRAINT food_post_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled'));

-- 2. Create a secure function to mark food as collected
-- This runs as SECURITY DEFINER to bypass RLS (requester can't update food_posts they don't own)
CREATE OR REPLACE FUNCTION public.mark_food_collected(
  p_request_id UUID,
  p_post_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_id UUID;
  v_request_status TEXT;
  v_post_status TEXT;
BEGIN
  -- Validate the caller is the requester of this request
  SELECT requester_id, status INTO v_requester_id, v_request_status
  FROM public.food_post_requests
  WHERE id = p_request_id AND post_id = p_post_id;

  IF v_requester_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_requester_id != auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_request_status != 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Request must be accepted before marking as collected');
  END IF;

  -- Check food post is not already collected
  SELECT status INTO v_post_status FROM public.food_posts WHERE id = p_post_id;
  IF v_post_status = 'collected' THEN
    RETURN json_build_object('success', true, 'message', 'Already collected');
  END IF;

  -- Update food post status to collected
  UPDATE public.food_posts 
  SET status = 'collected' 
  WHERE id = p_post_id;

  -- Update request status to completed
  UPDATE public.food_post_requests 
  SET status = 'completed', updated_at = now() 
  WHERE id = p_request_id;

  RETURN json_build_object('success', true, 'message', 'Food marked as collected');
END;
$$;
