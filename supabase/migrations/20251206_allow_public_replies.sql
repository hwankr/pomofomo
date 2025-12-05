-- Allow any authenticated user to insert replies to any feedback
-- (Since we made feedback public, we likely want to allow commenting)

-- Drop existing restricted insert policy
drop policy if exists "Users can insert replies to their threads" on public.feedback_replies;

-- Create new public insert policy
create policy "Authenticated users can insert replies"
    on public.feedback_replies for insert
    to authenticated
    with check (true);
