-- ============================================================
-- MORO'S · Fecha del último correo de variedad (anti-spam)
-- Ejecútalo en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

alter table public.profiles
  add column if not exists last_variety_email_at timestamptz;
