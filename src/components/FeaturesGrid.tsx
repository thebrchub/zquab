import { useState, useEffect } from 'react';
import FeatureCard from './FeatureCard';

const featuresData = [
  {
    title: "Instant Matching",
    description: "Connect with random people worldwide in milliseconds. No waiting rooms.",
    baseImage: "/features/1" // Removed extension to manage extension in component
  },
  {
    title: "No Registration",
    description: "No account, no email, no friction. Open the site and start chatting immediately.",
    baseImage: "/features/2"
  },
  {
    title: "Private Chats",
    description: "One-to-one conversations secured and strictly isolated from everyone else.",
    baseImage: "/features/3"
  },
  {
    title: "Fast & Lightweight",
    description: "Built on modern technology to ensure zero lag and minimal data usage.",
    baseImage: "/features/4"
  },
  {
    title: "Safe Community",
    description: "Easy reporting and blocking tools keep the platform clean and friendly.",
    baseImage: "/features/5"
  },
  {
    title: "Light & Dark Mode",
    description: "Choose your visual experience. Easy on the eyes, day or night.",
    baseImage: "/features/6"
  }
];

export default function FeaturesGrid() {
  // state to manage the current image suffix based on theme
  const [imageSuffix, setImageSuffix] = useState('');

  useEffect(() => {
    // 1. Define function to check current theme and set suffix
    const updateSuffix = () => {
      if (document.documentElement.classList.contains('dark')) {
        // Dark theme: uses original images (e.g., 1.png)
        setImageSuffix(''); 
      } else {
        // Light theme: uses -w images (e.g., 1-w.png)
        setImageSuffix('-w');
      }
    };

    // 2. Initial check on mount
    updateSuffix();

    // 3. Set up observer to detect theme changes on <html>
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateSuffix();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    // 4. Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 relative w-full bg-[var(--background)] z-20 -mb-[2px] border-none">
      <div className="mx-4 md:mx-8 lg:mx-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-main)]">
            Everything you need. <span className="text-[#3B82F6]">Nothing you don't.</span>
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            We stripped away the noise so you can focus on what actually matters: meeting someone new.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {featuresData.map((feature, index) => (
            <FeatureCard 
              key={index}
              title={feature.title}
              description={feature.description}
              // Dynamically construct the image path with the suffix and extension
              image={`${feature.baseImage}${imageSuffix}.webp`}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}