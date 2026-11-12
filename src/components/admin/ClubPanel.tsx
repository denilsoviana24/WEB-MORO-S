'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Users, Gift, Ticket, Percent, ChevronDown, Star, UserRound, ShoppingBag } from 'lucide-react';
import { adminFetch, money, shortDate } from '@/lib/adminClient';
import { STAMPS_GOAL } from '@/data/loyaltyData';

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
  created_at: string;
  customer: string;
  email: string;
}

interface Stats {
  members: number;
  newThisMonth: number;
  stampsInCards: number;
  rewardsRedeemed: number;
  couponsUsed: number;
  discountGiven: number;
  membersWithOrders: number;
  guests?: number;
  guestOrders?: number;
  guestSpent?: number;
  totalOrders?: number;
}

const TIER_STYLE: Record<string, string> = {
  oro: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  plata: 'bg-zinc-300/15 text-zinc-200 border-zinc-400/40',
  bronce: 'bg-orange-700/20 text-orange-300 border-orange-700/40',
  nuevo: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export default function ClubPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [couponUses, setCouponUses] = useState<CouponUse[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{
        members: Member[];
        guests: Guest[];
        couponUses: CouponUse[];
        redemptions: Redemption[];
        stats: Stats;
      }>('/api/admin/club');
      setMembers(data.members);
      setGuests(data.guests || []);
      setCouponUses(data.couponUses);
      setRedemptions(data.redemptions);
      setStats(data.stats);
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
      (g) => g.name.toLowerCase().includes(term) || g.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, ''))
    );
  }, [guests, q]);

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
            Clientes registrados, visitas, sellos, premios y uso de promociones.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {error && (
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
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
            const pct = Math.min(100, (m.stamps / STAMPS_GOAL) * 100);
            return (
              <div key={m.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setOpen(isOpen ? null : m.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-[180px]"
                  >
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <div>
                      <p className="text-sm font-black text-white flex items-center gap-2">
                        {m.name}
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${TIER_STYLE[m.tier.id] || TIER_STYLE.nuevo}`}>
                          {m.tier.icon} {m.tier.name.toUpperCase()}
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-500">{m.email}</p>
                    </div>
                  </button>

                  <div className="min-w-[140px]">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Tarjeta</span>
                      <span className="font-black text-amber-400">{m.stamps}/{STAMPS_GOAL}</span>
                    </div>
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
                      <h4 className="font-black text-white text-[11px] uppercase tracking-wider mb-2">
                        Últimos pedidos
                      </h4>
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
                        Ahorro acumulado con cupones: <strong className="text-emerald-400">{money(m.discountSaved)}</strong>
                      </p>
                    </div>

                    <div>
                      <h4 className="font-black text-white text-[11px] uppercase tracking-wider mb-2">
                        Premios canjeados
                      </h4>
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

      {/* Promociones usadas */}
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
                  <span className="text-zinc-500 whitespace-nowrap">{shortDate(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
