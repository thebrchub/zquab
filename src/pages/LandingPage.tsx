import Hero from '../components/Hero';
import FeaturesGrid from '../components/FeaturesGrid';
import HowItWorks from '../components/HowItWorks';

import CTAFooter from '../components/CTAFooter';
import PhilosophySection from '../components/PhilosophySection';


export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[var(--background)]">
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <PhilosophySection />
      <CTAFooter/>
      
    </div>
  );
}