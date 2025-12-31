-- Protect user emails: restrict profiles SELECT to authenticated users only
-- 1) Remove public SELECT policy if present
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2) Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing insert/update policies as-is (already scoped to owner)
-- No data changes required
