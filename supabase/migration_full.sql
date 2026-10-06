-- ============================================================
-- MORO'S · Base de datos completa (todo en uno)
-- Pégalo en: Supabase → SQL Editor → New query → Run
-- Se puede correr las veces que sea, no duplica nada.
-- ============================================================

-- 1) Perfiles de clientes
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text default '',
  stamps integer default 0 check (stamps >= 0),
  total_orders integer default 0,
  total_spent numeric default 0,
  created_at timestamptz default now()
);

-- Usuario único (sin repetir)
alter table public.profiles drop constraint if exists profiles_name_unique;
alter table public.profiles add constraint profiles_name_unique unique (name);

-- 2) Pedidos (puntos de cada compra)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  order_number text not null,
  items jsonb not null default '[]',
  total numeric not null default 0,
  delivery_type text default 'pickup',
  payment_method text default '',
  customer_name text default '',
  customer_phone text default '',
  delivery_address text default '',
  order_notes text default '',
  created_at timestamptz default now()
);

-- 3) Premios reclamados
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  reward_code text not null,
  reward_title text default '',
  stamps_used integer default 20,
  created_at timestamptz default now()
);

-- 4) Seguridad: cada cliente solo toca SUS datos
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.redemptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "redemptions_select_own" on public.redemptions;
create policy "redemptions_select_own" on public.redemptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "redemptions_insert_own" on public.redemptions;
create policy "redemptions_insert_own" on public.redemptions
  for insert to authenticated with check (auth.uid() = user_id);

-- 5) Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Confirmación automática (entrar directo, sin correo)
create or replace function public.auto_confirm_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists auto_confirm_on_signup on auth.users;
create trigger auto_confirm_on_signup
  after insert on auth.users
  for each row execute function public.auto_confirm_user();

-- 7) Vista pública de usuarios (solo nombres, para verificar disponibilidad)
create or replace view public.usernames as
  select name as username from public.profiles;

grant select on public.usernames to anon, authenticated;
