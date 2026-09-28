export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  popular?: boolean;
  badge?: string;
  options?: { size: string; price: number }[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'todos', name: 'Todos', icon: '🔥', description: 'Explora nuestra variada carta' },
  { id: 'broaster', name: 'Pollo Broaster', icon: '🍗', description: 'Pollo crujiente al estilo broaster con papas' },
  { id: 'picaditas', name: 'Picaditas Moro\'s', icon: '🍟', description: 'Trocitos de pollo crispetas y embutidos' },
  { id: 'hot-dog', name: 'Hot - Dog', icon: '🌭', description: 'Pan artesanal con queso y cebolla caramelizada' },
  { id: 'gallina', name: 'Gallina Chicharrón', icon: '🍗', description: 'Trocitos de pollo frito crocante con limón' },
  { id: 'papi-mixtas', name: 'Papi Mixtas', icon: '🥓', description: 'Papas fritas con combinaciones de carne, huevo y chorizo' },
  { id: 'papi-completas', name: 'Papi Completas', icon: '🍱', description: 'La versión cargada con picaditas o pollo broaster' },
  { id: 'hamburguesas', name: 'Hamburguesas', icon: '🍔', description: 'Hamburguesas artesanales jugosas con papas' },
  { id: 'salchipapas', name: 'Salchipapas', icon: '🍟', description: 'Papas fritas con queso, huevo, carne o chorizo' },
  { id: 'bbq', name: 'Línea BBQ', icon: '🍖', description: 'Alitas y costillas bañadas en nuestra salsa BBQ artesanal' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', description: 'Batidos, jugos, gaseosas heladas y cafés' },
];

