import { supabase } from '@/lib/supabaseClient';

/** Llamada autenticada al panel de administración. */
export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session?.access_token) throw new Error('NO_SESSION');

  const res = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('NO_SESSION');
  if (res.status === 403) throw new Error('FORBIDDEN');
  if (!res.ok) throw new Error(data?.error || 'No se pudo completar la acción.');
  return data as T;
}

export function money(n: number): string {
  return `$${Number(n || 0).toFixed(2)}`;
}

export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
