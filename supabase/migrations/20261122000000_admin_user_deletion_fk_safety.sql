ALTER TABLE public.workshop_tickets
  DROP CONSTRAINT IF EXISTS workshop_tickets_created_by_fkey,
  ADD CONSTRAINT workshop_tickets_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.workshop_events
  DROP CONSTRAINT IF EXISTS workshop_events_created_by_fkey,
  ADD CONSTRAINT workshop_events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.repair_guides
  DROP CONSTRAINT IF EXISTS repair_guides_author_id_fkey,
  ADD CONSTRAINT repair_guides_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_created_by_fkey,
  ADD CONSTRAINT sales_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cash_entries
  DROP CONSTRAINT IF EXISTS cash_entries_created_by_fkey,
  ADD CONSTRAINT cash_entries_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cash_sessions
  ALTER COLUMN opened_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS cash_sessions_opened_by_fkey,
  ADD CONSTRAINT cash_sessions_opened_by_fkey
    FOREIGN KEY (opened_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS cash_sessions_closed_by_fkey,
  ADD CONSTRAINT cash_sessions_closed_by_fkey
    FOREIGN KEY (closed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey,
  ADD CONSTRAINT audit_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.cash_closures
  DROP CONSTRAINT IF EXISTS cash_closures_session_id_fkey,
  ADD CONSTRAINT cash_closures_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.cash_sessions(id) ON DELETE SET NULL;
