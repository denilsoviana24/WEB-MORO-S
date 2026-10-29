'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Phone, Mail, Inbox } from 'lucide-react';
import { adminFetch, shortDate } from '@/lib/adminClient';

interface Message {
  id: string;
  nombre: string;
  telefono: string;
  mensaje: string;
  fecha: string;
}

export default function MessagesPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<{ messages: Message[] }>('/api/admin/messages');
      setMessages(data.messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (m: Message) => {
    if (!confirm(`¿Borrar el mensaje de ${m.nombre || 'este cliente'}?`)) return;
    try {
      await adminFetch(`/api/admin/messages?id=${m.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Mensajes</h2>
          <p className="text-xs text-zinc-400">
            {messages.length} mensaje(s) del formulario de contacto
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
        <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Cargando mensajes…</p>
      ) : messages.length === 0 ? (
        <div className="text-center py-14 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <Inbox className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Bandeja vacía</p>
          <p className="text-xs text-zinc-500 mt-1">
            Los mensajes que envíen desde la sección de contacto aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-black text-white text-sm">{m.nombre || 'Sin nombre'}</span>
                {m.telefono && (
                  <a
                    href={`tel:${m.telefono}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    <Phone className="w-3 h-3" /> {m.telefono}
                  </a>
                )}
                <span className="text-[11px] text-zinc-500">{shortDate(m.fecha)}</span>
                <div className="ml-auto flex items-center gap-1">
                  {m.telefono && (
                    <a
                      href={`https://wa.me/${String(m.telefono).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                      title="Responder por WhatsApp"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => remove(m)}
                    className="p-2 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    title="Borrar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">{m.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
