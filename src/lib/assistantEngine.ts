import {
  getPopular,
  getCheapest,
  getByCategory,
  getToShare,
  CATEGORY_KEYWORDS,
  isOpenNow,
  scheduleText,
  RESTAURANT_INFO,
} from '@/data/assistantData';

export interface BotAction {
  label: string;
  href?: string;
  event?: 'reserve';
}

export interface BotReply {
  text: string;
  productIds?: string[];
  actions?: BotAction[];
}

/** Minúsculas + sin tildes para comparar. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n');
}

function has(t: string, ...words: string[]): boolean {
  return words.some((w) => t.includes(w));
}

const whatsappLink = (text: string) =>
  `https://wa.me/${RESTAURANT_INFO.whatsappFormatted}?text=${encodeURIComponent(text)}`;

const ACTION_MENU: BotAction = { label: 'Ver menú 🍔', href: '/#menu' };
const ACTION_RESERVE: BotAction = { label: 'Reservar mesa 🪑', event: 'reserve' };
const ACTION_CLUB: BotAction = { label: 'Club Moro’s ⭐', href: '/promociones#club-moros' };
const ACTION_HUMAN: BotAction = {
  label: 'Hablar por WhatsApp 💬',
  href: whatsappLink('Hola Moro’s! Necesito ayuda con mi pedido'),
};

/**
 * Cerebro local del asistente: ventas (recomendación) + atención al cliente.
 * Se usa cuando la IA en la nube no está configurada.
 */
