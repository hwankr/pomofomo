-- Ensure users can view/edit their own data
-- Policies for study_sessions, timer_states, user_settings

-- 1. study_sessions
DROP POLICY IF EXISTS "Users can view their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can delete their own study sessions" ON public.study_sessions;

CREATE POLICY "Users can view their own study sessions"
ON public.study_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
ON public.study_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
ON public.study_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
ON public.study_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 2. timer_states
DROP POLICY IF EXISTS "Users can view their own timer state" ON public.timer_states;
DROP POLICY IF EXISTS "Users can insert their own timer state" ON public.timer_states;
DROP POLICY IF EXISTS "Users can update their own timer state" ON public.timer_states;
DROP POLICY IF EXISTS "Users can delete their own timer state" ON public.timer_states;

CREATE POLICY "Users can view their own timer state"
ON public.timer_states FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timer state"
ON public.timer_states FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timer state"
ON public.timer_states FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timer state"
ON public.timer_states FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 3. user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
ON public.user_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
