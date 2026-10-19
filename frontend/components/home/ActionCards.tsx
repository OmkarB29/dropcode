'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UploadCloud, Download, ArrowRight, Shield, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ActionCards() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 mb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {/* Send Files Card */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-brand-violet/40 via-brand-violet/10 to-transparent"
        >
          <div className="relative h-full rounded-[23px] bg-navy-800/90 p-8 sm:p-10 flex flex-col justify-between overflow-hidden backdrop-blur-xl border border-white/5 group-hover:border-brand-violet/40 transition-colors">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-brand-violet/20 blur-3xl pointer-events-none group-hover:bg-brand-violet/30 transition-all" />

            <div>
              {/* Icon Container */}
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/15 text-violet-400 border border-brand-violet/30 mb-6 group-hover:scale-110 group-hover:bg-brand-violet group-hover:text-white transition-all duration-300 shadow-lg shadow-brand-violet/20">
                <UploadCloud className="h-8 w-8" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Send Files
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                Drop your files and generate a one-time 8-character code or QR. Approve incoming receivers securely with zero upload to cloud.
              </p>

              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  Multi-file support
                </span>
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  Up to 2 GB
                </span>
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  Instant QR Code
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <Link href="/send" className="w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold text-base shadow-xl shadow-brand-violet/25 group-hover:shadow-brand-violet/40"
                >
                  <span>Select &amp; Send Files</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Receive Files Card */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-brand-cyan/40 via-brand-cyan/10 to-transparent"
        >
          <div className="relative h-full rounded-[23px] bg-navy-800/90 p-8 sm:p-10 flex flex-col justify-between overflow-hidden backdrop-blur-xl border border-white/5 group-hover:border-brand-cyan/40 transition-colors">
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
                Enter an 8-character transfer code or open a shared link to download files directly from the sender&apos;s device over encrypted P2P.
              </p>

              {/* Feature pills */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  Direct P2P download
                </span>
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  Manifest preview
                </span>
                <span className="rounded-lg bg-navy-900/80 px-2.5 py-1 border border-white/5">
                  No sign-up required
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <Link href="/receive" className="w-full">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-navy-900 font-semibold text-base shadow-xl shadow-brand-cyan/25 group-hover:shadow-brand-cyan/40"
                >
                  <span>Enter Transfer Code</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
