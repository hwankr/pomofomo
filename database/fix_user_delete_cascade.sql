-- Fix user deletion error by adding ON DELETE CASCADE to foreign keys

-- 1. profiles table
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. friend_requests table
ALTER TABLE public.friend_requests
DROP CONSTRAINT IF EXISTS friend_requests_sender_id_fkey;

ALTER TABLE public.friend_requests
ADD CONSTRAINT friend_requests_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE public.friend_requests
DROP CONSTRAINT IF EXISTS friend_requests_receiver_id_fkey;

ALTER TABLE public.friend_requests
ADD CONSTRAINT friend_requests_receiver_id_fkey
    FOREIGN KEY (receiver_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 3. friendships table
-- Note: friendships references profiles, so we need cascade here too
ALTER TABLE public.friendships
DROP CONSTRAINT IF EXISTS friendships_user_id_fkey;

ALTER TABLE public.friendships
ADD CONSTRAINT friendships_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.friendships
DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;

ALTER TABLE public.friendships
ADD CONSTRAINT friendships_friend_id_fkey
    FOREIGN KEY (friend_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
