'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, FastForward, Navigation, ShieldCheck } from 'lucide-react';
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

  // Sequence phases:
  // 1. 'decoupling': Car rises into mid-air, panels loosen & sparks fire (0 - 0.8s)
  // 2. 'morphing': Mechanical expansion into Supersonic Fighter Jet (0.8s - 2.0s)
  // 3. 'afterburners': Twin jet engines ignite with shock diamonds & sonic rings (2.0s - 2.7s)
  // 4. 'hyperspace_flyby': Plane banks & zooms DIRECTLY into the camera/screen (2.7s - 3.4s)
  const [phase, setPhase] = useState<
    'decoupling' | 'morphing' | 'afterburners' | 'hyperspace_flyby'
  >('decoupling');

  const [machSpeed, setMachSpeed] = useState('0.0');

  useEffect(() => {
    // Trigger synthesized audio effects
    soundEffects.playTransformationSequence();

    // Timeline steps
    const timerMorph = setTimeout(() => {
      setPhase('morphing');
      setMachSpeed('1.4');
    }, 800);

    const timerAfterburners = setTimeout(() => {
      setPhase('afterburners');
      setMachSpeed('3.8');
    }, 1900);

    const timerFlyby = setTimeout(() => {
      setPhase('hyperspace_flyby');
      setMachSpeed('MACH 5.2');
    }, 2650);

    const timerComplete = setTimeout(() => {
      router.push(destination);
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(timerMorph);
      clearTimeout(timerAfterburners);
      clearTimeout(timerFlyby);
      clearTimeout(timerComplete);
    };
  }, [destination, onComplete, router]);

  const handleSkip = () => {
    router.push(destination);
    onComplete();
  };

  const isMorphingOrLater =
    phase === 'morphing' ||
    phase === 'afterburners' ||
    phase === 'hyperspace_flyby';

  const isAfterburnersOrLater =
    phase === 'afterburners' || phase === 'hyperspace_flyby';

  const isFlyby = phase === 'hyperspace_flyby';

  const isSend = destination === '/send';
  const themeColor = isSend ? '#8b5cf6' : '#06b6d4'; // Violet for Send, Cyan for Receive
  const themeGlow = isSend ? 'shadow-brand-violet/50' : 'shadow-brand-cyan/50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-navy-950/95 backdrop-blur-2xl select-none">
      {/* 1. FULL-SCREEN SCI-FI CYBER GRID & PERSPECTIVE WARP TUNNEL */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Depth Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${themeColor}1a 0%, #030712 75%)`,
          }}
        />

        {/* 3D Cyber Perspective Floor */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none"
          style={{
            transform: 'perspective(600px) rotateX(60deg) translateY(120px)',
            transformOrigin: 'bottom center',
            opacity: isFlyby ? 0.2 : 0.6,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Dynamic Hyperspace Stars & Speed Streaks during flyby */}
        {isFlyby && (
          <div className="absolute inset-0">
            {Array.from({ length: 30 }).map((_, i) => {
              const angle = (i / 30) * 360;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0.1, opacity: 0 }}
                  animate={{ scale: [0.1, 4], opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: (i % 6) * 0.08,
                    ease: 'easeIn',
                  }}
                  className="absolute top-1/2 left-1/2 w-1.5 h-32 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? '#38bdf8' : '#c084fc',
                    transformOrigin: 'center top',
                    transform: `rotate(${angle}deg) translateY(-250px)`,
                    boxShadow: '0 0 16px #38bdf8',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Sonic Boom Shockwave Rings expanding from center */}
        {isAfterburnersOrLater && (
          <>
            <motion.div
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-brand-cyan/60 pointer-events-none shadow-[0_0_30px_#06b6d4]"
            />
            <motion.div
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 4.0, opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, delay: 0.3, ease: 'easeOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-purple-400/50 pointer-events-none"
            />
          </>
        )}
      </div>

      {/* 2. TOP HUD BAR: TARGETING, MODE, SPEED READOUT & SKIP BUTTON */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900/90 border border-white/10 shadow-lg">
            <Zap className="h-5 w-5 text-brand-cyan animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                {phase === 'decoupling'
                  ? 'INITIATING TRANSFORMATION PROTOCOL'
                  : phase === 'morphing'
                  ? 'CYBER VEHICLE -> AERO FIGHTER JET'
                  : phase === 'afterburners'
                  ? 'DUAL SCRAMJET AFTERBURNERS ENGAGED'
                  : 'SUPERSONIC APPROACH: OPENING TERMINAL'}
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-brand-cyan">DESTINATION: {destination.toUpperCase().replace('/', '')}</span>
              <span>•</span>
              <span className="text-purple-300">VELOCITY: {machSpeed}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-md"
        >
          <FastForward className="h-3.5 w-3.5" />
          <span>Skip to {isSend ? 'Send' : 'Receive'}</span>
        </button>
      </div>

      {/* 3. CENTER TRANSFORMING ENTITY (CAR -> JET -> HYPER ZOOM TO VIEWER) */}
      <div className="relative z-20 flex items-center justify-center w-full h-full pointer-events-none">
        <motion.div
          animate={
            isFlyby
              ? {
                  // Phase 4: Plane flies right into the viewer's screen!
                  scale: [1.2, 14],
                  z: [0, 800],
                  y: [0, 140],
                  opacity: [1, 1, 0.9, 0],
                  rotateZ: isSend ? [-12, -4] : [12, 4],
                }
              : isAfterburnersOrLater
              ? {
                  // Phase 3: High speed hovering with slight bank towards chosen tab
                  scale: [1, 1.18, 1.15],
                  y: [-15, -25],
                  rotateZ: isSend ? -10 : 10,
                  transition: { duration: 0.6, ease: 'easeOut' },
                }
              : phase === 'morphing'
              ? {
                  // Phase 2: Mechanical morphing mid-air shake
                  scale: [0.95, 1.08, 1],
                  y: [10, -15],
                  rotateZ: [0, -3, 3, 0],
                  transition: { duration: 1.1, ease: 'easeInOut' },
                }
              : {
                  // Phase 1: Car lifts off from road
                  y: [60, 0],
                  scale: [0.9, 1],
                  transition: { duration: 0.7, ease: 'easeOut' },
                }
          }
          className="relative flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Glowing Aura Behind Entity */}
          <div
            className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-70 transition-all duration-700 ${themeGlow}`}
            style={{ backgroundColor: `${themeColor}40` }}
          />

          {/* TRANSFORMATION STAGE: DYNAMIC SVG MORPH */}
          <svg
            viewBox="0 0 600 400"
            className="w-[340px] sm:w-[520px] md:w-[680px] lg:w-[820px] h-auto drop-shadow-[0_20px_50px_rgba(6,182,212,0.4)] overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="tfChassis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#0f172a" />
                <stop offset="70%" stopColor="#090d16" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <linearGradient id="tfJetMetal" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="35%" stopColor="#1e293b" />
                <stop offset="75%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>

              <linearGradient id="tfNeonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              <linearGradient id="tfThrusterFlame" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>

              <radialGradient id="plasmaCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#22d3ee" />
                <stop offset="80%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* --- JET WINGS (Unfold outward like a Transformer as morphing engages) --- */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isMorphingOrLater
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 75,
                damping: 14,
                delay: 0.1,
              }}
              style={{ transformOrigin: '300px 200px' }}
            >
              {/* Left Delta Wing */}
              <polygon
                points="240,190 70,270 120,310 240,240"
                fill="url(#tfJetMetal)"
                stroke="url(#tfNeonGlow)"
                strokeWidth="2.5"
              />
              {/* Left Wing Plasma Edge Slat */}
              <line
                x1="70"
                y1="270"
                x2="120"
                y2="310"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_#06b6d4]"
              />
              {/* Left Missile/Sensor Pod */}
              <rect
                x="85"
                y="280"
                width="36"
                height="8"
                rx="4"
                fill="#0f172a"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                transform="rotate(-25 85 280)"
              />

              {/* Right Delta Wing */}
              <polygon
                points="360,190 530,270 480,310 360,240"
                fill="url(#tfJetMetal)"
                stroke="url(#tfNeonGlow)"
                strokeWidth="2.5"
              />
              {/* Right Wing Plasma Edge Slat */}
              <line
                x1="530"
                y1="270"
                x2="480"
                y2="310"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_#06b6d4]"
              />
              {/* Right Missile/Sensor Pod */}
              <rect
                x="475"
                y="275"
                width="36"
                height="8"
                rx="4"
                fill="#0f172a"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                transform="rotate(25 475 275)"
              />

              {/* Twin Canted Stealth Tail Fins */}
              <polygon
                points="210,180 180,90 220,110 240,180"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2"
              />
              <polygon
                points="390,180 420,90 380,110 360,180"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            </motion.g>

            {/* --- CAR WHEELS MORPH INTO TURBOJET ENGINES --- */}
            {/* Front & Rear Wheels folding 90 deg inward into Turbine Intakes */}
            <motion.g
              animate={
                isMorphingOrLater
                  ? { y: -20, scaleY: 0.5, scaleX: 1.2 }
                  : { y: 0, scaleY: 1, scaleX: 1 }
              }
              transition={{ duration: 0.7 }}
            >
              {/* Left Turbine / Wheel */}
              <g transform="translate(190, 230)">
                <circle cx="0" cy="0" r="28" fill="#020617" stroke="#06b6d4" strokeWidth="3" />
                {isMorphingOrLater ? (
                  // Spinning Glowing Jet Turbine Blades
                  <motion.g
                    animate={{ rotate: 1800 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="-16" y1="0" x2="16" y2="0" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="0" y1="-16" x2="0" y2="16" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="-11" y1="-11" x2="11" y2="11" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="11" y1="-11" x2="-11" y2="11" stroke="#22d3ee" strokeWidth="2" />
                    <circle cx="0" cy="0" r="5" fill="#ffffff" />
                  </motion.g>
                ) : (
                  // Car Rim
                  <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                )}
              </g>

              {/* Right Turbine / Wheel */}
              <g transform="translate(410, 230)">
                <circle cx="0" cy="0" r="28" fill="#020617" stroke="#06b6d4" strokeWidth="3" />
                {isMorphingOrLater ? (
                  // Spinning Glowing Jet Turbine Blades
                  <motion.g
                    animate={{ rotate: 1800 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="-16" y1="0" x2="16" y2="0" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="0" y1="-16" x2="0" y2="16" stroke="#38bdf8" strokeWidth="2" />
                    <line x1="-11" y1="-11" x2="11" y2="11" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="11" y1="-11" x2="-11" y2="11" stroke="#22d3ee" strokeWidth="2" />
                    <circle cx="0" cy="0" r="5" fill="#ffffff" />
                  </motion.g>
                ) : (
                  // Car Rim
                  <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                )}
              </g>
            </motion.g>

            {/* --- MAIN FUSELAGE / COCKPIT MORPH --- */}
            {/* The car body morphs into a supersonic needle nose fighter jet */}
            <motion.path
              animate={
                isMorphingOrLater
                  ? {
                      d: 'M300 45 L340 140 L370 200 L380 270 L300 290 L220 270 L230 200 L260 140 Z',
                    }
                  : {
                      d: 'M300 110 L440 150 L480 210 L480 260 L300 260 L120 260 L120 210 L160 150 Z',
                    }
              }
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              fill="url(#tfChassis)"
              stroke="url(#tfNeonGlow)"
              strokeWidth="2.5"
            />

            {/* Supersonic Jet Cockpit Canopy with Glowing HUD */}
            <motion.polygon
              animate={
                isMorphingOrLater
                  ? {
                      points: '300,90 322,170 300,195 278,170',
                      opacity: 1,
                    }
                  : {
                      points: '300,140 360,180 300,200 240,180',
                      opacity: 0.8,
                    }
              }
              transition={{ duration: 0.9 }}
              fill="#0ea5e9"
              fillOpacity="0.45"
              stroke="#22d3ee"
              strokeWidth="2"
            />

            {/* Cockpit Reticle Target Dot */}
            <circle cx="300" cy="150" r="4" fill="#ffffff" className="animate-ping" />

            {/* Transformer Mechanical Seam Accents */}
            <line x1="285" y1="210" x2="315" y2="210" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="300" y1="215" x2="300" y2="260" stroke="#06b6d4" strokeWidth="2" />

            {/* --- DUAL SCRAMJET AFTERBURNER EXHAUST (Firing during afterburners & flyby!) --- */}
            {isAfterburnersOrLater && (
              <motion.g
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: [0.9, 1, 0.85], scaleY: [1, 1.4, 1.2] }}
                transition={{ duration: 0.25, repeat: Infinity }}
                style={{ transformOrigin: '300px 290px' }}
              >
                {/* Left Thruster Flame Cones */}
                <polygon
                  points="255,275 275,275 265,370"
                  fill="url(#tfThrusterFlame)"
                  className="filter drop-shadow-[0_0_15px_#38bdf8]"
                />
                <circle cx="265" cy="275" r="9" fill="url(#plasmaCore)" />

                {/* Right Thruster Flame Cones */}
                <polygon
                  points="325,275 345,275 335,370"
                  fill="url(#tfThrusterFlame)"
                  className="filter drop-shadow-[0_0_15px_#38bdf8]"
                />
                <circle cx="335" cy="275" r="9" fill="url(#plasmaCore)" />

                {/* Shock Diamonds Inside Exhaust */}
                <polygon points="265,300 262,315 265,330 268,315" fill="#ffffff" />
                <polygon points="335,300 332,315 335,330 338,315" fill="#ffffff" />
              </motion.g>
            )}

            {/* Cyber Callout Decal on Fuselage */}
            <text
              x="300"
              y="245"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="3"
            >
              {isSend ? 'TX-AERO' : 'RX-AERO'}
            </text>
          </svg>
        </motion.div>
      </div>

      {/* 4. BOTTOM STATUS BADGE & PROGRESSION INDICATOR */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <Navigation className="h-4 w-4 text-brand-cyan animate-spin" />
          <span className="text-xs font-mono text-slate-200">
            {phase === 'decoupling' && 'DEPLOYING TRANSFORMER HYDRAULICS...'}
            {phase === 'morphing' && 'CONVERTING CAR CHASSIS TO FIGHTER JET...'}
            {phase === 'afterburners' && 'LOCKING VECTOR TO DESTINATION...'}
            {phase === 'hyperspace_flyby' && `HYPERSONIC ENGAGED — APPROACHING ${destination.toUpperCase().replace('/', '')}!`}
          </span>
        </div>
      </div>

      {/* 5. CAMERA FLASH TRANSITION BURST UPON FLYING THROUGH SCREEN */}
      <AnimatePresence>
        {isFlyby && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="absolute inset-0 pointer-events-none z-50 bg-gradient-to-t from-cyan-400/40 via-white to-purple-500/40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
