-- ============================================================
-- MORO'S · CATÁLOGO AVANZADO (estilo WooCommerce)
-- Variantes + SKU, atributos, tipos de producto, monedas,
-- impuestos, envíos, stock físico/reservado y reservas.
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Es idempotente: se puede correr varias veces.
-- ============================================================

-- 1) CONFIGURACIÓN CENTRAL -------------------------------------
create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  store_name text default 'Moro''s',
  base_currency text default 'USD',
  currency_decimals integer default 2,
  rounding_mode text default 'half_up'
    check (rounding_mode in ('none', 'up', 'down', 'half_up', 'half_even')),
  rounding_step numeric default 0.01 check (rounding_step > 0),
  prices_include_tax boolean default false,
  default_tax_rate_id uuid,
  reserve_minutes integer default 20 check (reserve_minutes between 1 and 240),
  low_stock_threshold integer default 5,
  checkout_min_total numeric default 0,
  updated_at timestamptz default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- 2) MONEDAS ---------------------------------------------------
create table if not exists public.currencies (
  code text primary key,                 -- USD, EUR, COP…
  name text not null,
  symbol text not null default '$',
  rate numeric not null default 1,       -- 1 unidad base = rate de esta moneda
  decimals integer default 2,
  symbol_position text default 'before' check (symbol_position in ('before', 'after')),
  active boolean default true,
  is_default boolean default false,
  updated_at timestamptz default now()
);

insert into public.currencies (code, name, symbol, rate, is_default)
values ('USD', 'Dólar estadounidense', '$', 1, true)
on conflict (code) do nothing;

-- 3) IMPUESTOS -------------------------------------------------
create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate numeric not null default 0 check (rate >= 0 and rate <= 100),
  country text default 'EC',
  region text,
  is_default boolean default false,
  active boolean default true,
  priority integer default 0,
  created_at timestamptz default now()
);

insert into public.tax_rates (name, rate, is_default)
select 'IVA 15%', 15, true
where not exists (select 1 from public.tax_rates);

update public.store_settings s
   set default_tax_rate_id = (select id from public.tax_rates order by is_default desc, priority limit 1)
 where s.id = 1 and s.default_tax_rate_id is null;

-- 4) ATRIBUTOS Y TÉRMINOS --------------------------------------
create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  input_type text default 'select' check (input_type in ('select', 'color', 'text')),
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.attribute_terms (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value text not null,
  slug text not null,
  sort_order integer default 0,
  unique (attribute_id, slug)
);

-- 5) PRODUCTOS: TIPO Y ATRIBUTOS -------------------------------
alter table public.products add column if not exists type text default 'simple'
  check (type in ('simple', 'variable', 'grouped', 'external'));
alter table public.products add column if not exists tax_rate_id uuid;
alter table public.products add column if not exists manage_stock boolean default false;
alter table public.products add column if not exists backorders text default 'no'
  check (backorders in ('no', 'notify', 'yes'));
alter table public.products add column if not exists dropship boolean default false;
alter table public.products add column if not exists supplier text;
alter table public.products add column if not exists weight numeric default 0;
alter table public.products add column if not exists grouped_ids jsonb default '[]'::jsonb;
alter table public.products add column if not exists external_url text;
alter table public.products add column if not exists button_text text;
alter table public.products add column if not exists attribute_ids jsonb default '[]'::jsonb;

-- 6) VARIANTES (SKU independiente por combinación) --------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  title text default '',
  attributes jsonb not null default '{}'::jsonb,  -- {"Tamaño":"Grande","Color":"Rojo"}
  price numeric not null default 0 check (price >= 0),
  sale_price numeric check (sale_price is null or sale_price >= 0),
  cost numeric default 0,
  stock integer default 0,
  reserved integer not null default 0 check (reserved >= 0),
  manage_stock boolean default true,
  backorders text default 'no' check (backorders in ('no', 'notify', 'yes')),
  weight numeric default 0,
  image text,
  dropship boolean default false,
  supplier text,
  supplier_sku text,
  active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists variants_product_idx on public.product_variants (product_id);
create index if not exists variants_sku_idx on public.product_variants (sku);

