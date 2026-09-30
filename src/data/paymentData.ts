export type PaymentMethodId = 'cash' | 'transfer' | 'card';

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
    name: 'Tarjeta en línea',
    description: 'Débito o crédito vía Mercado Pago',
    icon: '💳',
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
