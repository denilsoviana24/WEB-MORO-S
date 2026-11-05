import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';

/**
 * POST /api/checkout/validate
 * Validación asíncrona paso a paso del embudo de pago.
 * Body: { step: 'personal' | 'address' | 'shipping' | 'payment', data: {...} }
 */
type Step = 'personal' | 'address' | 'shipping' | 'payment';

interface Data {
  customerName?: string;
  customerPhone?: string;
  email?: string;
  deliveryType?: 'pickup' | 'delivery';
  deliveryAddress?: string;
  addressReference?: string;
  region?: string;
  shippingMethodId?: string | null;
  paymentMethod?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: { step?: Step; data?: Data };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { _: 'Solicitud inválida.' } }, { status: 400 });
  }

  const step = body.step;
  const data = body.data || {};
  const errors: Record<string, string> = {};

  if (step === 'personal') {
    const name = (data.customerName || '').trim();
    if (name.length < 3) errors.customerName = 'Escribe tu nombre completo.';
    else if (!/^[a-zA-ZÀ-ÿ\s'.-]+$/.test(name)) errors.customerName = 'El nombre solo admite letras.';

    const phone = (data.customerPhone || '').replace(/[^\d+]/g, '');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) errors.customerPhone = 'Escribe un teléfono válido (mínimo 7 dígitos).';
    else if (digits.length > 15) errors.customerPhone = 'El teléfono es demasiado largo.';

    if (data.email && !EMAIL.test(data.email.trim())) errors.email = 'Ese correo no es válido.';
  }

  if (step === 'address') {
    if (data.deliveryType !== 'pickup') {
      const address = (data.deliveryAddress || '').trim();
      if (address.length < 8) errors.deliveryAddress = 'Escribe la dirección completa (calle, número, sector).';
      if (!data.region || !String(data.region).trim()) errors.region = 'Indica la ciudad o sector.';
    }
  }

  if (step === 'shipping') {
    if (data.deliveryType !== 'pickup') {
      if (!data.shippingMethodId) {
        errors.shippingMethodId = 'Elige un método de envío.';
      } else {
        const svc = serviceClient();
        if (svc) {
          const { data: method } = await svc
            .from('shipping_methods')
            .select('id,active,min_total')
            .eq('id', data.shippingMethodId)
            .maybeSingle();
          if (!method || method.active === false) {
            errors.shippingMethodId = 'Ese método de envío ya no está disponible.';
          }
        }
      }
    }
  }

  if (step === 'payment') {
    if (!(data.customerName || '').trim()) errors.customerName = 'Falta el nombre.';
    if (!(data.customerPhone || '').trim()) errors.customerPhone = 'Falta el teléfono.';
    if (data.deliveryType !== 'pickup' && !(data.deliveryAddress || '').trim()) {
      errors.deliveryAddress = 'Falta la dirección de entrega.';
    }
    if (!data.paymentMethod) errors.paymentMethod = 'Elige cómo quieres pagar.';
  }

  if (!step) errors._ = 'Paso desconocido.';

  return NextResponse.json(
    { ok: Object.keys(errors).length === 0, errors },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
