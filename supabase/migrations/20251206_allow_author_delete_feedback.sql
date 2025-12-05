-- Allow users to delete their own feedbacks

create policy "Users can delete their own feedbacks"
    on public.feedbacks for delete
    to authenticated
    using (auth.uid() = user_id);
