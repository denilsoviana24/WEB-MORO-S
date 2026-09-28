import LocationContact from '@/components/LocationContact';

export const metadata = {
  title: "Ubicación y Contacto | Moro's Comidas Rápidas Tulcán",
  description: "Av. Veintimilla y Pasaje Atahualpa, cerca de la Casa China, Tulcán. Teléfonos: 0961290493 / 0985090704.",
};

export default function ContactoPage() {
  return (
    <div className="pt-8">
      <LocationContact />
    </div>
  );
}
