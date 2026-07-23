import Hero from '../components/Hero';
import FeaturesGrid from '../components/FeaturesGrid';
import HowItWorks from '../components/HowItWorks';
import SafetySection from '../components/SafetySection';

import CTAFooter from '../components/CTAFooter';


export default function LandingPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[var(--background)]">
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <SafetySection />
      <CTAFooter/>
      
    </div>
  );
}