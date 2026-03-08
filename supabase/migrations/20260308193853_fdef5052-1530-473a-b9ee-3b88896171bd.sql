
-- Allow reading profiles of users you share a board with
CREATE POLICY "Users can read shared user profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.board_shares
      WHERE (owner_id = auth.uid() AND guest_id = id)
         OR (guest_id = auth.uid() AND owner_id = id)
    )
  );

-- Drop the overly restrictive old policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
