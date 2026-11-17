import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import ExperienceSection from '@/components/ExperienceSection';
import MenuSection from '@/components/MenuSection';
import CombosSection from '@/components/CombosSection';
import AnatomySection from '@/components/AnatomySection';
import AboutSection from '@/components/AboutSection';
import ReviewsSection from '@/components/ReviewsSection';
import LoyaltySection from '@/components/LoyaltySection';
import NewsletterSection from '@/components/NewsletterSection';
import LocationContact from '@/components/LocationContact';
import PaymentReturnBanner from '@/components/PaymentReturnBanner';

export default function Home() {
  return (
    <>
      <PaymentReturnBanner />
      <Hero />
      <Marquee
        items={['Crujiente', 'Jugoso', 'Irresistible', '#ElSaborDeTulcán']}
        outline
      />
      <ExperienceSection />
      <MenuSection />
      <CombosSection />
      <Marquee
        fast
        items={['Pollo Broaster', 'Hamburguesa Moro’s', 'Papi Completa', 'Costillas BBQ']}
      />
      <AnatomySection />
      <AboutSection />
      <ReviewsSection />
      <LoyaltySection />
      <NewsletterSection />
      <LocationContact />
    </>
  );
}
