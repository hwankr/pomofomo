-- Allow friends to view each other's study sessions
-- This assumes that if B has A as a friend (row in friendships where user_id=B, friend_id=A), then A can view B's sessions.
CREATE POLICY "Friends can view study sessions"
ON public.study_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE user_id = study_sessions.user_id AND friend_id = auth.uid()
  )
);

-- Allow group members to view each other's study sessions
CREATE POLICY "Group members can view study sessions"
ON public.study_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = study_sessions.user_id
  )
);
