import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import PromoBanner from '@/components/PromoBanner';
import ExperienceSection from '@/components/ExperienceSection';
import MenuSection from '@/components/MenuSection';
import AnatomySection from '@/components/AnatomySection';
import StoryTimeline from '@/components/StoryTimeline';
import AboutSection from '@/components/AboutSection';
import LocationContact from '@/components/LocationContact';

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee
        items={['Crujiente', 'Jugoso', 'Irresistible', '#ElSaborDeTulcán']}
        outline
      />
      <PromoBanner />
      <ExperienceSection />
      <MenuSection />
      <Marquee
        fast
        items={['Pollo Broaster', 'Hamburguesa Moro’s', 'Papi Completa', 'Costillas BBQ']}
      />
      <AnatomySection />
      <StoryTimeline />
      <AboutSection />
      <LocationContact />
    </>
  );
}
