-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add rating and reporting fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
ADD COLUMN total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),
ADD COLUMN rating_sum INTEGER DEFAULT 0 CHECK (rating_sum >= 0),
ADD COLUMN negative_reports INTEGER DEFAULT 0 CHECK (negative_reports >= 0),
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned'));

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.food_posts(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  report_reason TEXT,
  is_report BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (receiver_id, post_id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback
CREATE POLICY "Users can view feedback they're involved in"
ON public.feedback FOR SELECT
USING (auth.uid() = giver_id OR auth.uid() = receiver_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create feedback"
ON public.feedback FOR INSERT
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update giver's rating after feedback
CREATE OR REPLACE FUNCTION public.update_giver_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if rating is provided
  IF NEW.rating IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      rating_sum = rating_sum + NEW.rating,
      total_ratings = total_ratings + 1,
      average_rating = ROUND((rating_sum + NEW.rating)::numeric / (total_ratings + 1), 2)
    WHERE user_id = NEW.giver_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update rating after feedback insert
CREATE TRIGGER update_rating_after_feedback
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_giver_rating();

-- Function to handle auto-ban logic
CREATE OR REPLACE FUNCTION public.handle_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if it's a report
  IF NEW.is_report = true THEN
    UPDATE public.profiles
    SET 
      negative_reports = negative_reports + 1,
      status = CASE 
        WHEN negative_reports + 1 >= 3 THEN 'banned'
        ELSE status
      END
    WHERE user_id = NEW.giver_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to handle reports and auto-ban
CREATE TRIGGER handle_report_after_feedback
AFTER INSERT ON public.feedback
FOR EACH ROW
WHEN (NEW.is_report = true)
EXECUTE FUNCTION public.handle_report();

-- Function for admins to unban users
CREATE OR REPLACE FUNCTION public.unban_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can unban
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;
  
  UPDATE public.profiles
  SET status = 'active'
  WHERE user_id = target_user_id;
END;
$$;