-- Allow admins to delete feedbacks
-- Using the profiles table to check for 'admin' role

create policy "Admins can delete feedbacks"
    on public.feedbacks for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );
