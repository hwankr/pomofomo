-- Create feedback_replies table
create table if not exists public.feedback_replies (
    id uuid not null default gen_random_uuid(),
    feedback_id uuid not null references public.feedbacks(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    content text not null,
    created_at timestamp with time zone not null default now(),
    constraint feedback_replies_pkey primary key (id)
);

-- Enable RLS
alter table public.feedback_replies enable row level security;

-- Policies for feedback_replies

-- Policy: "Admins can view all replies"
create policy "Admins can view all replies"
    on public.feedback_replies for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policy: "Admins can insert replies"
create policy "Admins can insert replies"
    on public.feedback_replies for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policy: "Users can view replies in their threads"
-- This requires joining/checking feedbacks table.
create policy "Users can view replies in their threads"
    on public.feedback_replies for select
    to authenticated
    using (
        exists (
            select 1 from public.feedbacks
            where feedbacks.id = feedback_replies.feedback_id
            and feedbacks.user_id = auth.uid()
        )
    );

-- Policy: "Users can insert replies to their threads"
create policy "Users can insert replies to their threads"
    on public.feedback_replies for insert
    to authenticated
    with check (
        exists (
            select 1 from public.feedbacks
            where feedbacks.id = feedback_replies.feedback_id
            and feedbacks.user_id = auth.uid()
        )
    );
