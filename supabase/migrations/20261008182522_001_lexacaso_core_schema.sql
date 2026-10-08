/*
# LEXACASO — Core Database Schema

## Overview
Creates the complete schema for the LEXACASO legal case management platform:
- `public.profiles`: User profiles with role-based access (admin/cliente)
- `public.casos`: Legal cases (radicados) submitted by users
- `public.documentos`: Files/documents attached to cases
- Storage bucket for file uploads

## Design Decisions
- The ONLY admin account is `notipersonales2026@gmail.com` — enforced in the registration trigger
- All new registrations get `role = 'cliente'` automatically
- `karolparra2017@gmail.com` is explicitly set to `cliente` role
- RLS enabled on all tables with owner-scoped policies for authenticated users
- Admin gets full access to all cases and documents via policies
- Case tracking ID (radicado) is auto-generated and unique

## Tables

### public.profiles
- `id` (uuid, PK, references auth.users) — linked to Supabase Auth
- `email` (text, unique) — user email, synced from auth
- `full_name` (text) — display name
- `role` (text, default 'cliente') — 'admin' or 'cliente'
- `phone` (text) — phone number
- `cedula` (text) — national ID
- `address` (text) — physical address
- `created_at` (timestamptz) — profile creation timestamp
- `updated_at` (timestamptz) — last update timestamp

### public.casos
- `id` (uuid, PK) — case unique identifier
- `radicado` (text, unique) — human-readable tracking number (LEX-YYYY-NNNNNN)
- `user_id` (uuid, FK to auth.users) — owner of the case
- `nombre` (text) — full name of the person submitting
- `cedula` (text) — national ID
- `telefono` (text) — phone number
- `direccion` (text) — address
- `correo` (text) — email for notifications
- `descripcion` (text) — case description
- `estado` (text, default 'recibido') — case status
- `respuesta_admin` (text) — admin response/notes
- `created_at` (timestamptz) — submission timestamp
- `updated_at` (timestamptz) — last update timestamp

### public.documentos
- `id` (uuid, PK) — document unique identifier
- `caso_id` (uuid, FK to casos) — parent case
- `user_id` (uuid, FK to auth.users) — uploader
- `file_name` (text) — original file name
- `file_type` (text) — MIME type
- `file_size` (bigint) — file size in bytes
- `storage_path` (text) — path in storage bucket
- `created_at` (timestamptz) — upload timestamp

## Security
- RLS enabled on all three tables
- Profiles: users can read/update their own; admins can read/update all
- Casos: users can read/insert/update their own; admins have full CRUD on all
- Documentos: users can read/insert their own; admins can read/delete all
- Storage bucket `documentos` with policies for authenticated uploads
- Registration trigger ensures only 'notipersonales2026@gmail.com' gets admin role

## Triggers
- `handle_new_user`: After auth.users insert → creates profile with role logic
- `handle_updated_at`: Auto-updates updated_at on profile/caso changes
- `sync_profile_email`: Keeps profiles.email in sync with auth.users email changes
*/

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'cliente',
  phone text DEFAULT '',
  cedula text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Profiles: users can update their own
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Profiles: insert handled by trigger, but allow admin insert
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. CASOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.casos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  radicado text UNIQUE NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  cedula text DEFAULT '',
  telefono text DEFAULT '',
  direccion text DEFAULT '',
  correo text NOT NULL DEFAULT '',
  descripcion text DEFAULT '',
  estado text NOT NULL DEFAULT 'recibido',
  respuesta_admin text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.casos ENABLE ROW LEVEL SECURITY;

-- Casos: users can read their own; admins can read all
DROP POLICY IF EXISTS "casos_select_own" ON public.casos;
CREATE POLICY "casos_select_own"
ON public.casos FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Casos: users can insert their own
DROP POLICY IF EXISTS "casos_insert_own" ON public.casos;
CREATE POLICY "casos_insert_own"
ON public.casos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Casos: users can update their own; admins can update all
DROP POLICY IF EXISTS "casos_update_own" ON public.casos;
CREATE POLICY "casos_update_own"
ON public.casos FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Casos: only admins can delete
DROP POLICY IF EXISTS "casos_delete_admin" ON public.casos;
CREATE POLICY "casos_delete_admin"
ON public.casos FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- 3. DOCUMENTOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text DEFAULT '',
  file_size bigint DEFAULT 0,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Documentos: users can read their own; admins can read all
DROP POLICY IF EXISTS "documentos_select_own" ON public.documentos;
CREATE POLICY "documentos_select_own"
ON public.documentos FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Documentos: users can insert their own
DROP POLICY IF EXISTS "documentos_insert_own" ON public.documentos;
CREATE POLICY "documentos_insert_own"
ON public.documentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Documentos: admins can delete any
DROP POLICY IF EXISTS "documentos_delete_admin" ON public.documentos;
CREATE POLICY "documentos_delete_admin"
ON public.documentos FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_casos_user_id ON public.casos(user_id);
CREATE INDEX IF NOT EXISTS idx_casos_radicado ON public.casos(radicado);
CREATE INDEX IF NOT EXISTS idx_documentos_caso_id ON public.documentos(caso_id);

-- ============================================================
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_casos_updated_at ON public.casos;
CREATE TRIGGER trigger_casos_updated_at
BEFORE UPDATE ON public.casos
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. NEW USER REGISTRATION TRIGGER
-- ============================================================
-- Creates a profile for every new auth user.
-- Only 'notipersonales2026@gmail.com' gets 'admin' role.
-- All other accounts get 'cliente' role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN NEW.email = 'notipersonales2026@gmail.com' THEN 'admin'
      ELSE 'cliente'
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. EMAIL SYNC TRIGGER
-- ============================================================
-- Keeps profiles.email in sync when auth.users email changes
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE FUNCTION public.sync_profile_email();

-- ============================================================
-- 8. RADICADO GENERATOR FUNCTION
-- ============================================================
-- Generates a unique radicado number in format LEX-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION public.generate_radicado()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated text;
  year_int int;
  seq_val int;
BEGIN
  year_int := EXTRACT(YEAR FROM now());
  seq_val := nextval('public.casos_radicado_seq');
  generated := 'LEX-' || year_int || '-' || lpad(seq_val::text, 6, '0');
  RETURN generated;
END;
$$;

-- Sequence for radicado generation
CREATE SEQUENCE IF NOT EXISTS public.casos_radicado_seq START 1;

-- ============================================================
-- 9. FIX: Set karolparra2017@gmail.com to cliente role
-- ============================================================
-- If this account exists in profiles, ensure it is 'cliente'
UPDATE public.profiles
SET role = 'cliente'
WHERE email = 'karolparra2017@gmail.com' AND role = 'admin';

-- ============================================================
-- 10. STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documentos bucket
DROP POLICY IF EXISTS "storage_documentos_select_own" ON storage.objects;
CREATE POLICY "storage_documentos_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    auth.uid() = owner
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
);

DROP POLICY IF EXISTS "storage_documentos_insert_own" ON storage.objects;
CREATE POLICY "storage_documentos_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND auth.uid() = owner
);

DROP POLICY IF EXISTS "storage_documentos_update_own" ON storage.objects;
CREATE POLICY "storage_documentos_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    auth.uid() = owner
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
)
WITH CHECK (
  bucket_id = 'documentos'
  AND (
    auth.uid() = owner
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
);

DROP POLICY IF EXISTS "storage_documentos_delete_admin" ON storage.objects;
CREATE POLICY "storage_documentos_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    auth.uid() = owner
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
);
