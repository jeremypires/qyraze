-- Legacy marketing site used `leads` for email waitlist.
-- Phase 1 reuses `leads` for Instagram prospects — rename the old table first.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.leads RENAME TO waitlist_leads;
  END IF;
END $$;
