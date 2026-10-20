import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { AnimatedCarEntrance } from '@/components/home/AnimatedCarEntrance';
import { HowItWorks } from '@/components/home/HowItWorks';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden w-full">
      <HeroSection />
      <AnimatedCarEntrance />
      <HowItWorks />
    </div>
  );
}
