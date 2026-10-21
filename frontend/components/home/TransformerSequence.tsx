'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, FastForward, Navigation } from 'lucide-react';
import { soundEffects } from '@/lib/soundEffects';

interface TransformerSequenceProps {
  destination: '/send' | '/receive';
  onComplete: () => void;
}

export function TransformerSequence({
  destination,
  onComplete,
}: TransformerSequenceProps) {
  const router = useRouter();

  // Snappy 3-stage sequence for 60fps buttery-smooth hardware acceleration:
  // 1. 'transform' (0 - 0.6s): Car chassis unlocks, wheels fold in, wings sweep open
  // 2. 'ignite' (0.6 - 1.0s): Twin afterburners fire up & trajectory locks
  // 3. 'flyby' (1.0 - 1.6s): Jet zooms directly TOWARDS screen at hypersonic speed
  const [stage, setStage] = useState<'transform' | 'ignite' | 'flyby'>('transform');

  useEffect(() => {
    // Play ultra-lightweight Web Audio soundscape
    soundEffects.playTransformationSequence();

    const tIgnite = setTimeout(() => {
      setStage('ignite');
    }, 600);

    const tFlyby = setTimeout(() => {
      setStage('flyby');
    }, 1050);

    const tComplete = setTimeout(() => {
      router.push(destination);
      onComplete();
    }, 1650);

    return () => {
      clearTimeout(tIgnite);
      clearTimeout(tFlyby);
      clearTimeout(tComplete);
    };
  }, [destination, onComplete, router]);

  const handleSkip = () => {
    router.push(destination);
    onComplete();
  };

  const isSend = destination === '/send';
  const themeHex = isSend ? '#8b5cf6' : '#06b6d4';
  const destName = isSend ? 'SEND PORTAL' : 'RECEIVE PORTAL';

  const isTransformed = stage === 'ignite' || stage === 'flyby';
  const isFlyby = stage === 'flyby';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030712] select-none"
      style={{ willChange: 'opacity' }}
    >
      {/* 1. LIGHTWEIGHT GPU-ACCELERATED BACKGROUND GRID */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Simple Radial Gradient (No costly blur filters) */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${themeHex}22 0%, #030712 80%)`,
          }}
        />

        {/* Perspective Cyber Floor (Hardware rendered) */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d412_1px,transparent_1px),linear-gradient(to_bottom,#06b6d412_1px,transparent_1px)] bg-[size:50px_50px]"
          style={{
            transform: 'perspective(500px) rotateX(65deg) translateY(100px)',
            transformOrigin: 'bottom center',
            willChange: 'transform',
          }}
        />

        {/* Lightweight Warp Lines (Active only during hypersonic flyby) */}
        {isFlyby && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <div
                key={angle}
                className="absolute w-[2px] h-[40vh] bg-gradient-to-t from-cyan-400 to-transparent"
                style={{
                  transformOrigin: 'center center',
                  transform: `rotate(${angle}deg) translateY(-80px)`,
                  animation: 'warpPulse 0.3s ease-out infinite',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. TOP HUD: MINIMALIST & HARDWARE COMPOSITED */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 border border-white/10">
            <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
              <span>
                {stage === 'transform'
                  ? 'MORPHING: CAR -> JET'
                  : stage === 'ignite'
                  ? 'AFTERBURNERS LOCKED'
                  : 'MACH 5 APPROACH'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              TARGET: <span style={{ color: themeHex }}>{destName}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors"
        >
          <FastForward className="h-3 w-3" />
          <span>Skip</span>
        </button>
      </div>

      {/* 3. CENTER TRANSFORMING VEHICLE: 100% GPU TRANSFORMED */}
      <div className="relative z-20 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={
            isFlyby
              ? {
                  // Phase 3: Plane accelerates directly TOWARDS the viewer!
                  scale: [1, 10],
                  y: [0, 80],
                  opacity: [1, 1, 0.7, 0],
                }
              : isTransformed
              ? {
                  // Phase 2: Jet locked in mid-air bank with slight roll
                  scale: [1, 1.08],
                  rotateZ: isSend ? -6 : 6,
                  y: -15,
                }
              : {
                  // Phase 1: Car lifts and decouples
                  scale: [0.95, 1],
                  y: [20, 0],
                }
          }
          transition={
            isFlyby
              ? { duration: 0.58, ease: [0.4, 0, 0.2, 1] }
              : { duration: 0.45, ease: 'easeOut' }
          }
          style={{ willChange: 'transform, opacity' }}
          className="relative flex items-center justify-center"
        >
          {/* Main Cyber Vehicle & Jet Composite SVG */}
          <svg
            viewBox="0 0 540 320"
            className="w-[320px] sm:w-[480px] md:w-[620px] h-auto overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="optChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <linearGradient id="optCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              <linearGradient id="optFlame" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* --- TRANSFORMER JET DELTA WINGS (Folds out on GPU scale) --- */}
            <motion.g
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                isTransformed
                  ? { scaleX: 1, opacity: 1 }
                  : { scaleX: 0, opacity: 0 }
              }
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ transformOrigin: '270px 160px', willChange: 'transform' }}
            >
              {/* Left Delta Wing */}
              <polygon
                points="220,150 70,220 120,260 220,190"
                fill="url(#optChassis)"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              <line x1="70" y1="220" x2="120" y2="260" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

              {/* Right Delta Wing */}
              <polygon
                points="320,150 470,220 420,260 320,190"
                fill="url(#optChassis)"
                stroke="#06b6d4"
                strokeWidth="2.5"
              />
              <line x1="470" y1="220" x2="420" y2="260" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

              {/* Twin Tail Canted Stabilizers */}
              <polygon points="190,140 170,70 200,85 215,140" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
              <polygon points="350,140 370,70 340,85 325,140" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
            </motion.g>

            {/* --- CAR WHEELS MORPHING INTO TURBINES --- */}
            <motion.g
              animate={
                isTransformed
                  ? { scaleY: 0.4, y: -10, opacity: 0.9 }
                  : { scaleY: 1, y: 0, opacity: 1 }
              }
              transition={{ duration: 0.35 }}
              style={{ willChange: 'transform' }}
            >
              {/* Left Wheel / Intake */}
              <circle cx="170" cy="190" r="24" fill="#020617" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="170" cy="190" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

              {/* Right Wheel / Intake */}
              <circle cx="370" cy="190" r="24" fill="#020617" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="370" cy="190" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            </motion.g>

            {/* --- MAIN AERODYNAMIC BODY (AERO FUSELAGE) --- */}
            <polygon
              points="270,40 310,120 330,170 340,230 270,250 200,230 210,170 230,120"
              fill="url(#optChassis)"
              stroke="url(#optCyan)"
              strokeWidth="2.5"
            />

            {/* Cockpit Canopy */}
            <polygon
              points="270,75 290,140 270,165 250,140"
              fill="#0284c7"
              fillOpacity="0.4"
              stroke="#22d3ee"
              strokeWidth="2"
            />
            <circle cx="270" cy="120" r="3" fill="#ffffff" />

            {/* --- SCRAMJET AFTERBURNER EXHAUST (Hardware Scale) --- */}
            {isTransformed && (
              <motion.g
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [1, 1.25, 1] }}
                transition={{ duration: 0.2, repeat: Infinity }}
                style={{ transformOrigin: '270px 245px', willChange: 'transform' }}
              >
                {/* Left Thruster Plume */}
                <polygon points="230,235 250,235 240,310" fill="url(#optFlame)" />
                <circle cx="240" cy="235" r="7" fill="#38bdf8" />

                {/* Right Thruster Plume */}
                <polygon points="290,235 310,235 300,310" fill="url(#optFlame)" />
                <circle cx="300" cy="235" r="7" fill="#38bdf8" />
              </motion.g>
            )}

            {/* Aero Registration Decal */}
            <text
              x="270"
              y="205"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="2"
            >
              {isSend ? 'DROP-TX' : 'DROP-RX'}
            </text>
          </svg>
        </motion.div>
      </div>

      {/* 4. BOTTOM STATUS PILL */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-900 border border-white/10 shadow-lg">
          <Navigation className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-slate-300">
            {stage === 'transform' && 'RECONFIGURING AIRFRAME...'}
            {stage === 'ignite' && 'AFTERBURNERS AT MAXIMUM THRUST...'}
            {stage === 'flyby' && 'FLYING TO DESTINATION...'}
          </span>
        </div>
      </div>

      {/* 5. LIGHTWEIGHT CAMERA FLASH TRANSITION (Instant GPU Opacity) */}
      {isFlyby && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0.9] }}
          transition={{ duration: 0.5, ease: 'easeIn' }}
          className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-t from-cyan-400/30 via-white to-purple-500/30"
          style={{ willChange: 'opacity' }}
        />
      )}
    </div>
  );
}
