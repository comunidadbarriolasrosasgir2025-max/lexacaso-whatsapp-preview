/*
# Notificaciones Table

## Overview
Creates a table to store email notification records for each case submission.
This serves as both an audit trail and a fallback when the email service is unavailable.

## Tables

### public.notificaciones
- `id` (uuid, PK) — notification unique identifier
- `caso_id` (uuid, FK to casos) — related case
- `user_id` (uuid, FK to auth.users) — user who triggered the notification
- `radicado` (text) — case tracking number
- `destinatario` (text) — recipient email
- `asunto` (text) — email subject
- `cuerpo_html` (text) — full HTML email content
- `estado` (text, default 'pendiente') — 'pendiente', 'enviada', 'fallida'
- `error_mensaje` (text) — error details if sending failed
- `created_at` (timestamptz) — creation timestamp

## Security
- RLS enabled
- Users can read their own notifications
- Admins can read all notifications
- Inserts handled by edge function with service role key (bypasses RLS)
*/

CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid REFERENCES public.casos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  radicado text NOT NULL,
  destinatario text NOT NULL,
  asunto text NOT NULL DEFAULT '',
  cuerpo_html text DEFAULT '',
  estado text NOT NULL DEFAULT 'pendiente',
  error_mensaje text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificaciones_select_own" ON public.notificaciones;
CREATE POLICY "notificaciones_select_own"
ON public.notificaciones FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_caso_id ON public.notificaciones(caso_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_id ON public.notificaciones(user_id);
