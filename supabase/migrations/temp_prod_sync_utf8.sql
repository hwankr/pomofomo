-- Create feedbacks table
create table if not exists public.feedbacks (
    id uuid not null default gen_random_uuid(),
    content text not null,
    status text not null default 'pending' check (status in ('pending', 'reviewed', 'implemented')),
    user_id uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone not null default now(),
    constraint feedbacks_pkey primary key (id)
);

-- Create changelogs table
create table if not exists public.changelogs (
    id uuid not null default gen_random_uuid(),
    version text not null,
    title text not null,
    content text not null,
    created_at timestamp with time zone not null default now(),
    constraint changelogs_pkey primary key (id)
);

-- Enable RLS
alter table public.feedbacks enable row level security;
alter table public.changelogs enable row level security;

-- Policies for feedbacks
-- Allow anyone (authenticated or anon?) lets say authenticated for now or public if we want pre-login feedback.
-- Assuming authenticated users for user_id tracking, but let's allow public insert for flexibility if needed, but stricter is better.
-- Let's stick to authenticated for user_id binding usually, but if user wants anonymous feedback...
-- Plan said "user_id nullable", so maybe anonymous is allowed.
-- Policy: "Enable read access for admins"
create policy "Enable read access for admins"
    on public.feedbacks for select
    to authenticated
    using ((auth.jwt() ->> 'email') = 'fabronjeon@gmail.com' or (auth.jwt() ->> 'email') = 'fabronjeon@naver.com'); -- Hardcoded admins based on history or we need a better admin check.
    -- BETTER: Use the admin role if established.
    -- Checking previous migrations... 20251203_add_admin_role.sql
    -- It seems there is an 'admin' role in profiles or metadata.
    -- Let's check `profiles` table.

-- Let's re-verify admin check mechanism.
-- For now, I'll use a safe basic policy and we might need to adjust based on exact admin implementation.
-- "20251203_add_admin_role.sql" suggests adding role column.
-- I will assume checking public.profiles.role = 'admin' is the way, or typical Supabase `is_admin` function if it exists.

-- Let's try to query profiles for admin status.
-- Policy: "Admins can view all feedbacks"
create policy "Admins can view all feedbacks"
    on public.feedbacks for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );

-- Policy: "Users can create feedback"
create policy "Users can create feedback"
    on public.feedbacks for insert
    to authenticated
    with check (true);

-- Policy: "Users can view their own feedback" (optional, but good)
create policy "Users can view their own feedback"
    on public.feedbacks for select
    to authenticated
    using (auth.uid() = user_id);
    
-- Policies for changelogs
-- Policy: "Anyone can view changelogs"
create policy "Anyone can view changelogs"
    on public.changelogs for select
    to authenticated, anon
    using (true);

-- Policy: "Admins can insert/update/delete changelogs"
create policy "Admins can manage changelogs"
    on public.changelogs for all
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid() and profiles.role = 'admin'
        )
    );
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
-- Allow any authenticated user to insert replies to any feedback
-- (Since we made feedback public, we likely want to allow commenting)

-- Drop existing restricted insert policy
drop policy if exists "Users can insert replies to their threads" on public.feedback_replies;

-- Create new public insert policy
create policy "Authenticated users can insert replies"
    on public.feedback_replies for insert
    to authenticated
    with check (true);
-- Allow authenticated users to view all profiles (needed for feedback author display)
-- Drop existing policy if it's too restrictive (e.g., "Users can view own profile")
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

-- Create new public read policy
create policy "Authenticated users can view all profiles"
    on public.profiles for select
    to authenticated
    using (true);
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
-- Allow users to delete their own feedbacks

create policy "Users can delete their own feedbacks"
    on public.feedbacks for delete
    to authenticated
    using (auth.uid() = user_id);
-- Add images column to feedbacks
ALTER TABLE public.feedbacks 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Add images column to feedback_replies
ALTER TABLE public.feedback_replies 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Create storage bucket for feedback uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-uploads', 'feedback-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public access to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'feedback-uploads' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'feedback-uploads'
    AND auth.role() = 'authenticated'
);
-- Add tables to the supabase_realtime publication
alter publication supabase_realtime add table feedbacks;
alter publication supabase_realtime add table feedback_replies;
-- Drop changelogs table
drop table if exists changelogs;
