'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Search,
  Users,
  Gift,
  Ticket,
  Percent,
  ChevronDown,
  Star,
  UserRound,
  ShoppingBag,
  Settings2,
  Save,
  X,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';
import { CLUB_FALLBACK, clearClubConfigCache, configFromRow, type ClubTier } from '@/lib/clubConfig';

interface Member {
  id: string;
  name: string;
  email: string;
  stamps: number;
  tier: { id: string; name: string; icon: string };
  orders: number;
  spent: number;
  lastOrderAt: string | null;
  lastOrderTotal: number | null;
  couponsUsed: number;
  discountSaved: number;
  rewards: number;
  createdAt: string;
  recentOrders: { id: string; total: number; coupon: string | null; status: string; createdAt: string }[];
  redemptions: { code: string; title: string; stamps: number; createdAt: string }[];
}

interface CouponUse {
  id: string;
  code: string;
  customer: string;
  email: string;
  phone: string;
  discount: number;
  total: number;
  guest?: boolean;
  createdAt: string;
}

interface Guest {
  key: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
  couponsUsed: number;
  discountSaved: number;
  firstOrderAt: string;
  lastOrderAt: string;
  lastTotal: number;
  coupons: string[];
}

interface Redemption {
  id: string;
  reward_code: string;
  reward_title: string;
  stamps_used: number;
  delivered_at: string | null;
  delivered?: boolean;
  created_at: string;
  customer: string;
  email: string;
}

interface Stats {
  members: number;
  newThisMonth: number;
  stampsInCards: number;
  rewardsRedeemed: number;
  rewardsPending?: number;
  couponsUsed: number;
  discountGiven: number;
  membersWithOrders: number;
  guests?: number;
  guestOrders?: number;
  guestSpent?: number;
  totalOrders?: number;
}

interface SettingsRow {
  stamps_goal?: number;
  auto_stamp?: boolean;
  reward_code?: string;
  reward_title?: string;
  reward_description?: string;
  bronze_orders?: number;
  silver_orders?: number;
  gold_orders?: number;
  section_title?: string;
  section_highlight?: string;
  section_subtitle?: string;
  section_note?: string;
  tiers?: ClubTier[] | null;
}

interface TierForm extends ClubTier {
  benefitsText: string;
}

interface ClubForm {
  stamps_goal: string;
  auto_stamp: boolean;
  reward_code: string;
  reward_title: string;
  reward_description: string;
  bronze_orders: string;
  silver_orders: string;
  gold_orders: string;
  section_title: string;
  section_highlight: string;
  section_subtitle: string;
  section_note: string;
  tiers: TierForm[];
}

