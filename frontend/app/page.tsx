import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { ActionCards } from '@/components/home/ActionCards';
import { HowItWorks } from '@/components/home/HowItWorks';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden w-full">
      <HeroSection />
      <ActionCards />
      <HowItWorks />
    </div>
  );
}
