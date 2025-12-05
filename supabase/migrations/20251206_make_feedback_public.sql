-- Update RLS policies for feedbacks to be public
-- Drop existing private policy
drop policy if exists "Users can view their own feedback" on public.feedbacks;

-- Create new public policy
create policy "Authenticated users can view all feedbacks"
    on public.feedbacks for select
    to authenticated
    using (true);

-- Update RLS policies for feedback_replies
-- Drop existing private policy
drop policy if exists "Users can view replies in their threads" on public.feedback_replies;

-- Create new public policy (already covered by admin? No, we want users to see replies too)
-- "Users can view replies in their threads" was restricted to thread owner.
-- Now we want users to see replies if they can see the thread (which is now all threads).
create policy "Authenticated users can view all replies"
    on public.feedback_replies for select
    to authenticated
    using (true);