export const MENU_ITEMS: MenuItem[] = [
  // POLLO BROASTER
  {
    id: 'broaster-1',
    name: '1 Presa de Pollo Broaster',
    category: 'broaster',
    description: '1 presa de pollo broaster crocante y jugosa + papas fritas doradas.',
    price: 2.25,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
    popular: true,
    badge: 'Popular',
  },
  {
    id: 'broaster-2',
    name: '2 Presas de Pollo Broaster',
    category: 'broaster',
    description: '2 presas de pollo broaster crocantes + papas fritas doradas abundantes.',
    price: 3.75,
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    badge: 'Oferta',
  },

  // PICADITAS
  {
    id: 'picadita-pollo',
    name: 'Picadita de Pollo',
    category: 'picaditas',
    description: 'Trocitos de pollo (crispetas) crujientes + papas fritas doradas.',
    price: 2.25,
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'picadita-moros',
    name: 'Picadita Moro\'s',
    category: 'picaditas',
    description: 'Trocitos de pollo (crispetas) + chorizo en trocitos + papas fritas.',
    price: 2.75,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    popular: true,
    badge: 'Especialidad',
  },

  // HOT DOG
  {
    id: 'hot-dog-especial',
    name: 'Hot - Dog Especial',
    category: 'hot-dog',
    description: 'Pan suave + salchicha + queso derretido + cebolla caramelizada + papas fritas.',
    price: 2.00,
    image: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=800&q=80',
    badge: 'Favorito',
  },

  // GALLINA CHICHARRÓN
  {
    id: 'gallina-chicharron',
    name: 'Gallina Chicharrón',
    category: 'gallina',
    description: 'Trocitos de pollo frito súper crocante + papas fritas + rodaja de limón fresco.',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1585325701165-351af916e581?auto=format&fit=crop&w=800&q=80',
    popular: true,
    badge: 'Tradición Tulcán',
  },

  // PAPI MIXTAS
  {
    id: 'papi-carne-salchicha',
    name: 'Papi Mixta Carne + Salchicha',
    category: 'papi-mixtas',
    description: 'Papas fritas crujientes + tiras de carne jugosa + salchicha en rodajas.',
    price: 1.75,
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'papi-carne-huevo',
    name: 'Papi Mixta Carne + Huevo',
    category: 'papi-mixtas',
    description: 'Papas fritas + carne salteada jugosa + huevo frito a la perfección.',
    price: 1.75,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'papi-chorizo-huevo',
    name: 'Papi Mixta Chorizo + Huevo',
    category: 'papi-mixtas',
    description: 'Papas fritas + chorizo ahumado picado + huevo frito.',
    price: 1.75,
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'papi-salchicha-huevo',
    name: 'Papi Mixta Salchicha + Huevo',
    category: 'papi-mixtas',
    description: 'Papas fritas + salchicha + huevo frito.',
    price: 1.50,
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  },

  // PAPI COMPLETAS
  {
    id: 'papi-completa-normal',
    name: 'Papi Completa Normal',
    category: 'papi-completas',
    description: 'Carne jugosa + salchicha + huevo frito + porción abundante de papas fritas.',
    price: 2.00,
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'papi-completa-moros',
    name: 'Papi Completa Moro\'s',
    category: 'papi-completas',
    description: 'Carne + salchicha + huevo frito + porción de picaditas de pollo crispetas + papas fritas.',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    popular: true,
    badge: 'Recomendado Moro\'s',
  },
  {
    id: 'papi-completa-broaster',
    name: 'Papi Completa Broaster',
    category: 'papi-completas',
    description: 'Carne + salchicha + huevo frito + 1 Presa de Pollo Broaster crocante + papas fritas.',
    price: 3.50,
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
    badge: 'Super Combo',
  },

  // HAMBURGUESAS
  {
    id: 'burger-sencilla',
    name: 'Hamburguesa Sencilla',
    category: 'hamburguesas',
    description: 'Pan artesanal + salsas de la casa + vegetales frescos + carne jugosa + papas fritas.',
    price: 2.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'burger-completa',
    name: 'Hamburguesa Completa',
    category: 'hamburguesas',
    description: 'Pan + salsas + vegetales + carne jugosa + queso derretido + jamón + papas fritas.',
    price: 2.50,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'burger-doble',
    name: 'Hamburguesa Doble',
    category: 'hamburguesas',
    description: 'Pan + salsas + vegetales + doble carne jugosa + doble queso derretido + papas fritas.',
    price: 2.75,
    image: 'https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80',
    badge: 'Doble Sabor',
  },
  {
    id: 'burger-moros',
    name: 'Hamburguesa Moro\'s (Combo Especial)',
    category: 'hamburguesas',
    description: 'Pan artesanal + salsas + vegetales + carne + queso + jamón + tocino crocante + huevo + papas fritas + Gaseosa incluida.',
    price: 3.50,
    image: '/images/hero.jpg',
    popular: true,
    badge: '🌟 Platillo Estrella',
  },

  // SALCHIPAPAS
  {
    id: 'salchipapa-clasica',
    name: 'Salchipapa Clásica',
    category: 'salchipapas',
    description: 'Papas fritas doradas y crujientes con abundantes rodajas de salchicha.',
    price: 1.25,
    image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'salchipapa-huevo',
    name: 'Papas + Huevo',
    category: 'salchipapas',
    description: 'Papas fritas doradas servidas con huevo frito caliente.',
    price: 1.25,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'salchipapa-carne',
    name: 'Papas + Carne',
    category: 'salchipapas',
    description: 'Papas fritas doradas con tiras de carne salteada a la plancha.',
    price: 1.50,
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'salchipapa-queso',
    name: 'Papas + Queso',
    category: 'salchipapas',
    description: 'Papas fritas bañadas con abundante queso derretido caliente.',
    price: 1.50,
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'salchipapa-chorizo',
    name: 'Papas + Chorizo',
    category: 'salchipapas',
    description: 'Papas fritas doradas con trocitos de chorizo ahumado especial.',
    price: 1.50,
    image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
  },

  // BBQ
  {
    id: 'alitas-bbq',
    name: 'Alitas BBQ',
    category: 'bbq',
    description: '5 alitas de pollo bañadas en salsa BBQ ahumada artesanal + papas fritas.',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80',
    popular: true,
    badge: 'Más Pedido',
  },
  {
    id: 'costillas-bbq',
    name: 'Costillas BBQ',
    category: 'bbq',
    description: '5 trocitos de costillas de cerdo tiernas bañadas en salsa BBQ + papas fritas.',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mixto-bbq',
    name: 'Mixto BBQ',
    category: 'bbq',
    description: '3 alitas + 2 trocitos de costilla de cerdo bañados en salsa BBQ + papas fritas.',
    price: 3.00,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    badge: 'Combinado Top',
  },

  // BEBIDAS
  {
    id: 'bebida-jugos',
    name: 'Jugos Naturales',
    category: 'bebidas',
    description: 'Jugos naturales refrescantes preparados con fruta fresca de la estación.',
    price: 1.00,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bebida-batidos',
    name: 'Batidos Cremosos',
    category: 'bebidas',
    description: 'Batidos helados y cremosos al instante.',
    price: 1.25,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bebida-aromaticas',
    name: 'Aromáticas',
    category: 'bebidas',
    description: 'Infusión de hierbas aromáticas calientes.',
    price: 0.50,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bebida-cafe-negro',
    name: 'Café Negro',
    category: 'bebidas',
    description: 'Café puro y caliente tradicional.',
    price: 0.50,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bebida-cafe-leche',
    name: 'Café en Leche',
    category: 'bebidas',
    description: 'Café caliente con leche abundante y espuma suave.',
    price: 0.75,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'bebida-te-frio',
    name: 'Té Frío (Fuse Tea)',
    category: 'bebidas',
    description: 'Té frío refrescante en varias presentaciones (Personal $0.50 / Mediano $0.75 / Familiar $1.50).',
    price: 0.50,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    options: [
      { size: 'Personal', price: 0.50 },
      { size: 'Mediano', price: 0.75 },
      { size: 'Familiar', price: 1.50 },
    ],
  },
  {
    id: 'bebida-gaseosas',
    name: 'Gaseosas Heladas',
    category: 'bebidas',
    description: 'Variedad de gaseosas heladas (Personal $0.50 / $0.75 / 1 Litro $1.00 / 1.5 Litros $1.25).',
    price: 0.50,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    options: [
      { size: 'Personal 250ml', price: 0.50 },
      { size: 'Personal 400ml', price: 0.75 },
      { size: 'Mediana 1 Litro', price: 1.00 },
      { size: 'Familiar 1.5 Litros', price: 1.25 },
    ],
  }
];

