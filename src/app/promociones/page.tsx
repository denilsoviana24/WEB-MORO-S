import PromoBanner from '@/components/PromoBanner';
import MenuSection from '@/components/MenuSection';

export const metadata = {
  title: "Promociones Especiales | Moro's Comidas Rápidas",
  description: "Combos y ofertas especiales en Moro's Tulcán. Hamburguesa Moro's + Papas + Gaseosa por solo $3.50.",
};

export default function PromocionesPage() {
  return (
    <div className="pt-8">
      <PromoBanner />
      <MenuSection />
    </div>
  );
}
