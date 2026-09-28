import MenuSection from '@/components/MenuSection';

export const metadata = {
  title: "Menú Completo | Moro's Comidas Rápidas Tulcán",
  description: "Explora la carta completa de Moro's: Pollo Broaster, Hamburguesas, Salchipapas, Papi Completas y BBQ.",
};

export default function MenuPage() {
  return (
    <div className="pt-8">
      <MenuSection />
    </div>
  );
}
