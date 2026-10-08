/*
# Hardening Admin Role Enforcement

## Overview
This migration strengthens the admin role restriction to guarantee:
1. Only 'notipersonales2026@gmail.com' can ever have role 'admin' in public.profiles
2. 'karolparra2017@gmail.com' is explicitly set to 'cliente' if it exists
3. Any existing profile with role 'admin' that is NOT the authorized email gets demoted to 'cliente'
4. The trigger function is reconfirmed to assign 'cliente' to all new registrations

## Changes
- UPDATE: Demote any non-authorized admin profiles to 'cliente'
- UPDATE: Explicitly set karolparra2017@gmail.com to 'cliente' if exists
- No structural changes to tables (no DROP, no TRUNCATE, no ALTER of columns)
*/

-- 1. Demote ALL profiles that have 'admin' role but are NOT the authorized email
UPDATE public.profiles
SET role = 'cliente'
WHERE role = 'admin'
  AND email != 'notipersonales2026@gmail.com';

-- 2. Explicitly ensure karolparra2017@gmail.com is 'cliente'
UPDATE public.profiles
SET role = 'cliente'
WHERE email = 'karolparra2017@gmail.com';

-- 3. Reconfirm the trigger function is correct (idempotent re-creation)
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