-- Cada producto existente recibe una variante por defecto (stock único).
insert into public.product_variants (product_id, sku, title, attributes, price, sale_price, stock, manage_stock, dropship, supplier)
select p.id,
       coalesce(nullif(p.sku, ''), 'MOR-' || upper(left(replace(p.id::text, '-', ''), 8))),
       'Único',
       '{}'::jsonb,
       p.price,
       p.sale_price,
       coalesce(p.stock, 0),
       (p.stock is not null),
       false,
       null
  from public.products p
 where not exists (select 1 from public.product_variants v where v.product_id = p.id);

-- 7) ENVÍOS ----------------------------------------------------
create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  regions jsonb default '[]'::jsonb,   -- ["Tulcán","Carchi"] o [] = todas
  active boolean default true,
  sort_order integer default 0
);

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references public.shipping_zones(id) on delete cascade,
  name text not null,
  type text default 'flat' check (type in ('flat', 'free', 'per_item')),
  cost numeric default 0 check (cost >= 0),
  per_item numeric default 0 check (per_item >= 0),
  free_over numeric,                   -- gratis desde este subtotal
  min_total numeric default 0,
  eta text,
  active boolean default true,
  sort_order integer default 0
);

insert into public.shipping_zones (name, regions, sort_order)
select 'Tulcán', '["Tulcán","Carchi","Ecuador"]'::jsonb, 0
where not exists (select 1 from public.shipping_zones);

insert into public.shipping_methods (zone_id, name, type, cost, per_item, free_over, eta, sort_order)
select z.id, 'Domicilio', 'flat', 1.50, 0, 25, '30-45 min', 0
  from public.shipping_zones z
 where not exists (select 1 from public.shipping_methods);

insert into public.shipping_methods (zone_id, name, type, cost, eta, sort_order)
select z.id, 'Retiro en local', 'free', 0, '15-20 min', 1
  from public.shipping_zones z
 where not exists (select 1 from public.shipping_methods m where m.type = 'free');

-- 8) STOCK: RESERVAS Y MOVIMIENTOS -----------------------------
create table if not exists public.stock_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  qty integer not null check (qty > 0),
  expires_at timestamptz not null default now() + interval '20 minutes',
  released boolean default false,
  created_at timestamptz default now()
);

create index if not exists reservations_variant_idx on public.stock_reservations (variant_id);
create index if not exists reservations_expires_idx on public.stock_reservations (expires_at);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.product_variants(id) on delete set null,
  product_id uuid,
  delta integer not null,
  reason text default 'manual',
  reference text,
  created_at timestamptz default now()
);

create index if not exists movements_variant_idx on public.stock_movements (variant_id, created_at desc);

-- 9) PEDIDOS: MONEDA, IMPUESTOS, ENVÍO -------------------------
alter table public.orders add column if not exists currency text default 'USD';
alter table public.orders add column if not exists tax_total numeric default 0;
alter table public.orders add column if not exists shipping_total numeric default 0;
alter table public.orders add column if not exists shipping_method text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists reserved_until timestamptz;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists stock_state text default 'reserved'
  check (stock_state in ('none', 'reserved', 'committed', 'released'));

-- 10) FUNCIONES DE INVENTARIO ----------------------------------