const TIER_STYLE: Record<string, string> = {
  oro: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  plata: 'bg-zinc-300/15 text-zinc-200 border-zinc-400/40',
  bronce: 'bg-orange-700/20 text-orange-300 border-orange-700/40',
  nuevo: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

const input =
  'w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500';
const label = 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1';

function toForm(settings: SettingsRow | null): ClubForm {
  const c = configFromRow((settings || null) as Record<string, unknown> | null);
  return {
    stamps_goal: String(c.stampsGoal),
    auto_stamp: c.autoStamp,
    reward_code: c.reward.code,
    reward_title: c.reward.title,
    reward_description: c.reward.description,
    bronze_orders: String(c.levels.bronze),
    silver_orders: String(c.levels.silver),
    gold_orders: String(c.levels.gold),
    section_title: c.section.title,
    section_highlight: c.section.highlight,
    section_subtitle: c.section.subtitle,
    section_note: c.section.note,
    tiers: c.tiers.map((t) => ({ ...t, benefitsText: t.benefits.join('\n') })),
  };
}

export default function ClubPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [couponUses, setCouponUses] = useState<CouponUse[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [settings, setSettings] = useState<SettingsRow | null>(null);
  const [goal, setGoal] = useState(CLUB_FALLBACK.stampsGoal);
  const [stats, setStats] = useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ClubForm>(() => toForm(null));
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyMember, setBusyMember] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{
        members: Member[];
        guests: Guest[];
        couponUses: CouponUse[];
        redemptions: Redemption[];
        settings: SettingsRow | null;
        goal: number;
        stats: Stats;
      }>('/api/admin/club');
      setMembers(data.members);
      setGuests(data.guests || []);
      setCouponUses(data.couponUses);
      setRedemptions(data.redemptions);
      setSettings(data.settings);
      setGoal(Number(data.goal) || CLUB_FALLBACK.stampsGoal);
      setStats(data.stats);
      setDrafts({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return members.filter((m) => {
      const matchTier = !tier || m.tier.id === tier;
      const matchTerm =
        !term || m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term);
      return matchTier && matchTerm;
    });
  }, [members, q, tier]);

  const filteredGuests = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, ''))
    );
  }, [guests, q]);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(''), 3000);
  };

  /* ------------------------- editar reglas ------------------------- */
  const startEditing = () => {
    setForm(toForm(settings));
    setEditing(true);
    setError('');
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        action: 'settings',
        settings: {
          stamps_goal: Number(form.stamps_goal) || 1,
          auto_stamp: form.auto_stamp,
          reward_code: form.reward_code,
          reward_title: form.reward_title,
          reward_description: form.reward_description,
          bronze_orders: Number(form.bronze_orders) || 0,
          silver_orders: Number(form.silver_orders) || 0,
          gold_orders: Number(form.gold_orders) || 0,
          section_title: form.section_title,
          section_highlight: form.section_highlight,
          section_subtitle: form.section_subtitle,
          section_note: form.section_note,
          tiers: form.tiers.map((t) => ({
            ...t,
            benefits: t.benefitsText
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean),
          })),
        },
      };

      const res = await adminFetch<{ settings: SettingsRow }>('/api/admin/club', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setSettings(res.settings);
      setGoal(Number(res.settings.stamps_goal) || CLUB_FALLBACK.stampsGoal);
      clearClubConfigCache();
      setEditing(false);
      flash('Reglas del club guardadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const setTierField = (id: string, patch: Partial<TierForm>) => {
    setForm((f) => ({
      ...f,
      tiers: f.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  /* ------------------------- sellos ------------------------- */
  const saveStamps = async (member: Member, value: number) => {
    const stamps = Math.max(0, Math.min(goal, Math.round(value)));
    if (stamps === member.stamps) return;

    setBusyMember(member.id);
    try {
      const res = await adminFetch<{ member: { stamps: number } }>('/api/admin/club', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'member', id: member.id, stamps }),
      });
      const next = Number(res.member.stamps);
      setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, stamps: next } : m)));
      setDrafts((d) => ({ ...d, [member.id]: String(next) }));
      flash(`Sellos de ${member.name}: ${next}/${goal}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar los sellos.');
    } finally {
      setBusyMember(null);
    }
  };

  const renameMember = async (member: Member) => {
    const name = window.prompt('Nombre del cliente:', member.name);
    if (!name || name.trim() === member.name) return;
    try {
      await adminFetch('/api/admin/club', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'member', id: member.id, name: name.trim() }),
      });
      setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, name: name.trim() } : m)));
      flash('Nombre actualizado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el nombre.');
    }
  };

  /* ------------------------- premios ------------------------- */
  const toggleRedemption = async (redemption: Redemption) => {
    const delivered = !redemption.delivered_at;
    try {
      await adminFetch('/api/admin/club', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'redemption', id: redemption.id, delivered }),
      });
      setRedemptions((list) =>
        list.map((r) =>
          r.id === redemption.id
            ? { ...r, delivered, delivered_at: delivered ? new Date().toISOString() : null }
            : r
        )
      );
      flash(delivered ? 'Premio marcado como entregado.' : 'Premio marcado como pendiente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el premio.');
    }
  };

  if (loading) return <p className="text-sm text-zinc-400">Cargando Club Moro&apos;s…</p>;

  const cards = stats
    ? [
        { label: 'Miembros', value: stats.members, icon: <Users className="w-4 h-4" />, tint: 'text-sky-400' },
        { label: 'Nuevos este mes', value: stats.newThisMonth, icon: <Star className="w-4 h-4" />, tint: 'text-emerald-400' },
        { label: 'Sellos en tarjetas', value: stats.stampsInCards, icon: <Ticket className="w-4 h-4" />, tint: 'text-amber-400' },
        { label: 'Premios canjeados', value: stats.rewardsRedeemed, icon: <Gift className="w-4 h-4" />, tint: 'text-violet-400' },
        { label: 'Cupones usados', value: stats.couponsUsed, icon: <Percent className="w-4 h-4" />, tint: 'text-orange-400' },
        { label: 'Descuentos otorgados', value: money(stats.discountGiven), icon: <Percent className="w-4 h-4" />, tint: 'text-red-400' },
        { label: 'Pedidos totales', value: stats.totalOrders ?? 0, icon: <ShoppingBag className="w-4 h-4" />, tint: 'text-teal-400' },
        { label: 'Compras sin cuenta', value: stats.guestOrders ?? 0, icon: <UserRound className="w-4 h-4" />, tint: 'text-fuchsia-400' },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Club Moro&apos;s</h2>
          <p className="text-xs text-zinc-400">
            Clientes, visitas, sellos, premios y promociones. Todo editable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startEditing}
            className="flex items-center gap-2 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3 py-2 rounded-xl"
          >
            <Settings2 className="w-3.5 h-3.5" /> Editar club
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
      )}
      {notice && (
        <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">{notice}</p>
      )}

      {/* ---------------- Editor de reglas y textos ---------------- */}
      {editing && (
        <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-4 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" /> Reglas, premio y textos de la web
            </h3>
            <button onClick={() => setEditing(false)} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Meta de sellos</label>
              <input
                className={input}
                type="number"
                min={1}
                max={100}
                value={form.stamps_goal}
                onChange={(e) => setForm({ ...form, stamps_goal: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex items-end">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 pb-2.5">
                <input
                  type="checkbox"
                  checked={form.auto_stamp}
                  onChange={(e) => setForm({ ...form, auto_stamp: e.target.checked })}
                  className="accent-amber-500"
                />
                Sumar 1 sello automáticamente con cada pedido de la web
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-2">Premio de la tarjeta</h4>
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className={label}>Nombre del premio</label>
                <input
                  className={input}
                  value={form.reward_title}
                  onChange={(e) => setForm({ ...form, reward_title: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Código</label>
                <input
                  className={input}
                  value={form.reward_code}
                  onChange={(e) => setForm({ ...form, reward_code: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className={label}>Plata desde (pedidos)</label>
                <input
                  className={input}
                  type="number"
                  min={0}
                  value={form.silver_orders}
                  onChange={(e) => setForm({ ...form, silver_orders: e.target.value })}
                />
              </div>
              <div className="sm:col-span-4">
                <label className={label}>Descripción del premio</label>
                <textarea
                  className={input}
                  rows={2}
                  value={form.reward_description}
                  onChange={(e) => setForm({ ...form, reward_description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className={label}>Bronce desde (pedidos)</label>
              <input
                className={input}
                type="number"
                min={0}
                value={form.bronze_orders}
                onChange={(e) => setForm({ ...form, bronze_orders: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Plata desde (pedidos)</label>
              <input
                className={input}
                type="number"
                min={0}
                value={form.silver_orders}
                onChange={(e) => setForm({ ...form, silver_orders: e.target.value })}
              />
            </div>
            <div>
              <label className={label}>Oro desde (pedidos)</label>
              <input
                className={input}
                type="number"
                min={0}
                value={form.gold_orders}
                onChange={(e) => setForm({ ...form, gold_orders: e.target.value })}
              />
            </div>
          </div>

          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-2">Textos de la sección web</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Título</label>
                <input
                  className={input}
                  value={form.section_title}
                  onChange={(e) => setForm({ ...form, section_title: e.target.value })}
                />
              </div>
              <div>
                <label className={label}>Palabras resaltadas</label>
                <input
                  className={input}
                  value={form.section_highlight}
                  onChange={(e) => setForm({ ...form, section_highlight: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Subtítulo</label>
                <textarea
                  className={input}
                  rows={2}
                  value={form.section_subtitle}
                  onChange={(e) => setForm({ ...form, section_subtitle: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Nota de la tarjeta</label>
                <textarea
                  className={input}
                  rows={2}
                  value={form.section_note}
                  onChange={(e) => setForm({ ...form, section_note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider mb-2">
              Tarjetas de niveles (se ven en la web)
            </h4>
            <div className="grid lg:grid-cols-3 gap-3">
              {form.tiers.map((t) => (
                <div key={t.id} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.icon || '⭐'}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">{t.id}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_70px] gap-2">
                    <div>
                      <label className={label}>Nombre</label>
                      <input
                        className={input}
                        value={t.name}
                        onChange={(e) => setTierField(t.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={label}>Icono</label>
                      <input
                        className={input}
                        value={t.icon}
                        onChange={(e) => setTierField(t.id, { icon: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Visitas</label>
                    <input
                      className={input}
                      value={t.visits}
                      onChange={(e) => setTierField(t.id, { visits: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label}>Plato / regalo</label>
                    <input
                      className={input}
                      value={t.dish.name}
                      onChange={(e) => setTierField(t.id, { dish: { ...t.dish, name: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className={label}>Etiqueta</label>
                    <input
                      className={input}
                      value={t.dish.tag}
                      onChange={(e) => setTierField(t.id, { dish: { ...t.dish, tag: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className={label}>Imagen (URL)</label>
                    <input
                      className={input}
                      value={t.dish.image}
                      onChange={(e) => setTierField(t.id, { dish: { ...t.dish, image: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className={label}>Beneficios (uno por línea)</label>
                    <textarea
                      className={input}
                      rows={3}
                      value={t.benefitsText}
                      onChange={(e) => setTierField(t.id, { benefitsText: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar cambios
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3">
            <div className={`${c.tint} mb-1.5`}>{c.icon}</div>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider leading-tight">{c.label}</p>
            <p className="text-xl font-black text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            placeholder="Buscar por nombre o correo…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        >
          <option value="">Todos los niveles</option>
          <option value="nuevo">Nuevos</option>
          <option value="bronce">Moro Bronce</option>
          <option value="plata">Moro Plata</option>
          <option value="oro">Moro Oro</option>
        </select>
      </div>

      {/* Miembros */}
      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Sin miembros todavía</p>
          <p className="text-xs text-zinc-500 mt-1">Aquí verás a cada cliente que cree su cuenta.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => {
            const isOpen = open === m.id;
            const pct = Math.min(100, (m.stamps / goal) * 100);
            const draft = drafts[m.id] ?? String(m.stamps);
            return (
              <div key={m.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setOpen(isOpen ? null : m.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-[170px]"
                  >
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <div>
                      <p className="text-sm font-black text-white flex items-center gap-1.5">
                        {m.name}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            renameMember(m);
                          }}
                          className="text-zinc-500 hover:text-amber-400"
                          title="Cambiar nombre"
                        >
                          <Pencil className="w-3 h-3" />
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${TIER_STYLE[m.tier.id] || TIER_STYLE.nuevo}`}
                        >
                          {m.tier.icon} {m.tier.name.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-500">{m.email}</p>
                    </div>
                  </button>

                  {/* Sellos editables */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => saveStamps(m, m.stamps - 1)}
                      disabled={m.stamps <= 0 || busyMember === m.id}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30"
                      title="Quitar un sello"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={goal}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                      onBlur={() => saveStamps(m, Number(draft))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="w-12 bg-zinc-950 border border-zinc-700 rounded-lg px-1 py-1 text-xs text-center text-amber-400 font-black focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[11px] text-zinc-500">/ {goal}</span>
                    <button
                      onClick={() => saveStamps(m, m.stamps + 1)}
                      disabled={m.stamps >= goal || busyMember === m.id}
                      className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 disabled:opacity-30"
                      title="Sumar un sello"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="min-w-[130px]">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <div>
                      <p className="text-zinc-500">Pedidos</p>
                      <p className="font-black text-white">{m.orders}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Gastado</p>
                      <p className="font-black text-white">{money(m.spent)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Cupones</p>
                      <p className="font-black text-emerald-400">{m.couponsUsed}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Premios</p>
                      <p className="font-black text-violet-400">{m.rewards}</p>
                    </div>
                  </div>

                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-zinc-500">Último pedido</p>
                    <p className="text-[11px] font-bold text-zinc-300">
                      {m.lastOrderAt ? shortDate(m.lastOrderAt) : '—'}
                    </p>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-zinc-800 p-4 grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <h4 className="font-black text-white text-[11px] uppercase tracking-wider mb-2">Últimos pedidos</h4>
                      {m.recentOrders.length === 0 ? (
                        <p className="text-zinc-500">Aún no ha comprado.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.recentOrders.map((o) => (
                            <div key={o.id} className="flex items-center justify-between gap-2 text-zinc-300">
                              <span>
                                {shortDate(o.createdAt)}
                                {o.coupon && (
                                  <span className="ml-1.5 text-[10px] font-bold text-emerald-400">· {o.coupon}</span>
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <span className="text-zinc-500 text-[10px] uppercase">{o.status}</span>
                                <strong className="text-white">{money(o.total)}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-zinc-500">
                        Ahorro acumulado con cupones:{' '}
                        <strong className="text-emerald-400">{money(m.discountSaved)}</strong>
                      </p>
                    </div>

                    <div>
                      <h4 className="font-black text-white text-[11px] uppercase tracking-wider mb-2">Premios canjeados</h4>
                      {m.redemptions.length === 0 ? (
                        <p className="text-zinc-500">Todavía no ha canjeado premios.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.redemptions.map((r, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <span className="text-zinc-300">
                                <strong className="text-amber-400">{r.code}</strong> · {r.title}
                              </span>
                              <span className="text-zinc-500 text-[10px]">{shortDate(r.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-zinc-500">
                        Registrado el {shortDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Clientes sin cuenta */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <UserRound className="w-4 h-4 text-fuchsia-400" /> Clientes sin cuenta ({filteredGuests.length})
          </h3>
          <p className="text-[10px] text-zinc-500">
            Compras hechas por WhatsApp sin registrarse · {money(stats?.guestSpent ?? 0)} en ventas
          </p>
        </div>

        {filteredGuests.length === 0 ? (
          <p className="text-xs text-zinc-500">Todavía no hay compras de invitados.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredGuests.map((g) => (
              <div
                key={g.key}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-zinc-950/60 border border-zinc-800 rounded-xl px-3 py-2 text-[11px]"
              >
                <span className="font-black text-white min-w-[120px]">{g.name}</span>
                <span className="text-zinc-400">{g.phone || 'sin teléfono'}</span>
                <span className="text-zinc-500">
                  {g.orders} pedido{g.orders === 1 ? '' : 's'}
                </span>
                <span className="font-bold text-amber-400">{money(g.spent)}</span>
                {g.couponsUsed > 0 && (
                  <span className="text-emerald-400 font-bold">
                    {g.coupons.join(', ')} · {g.couponsUsed} uso{g.couponsUsed === 1 ? '' : 's'}
                  </span>
                )}
                <span className="ml-auto text-zinc-500">Último: {shortDate(g.lastOrderAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promociones usadas + premios */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-400" /> Uso de promociones ({couponUses.length})
          </h3>
          {couponUses.length === 0 ? (
            <p className="text-xs text-zinc-500">Nadie ha usado cupones todavía.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {couponUses.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-300">
                    <strong className="text-amber-400">{c.code}</strong> · {c.customer}
                    {c.guest && <span className="ml-1 text-zinc-500">(sin cuenta)</span>}
                  </span>
                  <span className="flex items-center gap-2 text-zinc-500">
                    <span className="text-emerald-400 font-bold">-{money(c.discount)}</span>
                    {shortDate(c.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
          <h3 className="font-black text-white text-sm mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-violet-400" /> Premios canjeados ({redemptions.length})
            {(stats?.rewardsPending ?? 0) > 0 && (
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {stats?.rewardsPending} pendiente{(stats?.rewardsPending ?? 0) === 1 ? '' : 's'} de entregar
              </span>
            )}
          </h3>
          {redemptions.length === 0 ? (
            <p className="text-xs text-zinc-500">Todavía nadie ha completado su tarjeta.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-300 truncate">
                    <strong className="text-violet-300">{r.reward_code}</strong> · {r.customer}
                  </span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-zinc-500">{shortDate(r.created_at)}</span>
                    <button
                      onClick={() => toggleRedemption(r)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border ${
                        r.delivered_at
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title={r.delivered_at ? 'Marcar como pendiente' : 'Marcar como entregado'}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {r.delivered_at ? 'Entregado' : 'Entregar'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