export function getBotReply(message: string): BotReply {
  const t = norm(message.trim());

  if (!t) {
    return { text: 'Cuéntame, ¿qué se te antoja hoy? 🍔 Puedo recomendarte platos, darte horarios o ayudarte con tu pedido.' };
  }

  // ——— Reservas ———
  if (has(t, 'reserv', 'mesa', 'apartar', 'lugar', 'silla')) {
    try {
      window.dispatchEvent(new Event('moros:open-reserve'));
    } catch {
      // ignorar
    }
    return {
      text: '¡Perfecto! 🪑 Te abrí el formulario de reserva: elige fecha, hora y cuántas personas son, y la confirmamos por WhatsApp.',
      actions: [ACTION_RESERVE],
    };
  }

  // ——— Horario / abierto ———
  if (has(t, 'abierto', 'abren', 'cierran', 'horario', 'hora', 'atienden', 'abren hoy')) {
    const open = isOpenNow();
    return {
      text: open
        ? `¡Sí, estamos ABIERTOS! 🟢 ${scheduleText()} ¡Te esperamos! 🔥`
        : `Ahora mismo estamos cerrados 🔴. ${scheduleText()} ¡Haz tu pedido apenas abramos! 🍔`,
      actions: [ACTION_MENU],
    };
  }

  // ——— Ubicación ———
  if (has(t, 'donde', 'direccion', 'ubicacion', 'ubicados', 'llegar', 'local')) {
    return {
      text: `Estamos en ${RESTAURANT_INFO.address}, ${RESTAURANT_INFO.city}. 📍 ${scheduleText()}`,
      actions: [ACTION_MENU],
    };
  }

  // ——— Domicilio ———
  if (has(t, 'domicilio', 'delivery', 'envio', 'llevan', 'casa', 'reparto')) {
    return {
      text: '¡Sí! Llevamos a domicilio en Tulcán 🛵 Arma tu pedido en el carrito, elige “Domicilio” y coordinamos la entrega por WhatsApp.',
      actions: [ACTION_MENU],
    };
  }

  // ——— Pagos ———
  if (has(t, 'pago', 'pagar', 'tarjeta', 'transferencia', 'efectivo', 'mercado pago', 'cuanto cuesta el envio')) {
    return {
      text: 'Aceptamos 3 formas de pago 💳: efectivo (al recibir o en el local), transferencia bancaria (con comprobante) y tarjeta en línea. Al confirmar tu pedido en el carrito eliges cómo pagar. 🧾 ¡Y siempre te damos tu comprobante!',
    };
  }

  // ——— Club / fieles / descuentos ———
  if (has(t, 'punto', 'fiel', 'club', 'descuento', 'cupon', 'promocion', 'promo', 'oferta', 'gratis')) {
    return {
      text: 'Tenemos el ⭐ Club Moro’s: cada pedido suma 1 sello 🍟 y con 20 sellos te regalamos una Papi Completa. Niveles Bronce (Salchipapa gratis), Plata (Bebida grande gratis) y Oro (Picaditas gratis). Además hay cupones como MOROS10 con 10% OFF.',
      actions: [ACTION_CLUB],
    };
  }

  // ——— Recomendación: económico ———
  if (has(t, 'barato', 'economico', 'poco dinero', 'alcance', '1 dolar', '2 dolar')) {
    const items = getCheapest(3);
    return {
      text: 'Con poco presupuesto igual se come rico 💰 Mira estas opciones:',
      productIds: items.map((i) => i.id),
      actions: [ACTION_MENU],
    };
  }

  // ——— Recomendación: compartir / grupo / familia ———
  if (has(t, 'compartir', 'familia', 'grupo', 'varios', 'cumpleanos', 'fiesta', 'mucha hambre', 'grande')) {
    const items = getToShare(3);
    return {
      text: 'Para compartir (o para gran hambre 😋) te recomiendo estos:',
      productIds: items.map((i) => i.id),
      actions: [ACTION_MENU],
    };
  }

  // ——— Recomendación: pedido directo ———
  if (has(t, 'recomienda', 'recomendacion', 'antojo', 'hambre', 'que como', 'que pido', 'sugerencia', 'rico', 'bueno', 'mejor', 'estrella', 'especialidad')) {
    for (const group of CATEGORY_KEYWORDS) {
      if (has(t, ...group.words)) {
        const items = getByCategory(group.cats, 3);
        if (items.length > 0) {
          return {
            text: '¡Buena elección! 😍 Esto te va a encantar:',
            productIds: items.map((i) => i.id),
            actions: [ACTION_MENU],
          };
        }
      }
    }
    const items = getPopular(3);
    return {
      text: 'Estos son los favoritos de la casa 🔥 ¡No fallan!',
      productIds: items.map((i) => i.id),
      actions: [ACTION_MENU],
    };
  }

  // ——— Carta / categorías ———
  if (has(t, 'menu', 'carta', 'plato', 'comida', 'venden', 'tienen', 'hay de')) {
    for (const group of CATEGORY_KEYWORDS) {
      if (has(t, ...group.words)) {
        const items = getByCategory(group.cats, 3);
        if (items.length > 0) {
          return {
            text: 'Mira lo que tenemos en eso 😋:',
            productIds: items.map((i) => i.id),
            actions: [ACTION_MENU],
          };
        }
      }
    }
    return {
      text: 'Tenemos Broaster 🍗, Hamburguesas 🍔, Papi Completas 🍟, BBQ 🍖, Salchipapas, Hot-Dogs 🌭 y Bebidas 🥤. Toca “Ver menú” o dime qué se te antoja.',
      actions: [ACTION_MENU],
    };
  }

  // ——— Contacto humano ———
  if (has(t, 'humano', 'persona', 'telefono', 'numero', 'llamar', 'contacto', 'whatsapp', 'ayuda', 'problema', 'reclamo', 'queja')) {
    return {
      text: `Claro, te atiende una persona por WhatsApp al ${RESTAURANT_INFO.phone} 📲 o escríbenos y te respondemos enseguida.`,
      actions: [ACTION_HUMAN],
    };
  }

  // ——— Gracias / despedida ———
  if (has(t, 'gracias', 'genial', 'perfecto', 'excelente', 'chao', 'adios', 'nos vemos')) {
    return { text: '¡Con gusto! 😊 Aquí estaré cuando quieras pedir o preguntar algo. ¡Buen provecho! 🍔' };
  }

  // ——— Saludo ———
  if (has(t, 'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'saludos')) {
    return {
      text: '¡Hola! 👋 Soy Moro IA 🤖 ¿Te recomiendo algo rico, o necesitas ayuda con horarios, domicilio o tu reserva?',
      actions: [ACTION_MENU, ACTION_RESERVE],
    };
  }

  // ——— Fallback: derivar a humano ———
  return {
    text: 'Mmm, eso se me escapa 🤔 Pero un humano de Moro’s te ayuda enseguida por WhatsApp. ¿O prefieres que te recomiende algo del menú? 🍔',
    actions: [ACTION_HUMAN, ACTION_MENU],
  };
}
