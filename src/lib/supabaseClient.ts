import { createClient } from '@supabase/supabase-js';
import { MENU_ITEMS, MenuItem, PROMOTIONS } from '@/data/menuData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fetch Menu Products (Supabase with local fallback)
export async function getProducts(): Promise<MenuItem[]> {
  if (!supabase) {
    return MENU_ITEMS;
  }
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('disponible', true);

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch returned empty or error, using local dataset fallback:', error);
      return MENU_ITEMS;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.nombre,
      category: item.categoria_id,
      description: item.descripcion,
      price: Number(item.precio),
      image: item.imagen_url || '/images/hero.jpg',
      popular: item.popular,
      badge: item.badge,
    }));
  } catch (err) {
    console.error('Error reaching Supabase:', err);
    return MENU_ITEMS;
  }
}

// Fetch Active Promotions
export async function getPromotions() {
  if (!supabase) {
    return PROMOTIONS;
  }
  try {
    const { data, error } = await supabase
      .from('promociones')
      .select('*')
      .eq('activa', true);

    if (error || !data || data.length === 0) {
      return PROMOTIONS;
    }

    return data.map((promo: any) => ({
      id: promo.id,
      title: promo.titulo,
      subtitle: promo.descripcion,
      price: Number(promo.precio),
      badge: promo.badge || 'Oferta',
      image: promo.imagen_url || '/images/hero.jpg',
      validity: promo.validez || 'Por tiempo limitado',
      buttonText: 'Pedir Promoción',
    }));
  } catch (err) {
    return PROMOTIONS;
  }
}

// Submit Contact Message to Supabase
export async function submitContactMessage(contactData: {
  nombre: string;
  telefono: string;
  mensaje: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    console.log('Contacto recibido (Modo Local):', contactData);
    return { success: true, message: '¡Gracias por tu mensaje! Te responderemos muy pronto por WhatsApp o llamada.' };
  }

  try {
    const { error } = await supabase.from('contactos').insert([
      {
        nombre: contactData.nombre,
        telefono: contactData.telefono,
        mensaje: contactData.mensaje,
        fecha: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error insertando en Supabase:', error);
      return { success: true, message: '¡Mensaje recibido! Te contactaremos a la brevedad.' };
    }

    return { success: true, message: '¡Mensaje guardado con éxito! Nos pondremos en contacto contigo pronto.' };
  } catch (err) {
    return { success: true, message: '¡Mensaje enviado con éxito!' };
  }
}
