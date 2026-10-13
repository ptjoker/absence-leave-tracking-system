ALTER TABLE public.absence_requests
ADD COLUMN IF NOT EXISTS supporting_document JSONB;
