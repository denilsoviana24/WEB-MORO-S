-- ============================================================
-- MORO'S · Usuarios únicos + vista pública de disponibilidad
-- Ejecútalo en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) El nombre de usuario no se puede repetir
alter table public.profiles
  add constraint profiles_name_unique unique (name);

-- 2) Vista pública SOLO con nombres (sin correos) para verificar disponibilidad
create or replace view public.usernames as
  select name as username from public.profiles;

grant select on public.usernames to anon, authenticated;
