import { NextResponse } from 'next/server';
import { MENU_ITEMS, RESTAURANT_INFO } from '@/data/menuData';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * POST /api/chat
 * Cerebro IA en la nube (compatible con OpenAI / Groq / OpenRouter).
 *
 * Configura en Vercel / .env.local:
 *   AI_API_KEY=...        (tu clave; sin esto responde 501 y la web usa el cerebro local)
 *   AI_BASE_URL=...       (opcional, por defecto OpenAI)
 *   AI_MODEL=...          (opcional, por defecto gpt-4o-mini)
 *
 * Ejemplos:
 *   Groq (gratis):      AI_BASE_URL=https://api.groq.com/openai/v1  AI_MODEL=llama-3.1-8b-instant
 *   OpenRouter:         AI_BASE_URL=https://openrouter.ai/api/v1    AI_MODEL=...
 */
export async function POST(req: Request) {
  const key = process.env.AI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 501 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }

  const messages = (body.messages || []).slice(-10);
  if (messages.length === 0) {
    return NextResponse.json({ error: 'EMPTY' }, { status: 400 });
  }

  const base = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const menu = MENU_ITEMS.map(
    (i) => `- ${i.name} ($${i.price.toFixed(2)}): ${i.description}`
  ).join('\n');

  const system = [
    `Eres Moro IA, el asistente de Moro's Comidas Rápidas en Tulcán, Ecuador.`,
    `Hablas español, eres amable, breve (máximo 60 palabras) y usas algún emoji.`,
    `Tus 2 funciones: 1) VENDER: recomendar platos del menú según lo que pida el cliente (antojo, presupuesto, para compartir). 2) ATENCIÓN AL CLIENTE: horarios, ubicación, domicilio, pagos, reservas y Club de fidelización.`,
    `Datos: ${RESTAURANT_INFO.schedule}. Dirección: ${RESTAURANT_INFO.address}, ${RESTAURANT_INFO.city}. Domicilios en Tulcán. Pagos: efectivo, transferencia y tarjeta. Reservas por la web. Club Moro's: 20 sellos = Papi Completa gratis. Tel: ${RESTAURANT_INFO.phone}.`,
    `MENÚ (solo recomienda estos platos, no inventes otros):`,
    menu,
    `Si preguntan algo fuera de tu alcance, deriva al WhatsApp ${RESTAURANT_INFO.phone}. Nunca inventes precios ni platos.`,
  ].join('\n');

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.6,
        max_tokens: 350,
      }),
    });

    if (!res.ok) {
      console.error('AI gateway error:', await res.text());
      return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
    }

    const data = await res.json();
    const reply: string | undefined = data.choices?.[0]?.message?.content;
    if (!reply) return NextResponse.json({ error: 'EMPTY_REPLY' }, { status: 502 });

    return NextResponse.json({ reply: reply.trim() });
  } catch (err) {
    console.error('AI error:', err);
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 });
  }
}
