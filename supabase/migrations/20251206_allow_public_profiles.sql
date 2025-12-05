-- Allow authenticated users to view all profiles (needed for feedback author display)
-- Drop existing policy if it's too restrictive (e.g., "Users can view own profile")
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

-- Create new public read policy
create policy "Authenticated users can view all profiles"
    on public.profiles for select
    to authenticated
    using (true);
