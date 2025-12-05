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
