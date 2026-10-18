ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS registration_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS registration_reviewed_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS registration_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

UPDATE public.profiles
SET registration_status = 'approved'
WHERE registration_status IS NULL;
