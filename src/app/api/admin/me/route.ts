import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * GET /api/admin/me
 * El servidor confirma si la sesión actual es administradora.
 * La web usa esto para mostrar (o no) el acceso al panel.
 */
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ admin: false }, { status: 200 });
  return NextResponse.json({ admin: true, email: guard.email });
}
