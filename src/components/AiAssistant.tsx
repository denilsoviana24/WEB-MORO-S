'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { findItem } from '@/data/assistantData';
import { getBotReply, type BotAction } from '@/lib/assistantEngine';

interface ChatMsg {
  id: number;
  from: 'bot' | 'user';
  text: string;
  productIds?: string[];
  actions?: BotAction[];
}

let msgId = 0;
const nextId = () => ++msgId;

const STARTER_CHIPS = [
  'Recomiéndame algo rico 🍔',
  '¿Están abiertos?',
  '¿Hacen domicilio? 🛵',
  'Quiero reservar mesa',
];

const GREETING: ChatMsg = {
  id: 0,
  from: 'bot',
  text: '¡Hola! 👋 Soy Moro IA 🤖 Te recomiendo platos según tu antojo y te ayudo con horarios, domicilio, reservas y tu pedido. ¿Qué necesitas hoy?',
};

export default function AiAssistant() {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ ...GREETING, id: nextId() }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  const pushBot = (text: string, extra?: Partial<ChatMsg>) =>
    setMessages((prev) => [...prev, { id: nextId(), from: 'bot', text, ...extra }]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text }]);
    setInput('');
    setTyping(true);

    // Historial para la IA en la nube
    const history = [...messages.slice(-8).map((m) => ({
      role: m.from as 'user' | 'assistant',
      content: m.text,
    })), { role: 'user' as const, content: text }];

    // 1) Intentar cerebro IA en la nube (si está configurado)
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          // La IA responde texto; el cerebro local agrega productos/acciones si aplica
          const local = getBotReply(text);
          pushBot(String(data.reply), {
            productIds: local.productIds,
            actions: local.actions,
          });
          setTyping(false);
          return;
        }
      }
    } catch {
      // sin conexión o sin IA configurada → cerebro local
    }

    // 2) Cerebro local (siempre funciona, sin internet extra ni costos)
    window.setTimeout(() => {
      const local = getBotReply(text);
      pushBot(local.text, { productIds: local.productIds, actions: local.actions });
      setTyping(false);
    }, 600);
  };

  const handleAction = (a: BotAction) => {
    if (a.event === 'reserve') {
      try {
        window.dispatchEvent(new Event('moros:open-reserve'));
      } catch {
        // ignorar
      }
    }
  };

  const handleAdd = (id: string) => {
    const item = findItem(id);
    if (!item) return;
    addToCart(item);
    setAdded(id);
    window.setTimeout(() => setAdded(null), 2000);
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 text-zinc-950 flex items-center justify-center shadow-[0_0_25px_rgba(255,150,40,0.55)]"
            aria-label="Abrir asistente Moro IA"
            title="Moro IA · ¿Te ayudo?"
          >
            <Bot className="w-7 h-7" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-zinc-950" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ventana de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-5 left-5 z-[60] w-[calc(100vw-2.5rem)] max-w-sm h-[540px] max-h-[75vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Cabecera */}
            <div className="px-4 py-3 border-b border-zinc-900 bg-gradient-to-r from-orange-600/20 via-zinc-900 to-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-zinc-950" />
                </div>
                <div>
                  <p className="font-black text-white text-sm leading-tight">Moro IA</p>
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En línea · ventas y ayuda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes */}
            <div ref={boxRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.from === 'user'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-semibold rounded-br-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* Productos recomendados */}
                    {m.productIds && m.productIds.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {m.productIds.map((pid) => {
                          const item = findItem(pid);
                          if (!item) return null;
                          return (
                            <div
                              key={pid}
                              className="flex items-center gap-2.5 bg-zinc-950 border border-zinc-800 rounded-xl p-2"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-11 h-11 rounded-lg object-cover shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-white truncate">{item.name}</p>
                                <p className="text-xs font-black text-amber-400">${item.price.toFixed(2)}</p>
                              </div>
                              <button
                                onClick={() => handleAdd(pid)}
                                className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                                title={`Agregar ${item.name}`}
                                aria-label={`Agregar ${item.name}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                        {added && (
                          <p className="text-[11px] font-bold text-emerald-400">¡Agregado al pedido! 🛒</p>
                        )}
                      </div>
                    )}

                    {/* Acciones */}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.actions.map((a) =>
                          a.href ? (
                            <a
                              key={a.label}
                              href={a.href}
                              className="text-[11px] font-black bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 px-2.5 py-1.5 rounded-xl transition-colors"
                            >
                              {a.label}
                            </a>
                          ) : (
                            <button
                              key={a.label}
                              onClick={() => handleAction(a)}
                              className="text-[11px] font-black bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-300 px-2.5 py-1.5 rounded-xl transition-colors"
                            >
                              {a.label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="w-2 h-2 rounded-full bg-amber-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chips rápidos */}
            {messages.length <= 1 && !typing && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                {STARTER_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="shrink-0 text-[11px] font-bold bg-zinc-900 border border-zinc-700 hover:border-orange-500 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Entrada */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-zinc-900 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escríbeme… Ej. recomiéndame algo barato"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
