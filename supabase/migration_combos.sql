-- ============================================================
-- MORO'S · COMBOS Y PROMOCIONES POR FECHAS
-- Un combo agrupa variantes con cantidades, aplica un % de
-- descuento y descuenta el inventario de cada componente.
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Es idempotente.
-- ============================================================

create table if not exists public.combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text default '',
  image text default '',
  discount_percent numeric default 0 check (discount_percent >= 0 and discount_percent <= 100),
  fixed_price numeric check (fixed_price is null or fixed_price >= 0),
  badge text,
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists combos_active_idx on public.combos (active);

create table if not exists public.combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references public.combos(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty integer not null default 1 check (qty > 0),
  unique (combo_id, variant_id)
);

create index if not exists combo_items_combo_idx on public.combo_items (combo_id);
create index if not exists combo_items_variant_idx on public.combo_items (variant_id);

alter table public.combos enable row level security;
alter table public.combo_items enable row level security;

drop policy if exists combos_public_read on public.combos;
create policy combos_public_read on public.combos
  for select to anon, authenticated using (active = true);

drop policy if exists combo_items_public_read on public.combo_items;
create policy combo_items_public_read on public.combo_items
  for select to anon, authenticated using (true);

-- Vigencia: un combo está vigente si está activo y hoy cae dentro del rango.
create or replace function public.combo_is_live(p_starts timestamptz, p_ends timestamptz)
returns boolean
language sql
immutable
as $$
  select (p_starts is null or now() >= p_starts)
     and (p_ends is null or now() <= p_ends);
$$;

grant execute on function public.combo_is_live(timestamptz, timestamptz) to anon, authenticated;
