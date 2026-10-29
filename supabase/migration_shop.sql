-- ============================================================
-- MORO'S · TIENDA (estilo WooCommerce) — productos, stock,
-- precios, cupones, pedidos y administración.
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Se puede correr varias veces sin duplicar nada.
-- ============================================================

-- 1) PRODUCTOS -------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text default '',
  category text default 'otros',
  price numeric not null default 0 check (price >= 0),
  sale_price numeric check (sale_price is null or sale_price >= 0),
  sku text,
  stock integer,                     -- null = inventario ilimitado
  low_stock integer default 5,
  active boolean default true,       -- visible en la tienda
  featured boolean default false,    -- "popular" / destacado
  badge text,
  image text default '',
  options jsonb default '[]'::jsonb, -- [{ "size": "Personal", "price": 2.5 }]
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (active);
create index if not exists products_slug_idx on public.products (slug);

-- 2) CUPONES ---------------------------------------------------
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null default 'percent' check (type in ('percent', 'fixed')),
  amount numeric not null default 0 check (amount > 0),
  min_total numeric default 0 check (min_total >= 0),
  max_uses integer,                  -- null = sin límite
  used_count integer default 0,
  expires_at timestamptz,            -- null = sin caducidad
  active boolean default true,
  created_at timestamptz default now()
);

create index if not exists coupons_code_idx on public.coupons (upper(code));

-- 3) PEDIDOS: columnas de tienda -------------------------------
alter table public.orders add column if not exists status text default 'pending';
alter table public.orders add column if not exists subtotal numeric default 0;
alter table public.orders add column if not exists discount numeric default 0;
alter table public.orders add column if not exists coupon_code text;
alter table public.orders add column if not exists updated_at timestamptz default now();

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- 4) ADMINISTRADORES -------------------------------------------
alter table public.profiles add column if not exists is_admin boolean default false;

-- 5) SEGURIDAD (RLS) -------------------------------------------
alter table public.products enable row level security;
alter table public.coupons enable row level security;

-- La tienda puede leer productos activos; nadie escribe con la clave pública.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated using (active = true);

-- Los cupones NO se leen desde el navegador (se validan en el servidor).
drop policy if exists coupons_no_public on public.coupons;

-- Los pedidos: el cliente ve los suyos (política ya existente).
-- El administrador usa la clave de servicio desde el servidor.

-- 6) INVENTARIO ATÓMICO ----------------------------------------
-- Descuenta stock solo si alcanza. Devuelve true si lo logró.
create or replace function public.decrement_stock(p_id uuid, p_qty integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  updated integer;
begin
  update public.products
     set stock = stock - p_qty,
         updated_at = now()
   where id = p_id
     and stock is not null
     and stock >= p_qty;

  get diagnostics updated = row_count;
  return updated > 0;
end;
$$;

-- Devuelve stock al cancelar un pedido.
create or replace function public.restore_stock(p_id uuid, p_qty integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products
     set stock = stock + p_qty,
         updated_at = now()
   where id = p_id
     and stock is not null;
end;
$$;

grant execute on function public.decrement_stock(uuid, integer) to authenticated, anon;
grant execute on function public.restore_stock(uuid, integer) to authenticated, anon;
