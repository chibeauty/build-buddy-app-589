-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.study_groups;

-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
  )
$$;

-- Recreate study_groups policy using the function
CREATE POLICY "Public groups are viewable by everyone" 
ON public.study_groups 
FOR SELECT 
USING (
  is_public = true 
  OR created_by = auth.uid() 
  OR public.is_group_member(auth.uid(), id)
);

-- Recreate group_members policy using the function
CREATE POLICY "Group members are viewable by group members" 
ON public.group_members 
FOR SELECT 
USING (
  public.is_group_member(auth.uid(), group_id)
  OR EXISTS (
    SELECT 1 FROM public.study_groups 
    WHERE id = group_members.group_id 
    AND is_public = true
  )
);