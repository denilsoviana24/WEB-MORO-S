-- ============================================================
-- MORO'S · CLUB EDITABLE
-- Reglas del club, premio, niveles y textos de la web.
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- Es idempotente.
-- ============================================================

create table if not exists public.club_settings (
  id integer primary key default 1 check (id = 1),
  stamps_goal integer not null default 20 check (stamps_goal between 1 and 100),
  auto_stamp boolean default true,

  reward_code text default 'MOROS-FIEL-20',
  reward_title text default 'Papi Completa Moro''s GRATIS',
  reward_description text default 'Completa todos los sellos de tu tarjeta fiel y reclama una Papi Completa Moro''s totalmente gratis en el local.',

  bronze_orders integer default 1,
  silver_orders integer default 7,
  gold_orders integer default 15,

  section_title text default 'Mientras más vienes,',
  section_highlight text default 'más ganas',
  section_subtitle text default 'Junta sellos en tu tarjeta fiel con cada visita y sube de nivel para desbloquear descuentos, regalos y promos exclusivas.',
  section_note text default 'Muestra tu tarjeta en el local para sellar tu visita. Cada pedido en la web suma 1 sello automáticamente 🍟. Al completar los sellos reclamas tu premio.',

  tiers jsonb,
  updated_at timestamptz default now()
);

insert into public.club_settings (id) values (1) on conflict (id) do nothing;

alter table public.club_settings enable row level security;

drop policy if exists club_settings_public_read on public.club_settings;
create policy club_settings_public_read on public.club_settings
  for select to anon, authenticated using (true);

grant select on public.club_settings to anon, authenticated;

-- Premios: marcar como entregados desde el panel
alter table public.redemptions add column if not exists delivered_at timestamptz;
alter table public.redemptions add column if not exists notes text;

grant select, update on public.redemptions to authenticated;
