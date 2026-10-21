ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ended_at timestamp with time zone;
