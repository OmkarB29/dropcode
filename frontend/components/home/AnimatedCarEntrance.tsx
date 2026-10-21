'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  UploadCloud,
  Download,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  FastForward,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransformerSequence } from './TransformerSequence';

export function AnimatedCarEntrance() {
  // Animation state: 'driving' -> 'stopped' -> 'doors_open' -> 'cards_revealed'
  const [animationStep, setAnimationStep] = useState<
    'driving' | 'stopped' | 'doors_open' | 'cards_revealed'
  >('driving');

  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [transformerTarget, setTransformerTarget] = useState<
    '/send' | '/receive' | null
  >(null);

  useEffect(() => {
    // Listen for custom trigger events from Header or other navigation components
    const handleTriggerEvent = (e: Event) => {
      const custom = e as CustomEvent<{ destination: '/send' | '/receive' }>;
      if (custom.detail?.destination) {
        setTransformerTarget(custom.detail.destination);
      }
    };

    window.addEventListener('dropcode:trigger-transform', handleTriggerEvent);
    return () => {
      window.removeEventListener('dropcode:trigger-transform', handleTriggerEvent);
    };
  }, []);

  const handleTriggerTransform = (dest: '/send' | '/receive') => {
    setTransformerTarget(dest);
  };

  useEffect(() => {
    // Phase 1: Driving in (0 - 1.8s)
    const timer1 = setTimeout(() => {
      setAnimationStep('stopped');
    }, 1800);

    // Phase 2: Opening doors (1.8s - 2.6s)
    const timer2 = setTimeout(() => {
      setAnimationStep('doors_open');
    }, 2500);

    // Phase 3: Revealing Send & Receive options (2.6s+)
    const timer3 = setTimeout(() => {
      setAnimationStep('cards_revealed');
      setHasPlayedOnce(true);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [hasPlayedOnce]);

  const handleReplay = () => {
    setAnimationStep('driving');
    setHasPlayedOnce(false);
  };

  const handleSkip = () => {
    setAnimationStep('cards_revealed');
    setHasPlayedOnce(true);
  };

  const isDoorsOpen =
    animationStep === 'doors_open' || animationStep === 'cards_revealed';
  const isCardsRevealed = animationStep === 'cards_revealed';

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 mb-20">
      {/* Animation Stage Controls (Skip / Replay) */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900/90 border border-brand-cyan/25 text-[11px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            <span>
              {animationStep === 'driving'
                ? 'CYBER VEHICLE INBOUND...'
                : animationStep === 'stopped'
                ? 'VEHICLE DOCKED'
                : animationStep === 'doors_open'
                ? 'DEPLOYING CARGO DOORS...'
                : 'TRANSFER PORTAL READY'}
            </span>
          </span>
        </div>

        <div>
          {!isCardsRevealed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 font-mono"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span>Skip Intro</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplay}
              className="h-8 gap-1.5 text-xs text-brand-cyan border-brand-cyan/30 bg-brand-cyan/10 hover:bg-brand-cyan/20 font-medium rounded-xl"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Replay Entrance</span>
            </Button>
          )}
        </div>
      </div>

      {/* AEROSPACE MODE TABS: SEND & RECEIVE */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-navy-900/90 border border-white/10 backdrop-blur-xl shadow-xl gap-2">
          <button
            onClick={() => handleTriggerTransform('/send')}
            className="group flex items-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 hover:text-white bg-gradient-to-r hover:from-brand-violet/25 hover:to-brand-violet/10 border border-transparent hover:border-brand-violet/40 transition-all duration-300 active:scale-95"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-violet/20 text-violet-300 group-hover:scale-110 group-hover:bg-brand-violet group-hover:text-white transition-all shadow-md">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                <span>Send Tab</span>
                <Plane className="h-3.5 w-3.5 text-brand-violet group-hover:translate-x-0.5 -rotate-45 transition-transform" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Transform to Jet &rarr;</div>
            </div>
          </button>

          <div className="h-8 w-[1px] bg-white/10" />

          <button
            onClick={() => handleTriggerTransform('/receive')}
            className="group flex items-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 hover:text-white bg-gradient-to-r hover:from-brand-cyan/25 hover:to-brand-cyan/10 border border-transparent hover:border-brand-cyan/40 transition-all duration-300 active:scale-95"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cyan/20 text-cyan-300 group-hover:scale-110 group-hover:bg-brand-cyan group-hover:text-navy-900 transition-all shadow-md">
              <Download className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>Receive Tab</span>
                <Plane className="h-3.5 w-3.5 text-brand-cyan group-hover:translate-x-0.5 -rotate-45 transition-transform" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Transform to Jet &rarr;</div>
            </div>
          </button>
        </div>
      </div>

      {/* Cyber Road & Car Stage */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-navy-900/90 via-navy-950 to-navy-900 border border-white/10 overflow-hidden shadow-2xl p-4 sm:p-8 min-h-[300px] flex flex-col justify-end">
        {/* Ambient perspective grid floor */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d40f_1px,transparent_1px),linear-gradient(to_bottom,#06b6d40f_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_70%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full bg-brand-violet/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-28 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none" />

        {/* Animated Speed Lines (visible during driving) */}
        {animationStep === 'driving' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '-100%' }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear', delay: 0.2 }}
              className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
            />
          </div>
        )}

        {/* CAR CONTAINER */}
        <div className="relative w-full flex justify-center items-center py-4 z-10">
          <motion.div
            className="relative"
            initial={{ x: '-110vw' }}
            animate={
              animationStep === 'driving'
                ? { x: '-110vw' }
                : { x: 0 }
            }
            transition={{
              type: 'spring',
              stiffness: 45,
              damping: 14,
              mass: 1.2,
            }}
          >
            {/* Gentle idle float/suspension bounce */}
            <motion.div
              animate={
                isDoorsOpen
                  ? { y: [0, -2, 0] }
                  : { y: [0, -4, 0] }
              }
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative"
            >
              {/* Volumetric Headlight Beams */}
              <div className="absolute -right-36 sm:-right-60 top-12 sm:top-14 w-44 sm:w-72 h-16 sm:h-24 pointer-events-none z-0">
                <div
                  className="w-full h-full bg-gradient-to-r from-cyan-400/35 via-cyan-300/15 to-transparent blur-md"
                  style={{
                    clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 65%)',
                  }}
                />
              </div>

              {/* High-Tech Underglow Neon */}
              <div className="absolute -bottom-4 left-6 right-6 h-8 rounded-full bg-brand-cyan/40 blur-xl pointer-events-none" />
              <div className="absolute -bottom-3 left-12 right-12 h-6 rounded-full bg-brand-violet/50 blur-lg pointer-events-none" />

              {/* SVG CYBER SPORTS CAR GRAPHICS */}
              <svg
                viewBox="0 0 540 160"
                className="w-[320px] sm:w-[460px] md:w-[540px] h-auto drop-shadow-[0_12px_25px_rgba(6,182,212,0.35)] relative z-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Car Chassis Metallic Gradient */}
                  <linearGradient id="cyberChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="40%" stopColor="#0f172a" />
                    <stop offset="70%" stopColor="#090d16" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>

                  {/* Window Glass Gradient */}
                  <linearGradient id="cyberGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
                  </linearGradient>

                  {/* Neon Cyan Stroke Gradient */}
                  <linearGradient id="neonCyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>

                  {/* Interior Cockpit Glow */}
                  <radialGradient id="cockpitGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 1. CAR BODY / MAIN SILHOUETTE */}
                <path
                  d="M25 125 L40 132 H80 C88 115 110 110 125 110 C140 110 162 115 170 132 H380 C388 115 410 110 425 110 C440 110 462 115 470 132 H515 L525 120 L515 98 L460 88 L375 75 L280 40 H200 L115 75 L35 90 Z"
                  fill="url(#cyberChassis)"
                  stroke="url(#neonCyanGlow)"
                  strokeWidth="2.5"
                />

                {/* Aerodynamic Side Skirt Neon Accent */}
                <path
                  d="M175 130 H375"
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_8px_#06b6d4]"
                />

                {/* Rear Spoiler */}
                <path
                  d="M20 90 L10 75 L35 72 L45 88 Z"
                  fill="#0f172a"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
                <path d="M15 75 H55" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

                {/* 2. REAR WINDOW & FASTBACK DECK */}
                <path
                  d="M125 74 L200 44 H235 L175 74 Z"
                  fill="url(#cyberGlass)"
                  stroke="#0ea5e9"
                  strokeWidth="1.2"
                />

                {/* 3. COCKPIT INTERIOR (Visible when door lifts!) */}
                <g className="transition-opacity duration-500">
                  {/* Cockpit Backing */}
                  <path
                    d="M225 44 H305 L360 74 H185 Z"
                    fill="#030712"
                  />
                  {/* Digital Dashboard & Hologram Projector Glow */}
                  {isDoorsOpen && (
                    <motion.ellipse
                      cx="275"
                      cy="60"
                      rx="45"
                      ry="20"
                      fill="url(#cockpitGlow)"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  {/* Steering & HUD Icon */}
                  <circle cx="310" cy="62" r="7" stroke="#22d3ee" strokeWidth="1.5" />
                  <path d="M305 62 H315 M310 57 V67" stroke="#22d3ee" strokeWidth="1" />
                </g>

                {/* 4. SCISSOR / GULLWING DOOR (ANIMATED!) */}
                <motion.g
                  style={{ transformOrigin: '230px 45px' }}
                  initial={{ rotate: 0, y: 0 }}
                  animate={
                    isDoorsOpen
                      ? { rotate: -48, y: -24, x: -6 }
                      : { rotate: 0, y: 0, x: 0 }
                  }
                  transition={{
                    type: 'spring',
                    stiffness: 70,
                    damping: 12,
                    duration: 0.8,
                  }}
                >
                  {/* Door Glass Canopy */}
                  <path
                    d="M235 44 H305 L355 74 H205 Z"
                    fill="url(#cyberGlass)"
                    stroke="#22d3ee"
                    strokeWidth="1.8"
                  />
                  {/* Door Lower Panel */}
                  <path
                    d="M205 74 H355 L340 106 H220 Z"
                    fill="url(#cyberChassis)"
                    stroke="url(#neonCyanGlow)"
                    strokeWidth="2"
                  />
                  {/* Cyber Door Accent Line */}
                  <path
                    d="M230 88 H325"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Futuristic Flush Handle with LED dot */}
                  <rect x="250" y="85" width="22" height="4" rx="2" fill="#06b6d4" />
                </motion.g>

                {/* 5. FRONT HOOD & NOSE CONTOURS */}
                <path
                  d="M375 75 L460 88 L510 98"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* 6. FRONT HEADLIGHTS (Dual Cyber Beam Projectors) */}
                <g className="filter drop-shadow-[0_0_10px_#22d3ee]">
                  <polygon
                    points="485,96 520,102 510,108 480,100"
                    fill="#e0f2fe"
                  />
                  <circle cx="496" cy="100" r="3.5" fill="#38bdf8" className="animate-pulse" />
                  <circle cx="508" cy="103" r="3" fill="#22d3ee" />
                </g>

                {/* 7. REAR TAILLIGHT (Aero Cyber Lightbar) */}
                <g className="filter drop-shadow-[0_0_8px_#ef4444]">
                  <line x1="25" y1="92" x2="35" y2="120" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                  <line x1="28" y1="95" x2="36" y2="115" stroke="#fca5a5" strokeWidth="2" />
                </g>

                {/* 8. WHEELS (Spin during drive-in, stop when parked) */}
                {/* Rear Wheel (cx=125, cy=125) */}
                <g transform="translate(125, 125)">
                  {/* Tire outer rubber */}
                  <circle cx="0" cy="0" r="28" fill="#020617" stroke="#334155" strokeWidth="3" />
                  {/* Rotating Rims */}
                  <motion.g
                    animate={
                      animationStep === 'driving'
                        ? { rotate: 1080 }
                        : { rotate: 0 }
                    }
                    transition={{
                      duration: 1.8,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                  >
                    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                    {/* Multi-Spokes */}
                    <line x1="0" y1="-17" x2="0" y2="17" stroke="#22d3ee" strokeWidth="2.5" />
                    <line x1="-17" y1="0" x2="17" y2="0" stroke="#22d3ee" strokeWidth="2.5" />
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="12" y1="-12" x2="-12" y2="12" stroke="#8b5cf6" strokeWidth="2" />
                    {/* Hubcap */}
                    <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                  </motion.g>
                </g>

                {/* Front Wheel (cx=425, cy=125) */}
                <g transform="translate(425, 125)">
                  {/* Tire outer rubber */}
                  <circle cx="0" cy="0" r="28" fill="#020617" stroke="#334155" strokeWidth="3" />
                  {/* Rotating Rims */}
                  <motion.g
                    animate={
                      animationStep === 'driving'
                        ? { rotate: 1080 }
                        : { rotate: 0 }
                    }
                    transition={{
                      duration: 1.8,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                  >
                    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                    {/* Multi-Spokes */}
                    <line x1="0" y1="-17" x2="0" y2="17" stroke="#22d3ee" strokeWidth="2.5" />
                    <line x1="-17" y1="0" x2="17" y2="0" stroke="#22d3ee" strokeWidth="2.5" />
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="12" y1="-12" x2="-12" y2="12" stroke="#8b5cf6" strokeWidth="2" />
                    {/* Hubcap */}
                    <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                  </motion.g>
                </g>
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Road Surface Line */}
        <div className="relative w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] mt-1" />
      </div>

      {/* Holographic Beam / Connection Arc from Open Doors */}
      <AnimatePresence>
        {isDoorsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 36 }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full flex justify-center items-center my-2 pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cyan/15 border border-brand-cyan/30 text-xs font-mono text-cyan-300 shadow-lg shadow-brand-cyan/20">
              <Sparkles className="h-3.5 w-3.5 text-brand-cyan animate-spin" />
              <span>CARGO DOORS UNLOCKED • DISPATCHING OPTIONS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THE REVEALED OPTIONS: SEND & RECEIVE CARDS */}
      <AnimatePresence>
        {isCardsRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 60,
              damping: 15,
              duration: 0.6,
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-6"
          >
            {/* OPTION 1: SEND FILES & TEXT */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-brand-violet/40 via-brand-violet/10 to-transparent"
            >
              <div className="relative h-full rounded-[23px] bg-navy-800/95 p-8 sm:p-10 flex flex-col justify-between overflow-hidden backdrop-blur-xl border border-white/5 group-hover:border-brand-violet/40 transition-colors shadow-2xl">
                {/* Ambient Corner Glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-brand-violet/20 blur-3xl pointer-events-none group-hover:bg-brand-violet/30 transition-all" />

                <div>
                  {/* Icon Container */}
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/15 text-violet-400 border border-brand-violet/30 mb-6 group-hover:scale-110 group-hover:bg-brand-violet group-hover:text-white transition-all duration-300 shadow-lg shadow-brand-violet/20">
                    <UploadCloud className="h-8 w-8" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Send Files &amp; Text
                  </h2>
                  <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                    Drop your files, videos, or paste text notes &amp; links. Generate a one-time 4-digit PIN without uploading to the cloud.
                  </p>

                  {/* Feature pills */}
                  <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      Files &amp; Media
                    </span>
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      Text &amp; Snippets
                    </span>
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      Encrypted P2P
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <Button
                    onClick={() => handleTriggerTransform('/send')}
                    size="lg"
                    className="w-full gap-2 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold text-base shadow-xl shadow-brand-violet/25 group-hover:shadow-brand-violet/40 h-13 rounded-2xl"
                  >
                    <span>Select Files &amp; Text</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* OPTION 2: RECEIVE FILES */}
            <motion.div
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-brand-cyan/40 via-brand-cyan/10 to-transparent"
            >
              <div className="relative h-full rounded-[23px] bg-navy-800/95 p-8 sm:p-10 flex flex-col justify-between overflow-hidden backdrop-blur-xl border border-white/5 group-hover:border-brand-cyan/40 transition-colors shadow-2xl">
                {/* Ambient Corner Glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-brand-cyan/20 blur-3xl pointer-events-none group-hover:bg-brand-cyan/30 transition-all" />

                <div>
                  {/* Icon Container */}
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/15 text-cyan-400 border border-brand-cyan/30 mb-6 group-hover:scale-110 group-hover:bg-brand-cyan group-hover:text-navy-900 transition-all duration-300 shadow-lg shadow-brand-cyan/20">
                    <Download className="h-8 w-8" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Receive Files
                  </h2>
                  <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                    Enter a 4-digit PIN or open a shared link to download files and copy text directly from the sender&apos;s device.
                  </p>

                  {/* Feature pills */}
                  <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      Direct P2P download
                    </span>
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      1-Click Text Copy
                    </span>
                    <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                      Zero Storage
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <Button
                    onClick={() => handleTriggerTransform('/receive')}
                    size="lg"
                    className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-navy-900 font-semibold text-base shadow-xl shadow-brand-cyan/25 group-hover:shadow-brand-cyan/40 h-13 rounded-2xl"
                  >
                    <span>Enter Transfer Code</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN TRANSFORMERS JET ANIMATION OVERLAY */}
      <AnimatePresence>
        {transformerTarget && (
          <TransformerSequence
            destination={transformerTarget}
            onComplete={() => setTransformerTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
