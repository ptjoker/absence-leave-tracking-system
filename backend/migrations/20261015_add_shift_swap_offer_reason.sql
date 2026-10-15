ALTER TABLE public.shift_swap_requests
ADD COLUMN IF NOT EXISTS reason TEXT;
