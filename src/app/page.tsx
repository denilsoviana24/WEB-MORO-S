import Hero from '@/components/Hero';
import PromoBanner from '@/components/PromoBanner';
import MenuSection from '@/components/MenuSection';
import AboutSection from '@/components/AboutSection';
import LocationContact from '@/components/LocationContact';

export default function Home() {
  return (
    <>
      <Hero />
      <PromoBanner />
      <MenuSection />
      <AboutSection />
      <LocationContact />
    </>
  );
}
