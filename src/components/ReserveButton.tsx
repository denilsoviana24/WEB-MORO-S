'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, X, User, Phone, CalendarDays, Clock, Users, FileText, Send } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';

const OPEN_HOUR = RESTAURANT_INFO.openHour; // 17
const CLOSE_HOUR = RESTAURANT_INFO.closeHour; // 23

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReserveButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // El asistente IA puede abrir este formulario ("quiero reservar mesa")
  useEffect(() => {
    const openReserve = () => setOpen(true);
    window.addEventListener('moros:open-reserve', openReserve);
    return () => window.removeEventListener('moros:open-reserve', openReserve);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }
    if (!date) {
      setError('Elige la fecha de tu reserva.');
      return;
    }
    if (date < todayISO()) {
      setError('La fecha no puede ser anterior a hoy.');
      return;
    }
    const [h, m] = time.split(':').map(Number);
    const minutes = h * 60 + m;
    if (minutes < OPEN_HOUR * 60 || minutes >= CLOSE_HOUR * 60) {
      setError(`El horario de atención es de ${OPEN_HOUR}:00 a ${CLOSE_HOUR}:00.`);
      return;
    }
    const n = parseInt(guests, 10);
    if (!n || n < 1 || n > 30) {
      setError('Indica el número de personas (1 a 30).');
      return;
    }

    let message = `*🪑 NUEVA RESERVA DE MESA - MORO'S*\n`;
    message += `-----------------------------------------\n`;
    message += `*Cliente:* ${name.trim()}\n`;
    if (phone.trim()) message += `*Teléfono:* ${phone.trim()}\n`;
    message += `*Fecha:* ${date}\n`;
    message += `*Hora:* ${time}\n`;
    message += `*Personas:* ${n}\n`;
    if (notes.trim()) message += `*Notas:* ${notes.trim()}\n`;
    message += `-----------------------------------------\n`;
    message += `¡Gracias por preferir Moro's! Quedo a la espera de su confirmación.`;

    window.open(
      `https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
    setOpen(false);
  };

  const inputCls =
    'w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 [color-scheme:dark]';

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-zinc-950 font-black text-sm px-4 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(255,85,0,0.5)]"
        aria-label="Reservar mesa"
        title="Reservar mesa"
      >
        <Armchair className="w-5 h-5" />
        <span className="hidden sm:inline">Reservar mesa</span>
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 border-2 border-zinc-950" />
        </span>
      </motion.button>

      {/* Modal de reserva */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-zinc-950/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="relative w-full sm:max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-zinc-900 bg-zinc-900/50 flex items-center justify-between sticky top-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white">Reservar mesa</h2>
                    <p className="text-xs text-zinc-400">Te confirmamos por WhatsApp · 17:00 – 23:00</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel"
                    placeholder="Teléfono (Ej. 0961290493)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="date"
                      value={date}
                      min={todayISO()}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="time"
                      value={time}
                      min={`${String(OPEN_HOUR).padStart(2, '0')}:00`}
                      max={`${String(CLOSE_HOUR - 1).padStart(2, '0')}:59`}
                      onChange={(e) => setTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    placeholder="N° de personas"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <textarea
                    placeholder="Notas (Ej. mesa junto a la ventana, silla para bebé…)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>CONFIRMAR RESERVA POR WHATSAPP</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
