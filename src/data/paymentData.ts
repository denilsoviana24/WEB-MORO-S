export type PaymentMethodId = 'cash' | 'transfer' | 'card' | 'kushki' | 'deuna';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  icon: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Efectivo / WhatsApp',
    description: 'Pagas al recibir tu pedido o en el local',
    icon: '💵',
  },
  {
    id: 'transfer',
    name: 'Transferencia',
    description: 'Transfiere y envíanos el comprobante',
    icon: '🏦',
  },
  {
    id: 'card',
    name: 'Mercado Pago',
    description: 'Débito o crédito vía Mercado Pago',
    icon: '💳',
  },
  {
    id: 'kushki',
    name: 'Tarjeta (Kushki)',
    description: 'Débito o crédito con cobro seguro',
    icon: '💠',
  },
  {
    id: 'deuna',
    name: 'DeUna',
    description: 'Paga con la app DeUna del Pichincha',
    icon: '📱',
  },
];

/**
 * Datos bancarios del local.
 * TODO (dueño): reemplaza estos valores con tu cuenta real
 * o muévelos a variables de entorno en Vercel.
 */
export const BANK_ACCOUNT = {
  bank: 'Banco Pichincha',
  accountType: 'Cuenta de Ahorros',
  accountNumber: '2201234567',
  holder: "Moro's Comidas Rápidas",
  idNumber: '0401234567',
};

/**
 * Link de pago fijo de Mercado Pago (opcional, alternativo rápido).
 * Se configura en Vercel como NEXT_PUBLIC_MERCADOPAGO_LINK.
 * Si está vacío, el pago con tarjeta usa la API interna (/api/pagos).
 */
export const MERCADOPAGO_LINK =
  process.env.NEXT_PUBLIC_MERCADOPAGO_LINK || '';

/**
 * KUSHKI — procesador de tarjetas (Ecuador).
 * Consigue tus credenciales en https://www.kushkipagos.com
 *   - Usa las de PRUEBA primero, luego las productivas.
 *
 * Modo 1 (rápido): pega tu link de cobro/Cajita en NEXT_PUBLIC_KUSHKI_PAYMENT_LINK
 *   y el botón abre ese link. Sin código extra.
 * Modo 2 (integrado): define NEXT_PUBLIC_KUSHKI_PUBLIC_KEY (frontend)
 *   + KUSHKI_PRIVATE_KEY (servidor) y la web cobra la tarjeta aquí mismo.
 */
export const KUSHKI_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_KUSHKI_PAYMENT_LINK || '';
export const KUSHKI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_KUSHKI_PUBLIC_KEY || '';
export const KUSHKI_ENV =
  process.env.NEXT_PUBLIC_KUSHKI_ENV === 'production' ? 'production' : 'test';

/**
 * DEUNA — app del Banco Pichincha.
 * 1. En tu app DeUna Negocios genera tu link/QR de cobro.
 * 2. (Opcional) Guarda tu QR como public/deuna-qr.png en la web.
 * 3. (Opcional) Pega tu link en Vercel como NEXT_PUBLIC_DEUNA_LINK.
 */
export const DEUNA_LINK = process.env.NEXT_PUBLIC_DEUNA_LINK || '';
export const DEUNA_QR = '/deuna-qr.png';