export const PROMOTIONS = [
  {
    id: 'promo-1',
    title: 'Combo Moro\'s Especial 🍔🔥',
    subtitle: 'Hamburguesa Moro\'s + Papas Fritas + Gaseosa Helada incluida',
    price: 3.50,
    badge: '¡El Más Vendido!',
    image: '/images/hero.jpg',
    validity: 'Disponible Todos los Días (17:00 - 23:00)',
    buttonText: 'Pedir Combo Moro\'s',
  },
  {
    id: 'promo-2',
    title: 'Super Papi Completa Broaster 🍗🍟',
    subtitle: 'Carne + Salchicha + Huevo + 1 Presa de Pollo Broaster + Papas',
    price: 3.50,
    badge: '¡Promoción Estrella!',
    image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80',
    validity: 'Ideal para compartir',
    buttonText: 'Pedir Papi Broaster',
  },
  {
    id: 'promo-3',
    title: 'Mixto BBQ Fest 🍖🔥',
    subtitle: '3 Alitas + 2 Trocitos de Costilla bañadas en Salsa BBQ + Papas Fritas',
    price: 3.00,
    badge: 'Sabor Ahumado',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    validity: 'Porción Generosa',
    buttonText: 'Pedir Mixto BBQ',
  },
];

export const RESTAURANT_INFO = {
  name: "Moro's Comidas Rápidas",
  tagline: "El Auténtico Sabor de Tulcán",
  address: "Av. Veintimilla y Pasaje Atahualpa, cerca de la Casa China",
  city: "Tulcán, Ecuador",
  whatsappNumbers: ["0961290493", "0985090704"],
  whatsappFormatted: "593961290493",
  phone: "0961290493 / 0985090704",
  email: "nathaly.paillacho.c@gmail.com",
  schedule: "Lunes a Domingo, de 17:00 a 23:00",
  openHour: 17,
  closeHour: 23,
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15959.083758252274!2d-77.7289!3d0.8122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2a356073167b57%3A0x868d40748e9c60e3!2sTulc%C3%A1n%2C%20Ecuador!5e0!3m2!1ses!2sec!4v1700000000000!5m2!1ses!2sec",
};
