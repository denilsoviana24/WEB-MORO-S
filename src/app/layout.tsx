import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import Intro from '@/components/Intro';
import BurgerCursor from '@/components/BurgerCursor';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Moro's Comidas Rápidas | El Auténtico Sabor de Tulcán",
  description:
    "Disfruta del mejor Pollo Broaster, Hamburguesas Moro's, Papi Completas, Costillas BBQ y Salchipapas en Tulcán, Ecuador. Av. Veintimilla y Pasaje Atahualpa. Pedidos por WhatsApp al 0961290493.",
  keywords: [
    "Moro's",
    "Comidas Rápidas Tulcán",
    "Pollo Broaster Tulcán",
    "Hamburguesas Tulcán",
    "Salchipapas Tulcán",
    "Papi Completas",
    "Restaurante Tulcán",
    "BBQ Tulcán",
  ],
  openGraph: {
    title: "Moro's Comidas Rápidas | Tulcán, Ecuador",
    description: "Menú oficial de Moro's: Broaster, Hamburguesas, Papi Completas y BBQ.",
    images: ['/images/hero.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} scroll-smooth`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-orange-500 selection:text-zinc-950">
        <CartProvider>
          <Intro />
          <BurgerCursor />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
