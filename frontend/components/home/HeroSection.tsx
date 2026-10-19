'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 text-center">
      {/* Background ambient gradient orbs */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Subtle particle grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0a_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="container relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        {/* Top pill badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-brand-violet/30 bg-brand-violet/10 px-4 py-1.5 text-xs font-medium text-violet-300 shadow-sm backdrop-blur-md mb-8"
        >
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          <span>Next-Generation Peer-to-Peer File Sharing</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-brand-cyan animate-ping" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]"
        >
          Your files. Your devices.{' '}
          <span className="bg-gradient-to-r from-brand-violet via-purple-400 to-brand-cyan bg-clip-text text-transparent">
            One code.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg text-slate-300 sm:text-xl max-w-2xl mx-auto leading-relaxed"
        >
          Share anything between any device instantly — no account, no limits, no cloud. Powered by direct WebRTC peer-to-peer data channels.
        </motion.p>

        {/* CTA quick action preview */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-400"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Zero Cloud Storage</span>
          </div>
          <span className="text-white/20">&bull;</span>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-brand-cyan" />
            <span>LAN &amp; WAN Direct Speed</span>
          </div>
          <span className="text-white/20">&bull;</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-brand-violet" />
            <span>Ephemeral Sessions</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
