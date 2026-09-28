'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageCircle, AlertCircle } from 'lucide-react';
import { RESTAURANT_INFO } from '@/data/menuData';
import { submitContactMessage } from '@/lib/supabaseClient';

export default function LocationContact() {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    mensaje: '',
  });
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.telefono || !formData.mensaje) {
      alert('Por favor completa todos los campos del formulario.');
      return;
    }

    setLoading(true);
    setResponseStatus(null);

    const res = await submitContactMessage(formData);
    setLoading(false);
    setResponseStatus(res);

    if (res.success) {
      setFormData({ nombre: '', telefono: '', mensaje: '' });
    }
  };

  return (
    <section id="contacto" className="py-20 bg-zinc-900/60 border-t border-zinc-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-3.5 py-1 rounded-full text-xs font-black text-amber-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>UBICACIÓN & ATENCIÓN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ¿Dónde Encontrarnos en <span className="text-orange-500">Tulcán</span>?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Visítanos en nuestro local o comunícate con nosotros para cualquier consulta o pedido especial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Cards & Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Info Card 1: Address */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 shadow-xl">
              <div className="p-3 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Dirección Oficial</h3>
                <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
                  {RESTAURANT_INFO.address}
                </p>
                <span className="text-amber-400 font-bold text-[11px] block mt-1">
                  {RESTAURANT_INFO.city}
                </span>
              </div>
            </div>

            {/* Info Card 2: Hours */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 shadow-xl">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Horario de Atención</h3>
                <p className="text-zinc-300 text-xs mt-1 font-bold">
                  {RESTAURANT_INFO.schedule}
                </p>
                <p className="text-zinc-500 text-[11px] mt-0.5">
                  Atendemos los 7 días de la semana
                </p>
              </div>
            </div>

            {/* Info Card 3: Direct Phones */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4 shadow-xl">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Teléfonos & WhatsApp</h3>
                <div className="flex flex-col gap-1 mt-1 text-xs">
                  {RESTAURANT_INFO.whatsappNumbers.map((num) => (
                    <a
                      key={num}
                      href={`https://wa.me/593${num.substring(1)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{num}</span>
                    </a>
                  ))}
                </div>
                <p className="text-zinc-500 text-[11px] mt-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-zinc-400" />
                  <span>{RESTAURANT_INFO.email}</span>
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="font-extrabold text-white text-base">Envíanos un Mensaje</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Teléfono Celular
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Tu número (Ej. 0961290493)"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Mensaje / Consulta
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="¿En qué podemos ayudarte?"
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {responseStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      responseStatus.success
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {responseStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{responseStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-zinc-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Enviando...' : 'Enviar Mensaje'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Google Maps Embed */}
          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 p-3 rounded-3xl shadow-2xl h-full min-h-[450px]">
            <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden bg-zinc-900">
              <iframe
                title="Mapa Moro's Tulcán"
                src={RESTAURANT_INFO.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '450px' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-125 opacity-90 hover:grayscale-0 transition-all duration-500"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