-- Reserva unidades. Devuelve el id de la reserva o null si no hay stock.
create or replace function public.reserve_stock(
  p_variant uuid, p_qty integer, p_minutes integer default 20, p_order uuid default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_res uuid;
begin
  if p_qty is null or p_qty <= 0 then return null; end if;

  update public.product_variants v
     set reserved = v.reserved + p_qty, updated_at = now()
   where v.id = p_variant
     and v.active
     and (v.manage_stock = false or v.backorders = 'yes' or v.stock - v.reserved >= p_qty)
  returning v.id into v_id;

  if v_id is null then return null; end if;

  insert into public.stock_reservations (order_id, variant_id, qty, expires_at)
  values (p_order, p_variant, p_qty, now() + make_interval(mins => greatest(1, p_minutes)))
  returning id into v_res;
  return v_res;
end;
$$;

-- Libera una reserva (cancelación o caducidad).
create or replace function public.release_reservation(p_reservation uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare r public.stock_reservations;
begin
  select * into r from public.stock_reservations where id = p_reservation and released = false;
  if not found then return; end if;

  update public.product_variants
     set reserved = greatest(0, reserved - r.qty), updated_at = now()
   where id = r.variant_id;

  update public.stock_reservations set released = true where id = r.id;
end;
$$;

-- Confirma la reserva: descuenta stock físico y deja el movimiento.
create or replace function public.commit_reservation(p_reservation uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare r public.stock_reservations;
begin
  select * into r from public.stock_reservations where id = p_reservation and released = false;
  if not found then return false; end if;

  update public.product_variants
     set stock = greatest(0, stock - r.qty),
         reserved = greatest(0, reserved - r.qty),
         updated_at = now()
   where id = r.variant_id;

  insert into public.stock_movements (variant_id, product_id, delta, reason, reference)
  select v.id, v.product_id, -r.qty, 'sale', coalesce(r.order_id::text, r.id::text)
    from public.product_variants v where v.id = r.variant_id;

  update public.stock_reservations set released = true where id = r.id;
  return true;
end;
$$;

-- Libera reservas caducadas (llamar al cargar el catálogo o por cron).
create or replace function public.expire_reservations()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n integer := 0;
  r record;
begin
  for r in
    select id from public.stock_reservations
     where released = false and expires_at < now()
  loop
    perform public.release_reservation(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Ajuste manual de inventario con registro.
create or replace function public.adjust_stock(p_variant uuid, p_delta integer, p_reason text default 'manual')
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_new integer; v_prod uuid;
begin
  update public.product_variants
     set stock = greatest(0, coalesce(stock, 0) + p_delta), updated_at = now()
   where id = p_variant
  returning stock, product_id into v_new, v_prod;

  if v_new is null then return null; end if;

  insert into public.stock_movements (variant_id, product_id, delta, reason)
  values (p_variant, v_prod, p_delta, coalesce(p_reason, 'manual'));

  return v_new;
end;
$$;

-- Sincroniza el stock "visible" del producto con la suma de sus variantes.
create or replace function public.sync_product_stock(p_product uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare total integer;
begin
  select coalesce(sum(stock), 0) into total from public.product_variants where product_id = p_product;
  update public.products set stock = total, manage_stock = true, updated_at = now() where id = p_product;
  return total;
end;
$$;

grant execute on function public.reserve_stock(uuid, integer, integer, uuid) to anon, authenticated;
grant execute on function public.release_reservation(uuid) to anon, authenticated;
grant execute on function public.commit_reservation(uuid) to anon, authenticated;
grant execute on function public.expire_reservations() to anon, authenticated;
grant execute on function public.adjust_stock(uuid, integer, text) to anon, authenticated;
grant execute on function public.sync_product_stock(uuid) to anon, authenticated;

-- 11) SEGURIDAD -------------------------------------------------
alter table public.product_variants enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_terms enable row level security;
alter table public.currencies enable row level security;
alter table public.tax_rates enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants
  for select to anon, authenticated using (active = true);

drop policy if exists attributes_public_read on public.attributes;
create policy attributes_public_read on public.attributes
  for select to anon, authenticated using (true);

drop policy if exists terms_public_read on public.attribute_terms;
create policy terms_public_read on public.attribute_terms
  for select to anon, authenticated using (true);

drop policy if exists currencies_public_read on public.currencies;
create policy currencies_public_read on public.currencies
  for select to anon, authenticated using (active = true);

drop policy if exists taxes_public_read on public.tax_rates;
create policy taxes_public_read on public.tax_rates
  for select to anon, authenticated using (active = true);

drop policy if exists zones_public_read on public.shipping_zones;
create policy zones_public_read on public.shipping_zones
  for select to anon, authenticated using (active = true);

drop policy if exists methods_public_read on public.shipping_methods;
create policy methods_public_read on public.shipping_methods
  for select to anon, authenticated using (active = true);

drop policy if exists settings_public_read on public.store_settings;
create policy settings_public_read on public.store_settings
  for select to anon, authenticated using (true);
