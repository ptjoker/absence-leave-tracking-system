-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  student_number text UNIQUE,
  student_email text,
  first_name text,
  last_name text,
  course text,
  level_of_study text,
  cell_number text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'supervisor'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  personal_email text,
  account_status text NOT NULL DEFAULT 'active'::text,
  registration_status text NOT NULL DEFAULT 'approved'::text,
  registration_rejection_reason text,
  registration_reviewed_by uuid,
  registration_reviewed_at timestamp with time zone,
  email_verified_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_registration_reviewed_by_fkey FOREIGN KEY (registration_reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.absence_requests (
  id bigint NOT NULL DEFAULT nextval('absence_requests_id_seq'::regclass),
  user_id uuid NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text, 'Cancelled'::text])),
  date_range text,
  detail text,
  replacement text,
  reason text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  document_path text,
  document_name text,
  decline_reason text,
  supporting_document jsonb,
  CONSTRAINT absence_requests_pkey PRIMARY KEY (id),
  CONSTRAINT absence_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT absence_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.shifts (
  id bigint NOT NULL DEFAULT nextval('shifts_id_seq'::regclass),
  user_id uuid NOT NULL,
  shift_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  role text,
  location text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shifts_pkey PRIMARY KEY (id),
  CONSTRAINT shifts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT shifts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.shift_swap_requests (
  id bigint NOT NULL DEFAULT nextval('shift_swap_requests_id_seq'::regclass),
  requester_user_id uuid NOT NULL,
  colleague_user_id uuid NOT NULL,
  requester_shift_id bigint NOT NULL,
  colleague_shift_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending_colleague'::text CHECK (status = ANY (ARRAY['pending_colleague'::text, 'pending_supervisor'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text, 'colleague_accepted'::text, 'colleague_declined'::text, 'supervisor_approved'::text, 'supervisor_rejected'::text])),
  colleague_reason text,
  supervisor_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  colleague_decided_at timestamp with time zone,
  supervisor_decided_at timestamp with time zone,
  reason text,
  CONSTRAINT shift_swap_requests_pkey PRIMARY KEY (id),
  CONSTRAINT shift_swap_requests_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES public.profiles(id),
  CONSTRAINT shift_swap_requests_colleague_user_id_fkey FOREIGN KEY (colleague_user_id) REFERENCES public.profiles(id),
  CONSTRAINT shift_swap_requests_requester_shift_id_fkey FOREIGN KEY (requester_shift_id) REFERENCES public.shifts(id),
  CONSTRAINT shift_swap_requests_colleague_shift_id_fkey FOREIGN KEY (colleague_shift_id) REFERENCES public.shifts(id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id uuid NOT NULL,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.timetables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  content_type text NOT NULL,
  file_size integer NOT NULL,
  data text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'class'::text CHECK (kind = ANY (ARRAY['class'::text, 'exam'::text])),
  CONSTRAINT timetables_pkey PRIMARY KEY (id),
  CONSTRAINT timetables_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_presence (
  user_id uuid NOT NULL,
  ip_address text,
  user_agent text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_presence_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.closures (
  date date NOT NULL,
  type text NOT NULL,
  note text,
  affected_shifts integer NOT NULL DEFAULT 0,
  declared_by uuid,
  declared_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT closures_pkey PRIMARY KEY (date),
  CONSTRAINT closures_declared_by_fkey FOREIGN KEY (declared_by) REFERENCES public.profiles(id)
);