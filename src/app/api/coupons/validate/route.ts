import { NextResponse } from 'next/server';
import { serviceClient } from '@/lib/adminAuth';
import { computeDiscount, couponLabel, couponProblem, type Coupon } from '@/lib/shop';

/**
 * POST /api/coupons/validate
 * Valida un cupón contra el subtotal del carrito.
 * Los cupones nunca se leen desde el navegador: solo el servidor los conoce.
 */
export async function POST(req: Request) {
  const svc = serviceClient();
  if (!svc) return NextResponse.json({ ok: false, error: 'Tienda no configurada.' }, { status: 501 });

  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida.' }, { status: 400 });
  }

  const code = String(body.code || '').trim();
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return NextResponse.json({ ok: false, error: 'Escribe un cupón.' }, { status: 400 });

  const { data, error } = await svc
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: 'No se pudo validar el cupón.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, error: 'Ese cupón no existe.' }, { status: 404 });
  }

  const coupon = data as Coupon;
  const problem = couponProblem(coupon, subtotal);
  if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });

  const discount = computeDiscount(coupon, subtotal);
  return NextResponse.json({
    ok: true,
    code: coupon.code,
    label: couponLabel(coupon),
    discount,
    type: coupon.type,
    amount: Number(coupon.amount),
    min_total: Number(coupon.min_total || 0),
  });
}
