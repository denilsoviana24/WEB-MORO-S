'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getLoyaltyStamps, addLoyaltyStamp, resetLoyaltyStamps, LOYALTY_EVENT } from '@/lib/loyalty';
import type { OrderData } from '@/components/OrderTicket';

export interface Profile {
  id: string;
  email: string;
  name: string;
  stamps: number;
  total_orders: number;
  total_spent: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  authLoading: boolean;
  signUp: (username: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signIn: (usernameOrEmail: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Registra el premio reclamado y reinicia los sellos. Solo con sesión y tarjeta completa. */
  redeemReward: (code: string, title: string, goal: number) => Promise<{ ok: boolean; message: string }>;
  /** Guarda el pedido en Supabase y suma 1 sello. Solo con sesión. */
  saveOrder: (order: OrderData, goal: number) => Promise<{ stamps: number; completed: boolean } | null>;
  /** Suma manual (modo dueño) sobre la cuenta logueada. */
  addStampCloud: (goal: number) => Promise<{ stamps: number; completed: boolean } | null>;
  /** Reinicia sellos de la cuenta logueada. */
  resetStampsCloud: () => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  supabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function notifyStamps() {
  try {
    window.dispatchEvent(new Event(LOYALTY_EVENT));
  } catch {
    // ignorar
  }
}

/**
 * Los clientes entran con USUARIO + CONTRASEÑA.
 * Supabase exige un email, así que el usuario se convierte en
 * `usuario@club.moros` de forma transparente (el cliente nunca lo ve).
 * Si escriben un correo real, se usa tal cual (cuentas con email real).
 */
const CLUB_DOMAIN = 'club.moros';

function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

function isValidUsername(u: string): boolean {
  return /^[a-z0-9._-]{3,20}$/.test(u);
}

function toAuthEmail(input: string): string {
  const v = normalizeUsername(input);
  return v.includes('@') ? v : `${v}@${CLUB_DOMAIN}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return (data as Profile) ?? null;
  }, []);

  /** Crea el perfil si no existe y fusiona sellos locales (se queda con el mayor). */
  const ensureProfile = useCallback(
    async (u: User, goal: number): Promise<Profile | null> => {
      if (!supabase) return null;
      let prof = await fetchProfile(u.id);
      const local = getLoyaltyStamps(goal);
      if (!prof) {
        const name =
          (u.user_metadata as { name?: string })?.name || (u.email || '').split('@')[0] || 'Cliente';
        await supabase.from('profiles').upsert({ id: u.id, email: u.email || '', name, stamps: local });
        prof = await fetchProfile(u.id);
      } else if (local > (prof.stamps || 0)) {
        await supabase.from('profiles').update({ stamps: local }).eq('id', u.id);
        prof = { ...prof, stamps: local };
      }
      return prof;
    },
    [fetchProfile]
  );

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) setProfile(await ensureProfile(u, 20));
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setProfile(await ensureProfile(u, 20));
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, [ensureProfile]);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !user) return;
    setProfile(await fetchProfile(user.id));
  }, [user, fetchProfile]);

  const signUp = async (username: string, password: string) => {
    if (!supabase) return { ok: false, message: 'Login no configurado todavía. Pide al dueño activar Supabase.' };
    const user = normalizeUsername(username);
    if (!user.includes('@') && !isValidUsername(user)) {
      return { ok: false, message: 'El usuario debe tener 3-20 caracteres: letras, números, punto o guion.' };
    }
    if (password.length < 6) {
      return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email: toAuthEmail(username),
      password,
      options: { data: { name: user } },
    });
    if (error) return { ok: false, message: prettyError(error.message) };
    if (!data.session) {
      return { ok: true, message: '¡Cuenta creada! Ahora inicia sesión con tu usuario. 👇' };
    }
    return { ok: true, message: '¡Bienvenido al Club Moro’s! 🎉' };
  };

  const signIn = async (usernameOrEmail: string, password: string) => {
    if (!supabase) return { ok: false, message: 'Login no configurado todavía. Pide al dueño activar Supabase.' };
    const { error } = await supabase.auth.signInWithPassword({
      email: toAuthEmail(usernameOrEmail),
      password,
    });
    if (error) return { ok: false, message: prettyError(error.message) };
    return { ok: true, message: '¡Qué bueno verte de nuevo! 🍔' };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const saveOrder = async (order: OrderData, goal: number) => {
    if (!supabase || !user) return null;
    try {
      await supabase.from('orders').insert({
        user_id: user.id,
        order_number: order.number,
        items: order.items,
        total: order.total,
        delivery_type: order.deliveryType,
        payment_method: order.paymentMethod,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        delivery_address: order.deliveryAddress,
        order_notes: order.notes,
      });
      const current = profile?.stamps ?? (await fetchProfile(user.id))?.stamps ?? 0;
      const next = Math.min(current + 1, goal);
      const completed = next === goal && current < goal;
      await supabase
        .from('profiles')
        .update({
          stamps: next,
          total_orders: (profile?.total_orders ?? 0) + 1,
          total_spent: Number(((profile?.total_spent ?? 0) + order.total).toFixed(2)),
        })
        .eq('id', user.id);
      await refreshProfile();
      notifyStamps();
      return { stamps: next, completed };
    } catch {
      return null;
    }
  };

  const addStampCloud = async (goal: number) => {
    if (!supabase || !user) {
      // Sin sesión: sello local como antes
      return addLoyaltyStamp(goal);
    }
    try {
      const current = profile?.stamps ?? 0;
      if (current >= goal) return { stamps: current, completed: false };
      const next = current + 1;
      await supabase.from('profiles').update({ stamps: next }).eq('id', user.id);
      await refreshProfile();
      notifyStamps();
      return { stamps: next, completed: next === goal };
    } catch {
      return null;
    }
  };

  const resetStampsCloud = async () => {
    if (!supabase || !user) {
      resetLoyaltyStamps();
      return;
    }
    try {
      await supabase.from('profiles').update({ stamps: 0 }).eq('id', user.id);
      await refreshProfile();
      notifyStamps();
    } catch {
      // ignorar
    }
  };

  /** Reclama el premio: lo registra en Supabase y reinicia la tarjeta. */
  const redeemReward = async (code: string, title: string, goal: number) => {
    if (!supabase || !user) {
      resetLoyaltyStamps();
      return { ok: true, message: '¡Premio reclamado! Muestra el código en caja. 🎉' };
    }
    try {
      const prof = await fetchProfile(user.id);
      if (!prof || (prof.stamps ?? 0) < goal) {
        return { ok: false, message: 'Aún no completas tu tarjeta. ¡Sigue juntando sellos! 🍟' };
      }
      const { error: insError } = await supabase.from('redemptions').insert({
        user_id: user.id,
        reward_code: code,
        reward_title: title,
        stamps_used: goal,
      });
      if (insError) throw insError;
      await supabase.from('profiles').update({ stamps: 0 }).eq('id', user.id);
      await refreshProfile();
      notifyStamps();
      return { ok: true, message: `¡Premio registrado! Muestra el código ${code} en caja. 🎉` };
    } catch {
      return { ok: false, message: 'No se pudo registrar el premio. Intenta de nuevo.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        authLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        saveOrder,
        addStampCloud,
        resetStampsCloud,
        redeemReward,
        isAuthModalOpen,
        setAuthModalOpen,
        supabaseReady: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function prettyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Usuario o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already exists')) return 'Ese usuario ya existe. Inicia sesión. 👇';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email')) return 'Ese usuario no es válido.';
  return 'Ocurrió un error. Intenta de nuevo.';
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
