-- ============================================================
-- MORO'S · Registro de premios reclamados
-- Ejecútalo en: Supabase Dashboard → SQL Editor → New query → Run
-- (después de migration_auth.sql)
-- ============================================================

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  reward_code text not null,
  reward_title text default '',
  stamps_used integer default 20,
  created_at timestamptz default now()
);

alter table public.redemptions enable row level security;

drop policy if exists "redemptions_select_own" on public.redemptions;
create policy "redemptions_select_own" on public.redemptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "redemptions_insert_own" on public.redemptions;
create policy "redemptions_insert_own" on public.redemptions
  for insert to authenticated with check (auth.uid() = user_id);
