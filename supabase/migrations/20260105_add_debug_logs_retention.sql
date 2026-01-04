-- Retention policy for debug_logs: keep 7 days.

-- One-time cleanup to enforce current retention.
DELETE FROM public.debug_logs
WHERE created_at < now() - interval '7 days';

-- Schedule daily cleanup at 03:00 (DB timezone) via pg_cron.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron extension not installed; skipping debug_logs retention job.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'debug_logs_retention_7d'
  ) THEN
    PERFORM cron.schedule(
      'debug_logs_retention_7d',
      '0 3 * * *',
      $job$DELETE FROM public.debug_logs
        WHERE created_at < now() - interval '7 days';$job$
    );
  END IF;
END $$;
