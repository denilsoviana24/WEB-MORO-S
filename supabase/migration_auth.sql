-- ============================================================
-- MORO'S · Login + Puntos por pedido
-- Ejecútalo en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Perfiles de clientes (1 fila por usuario registrado)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text default '',
  stamps integer default 0 check (stamps >= 0),
  total_orders integer default 0,
  total_spent numeric default 0,
  created_at timestamptz default now()
);

-- 2) Pedidos (guarda los puntos de cada compra)
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

-- 3) Seguridad: cada cliente solo ve y toca SUS datos
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

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

-- 4) Crear perfil automáticamente al registrarse
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
