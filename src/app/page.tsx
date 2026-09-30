import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import ExperienceSection from '@/components/ExperienceSection';
import MenuSection from '@/components/MenuSection';
import AnatomySection from '@/components/AnatomySection';
import AboutSection from '@/components/AboutSection';
import ReviewsSection from '@/components/ReviewsSection';
import LoyaltySection from '@/components/LoyaltySection';
import LocationContact from '@/components/LocationContact';

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee
        items={['Crujiente', 'Jugoso', 'Irresistible', '#ElSaborDeTulcán']}
        outline
      />
      <ExperienceSection />
      <MenuSection />
      <Marquee
        fast
        items={['Pollo Broaster', 'Hamburguesa Moro’s', 'Papi Completa', 'Costillas BBQ']}
      />
      <AnatomySection />
      <AboutSection />
      <ReviewsSection />
      <LoyaltySection />
      <LocationContact />
    </>
  );
}
