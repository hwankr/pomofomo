-- Cleanup orphaned rows before adding user_id foreign keys.

DELETE FROM public.study_sessions s
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = s.user_id
  );

DELETE FROM public.user_settings us
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users u
  WHERE u.id = us.user_id
);

DELETE FROM public.timer_states ts
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users u
  WHERE u.id = ts.user_id
);

-- Add missing foreign keys (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'study_sessions_user_id_fkey'
      AND conrelid = 'public.study_sessions'::regclass
  ) THEN
    ALTER TABLE public.study_sessions
      ADD CONSTRAINT study_sessions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_settings_user_id_fkey'
      AND conrelid = 'public.user_settings'::regclass
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'timer_states_user_id_fkey'
      AND conrelid = 'public.timer_states'::regclass
  ) THEN
    ALTER TABLE public.timer_states
      ADD CONSTRAINT timer_states_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
