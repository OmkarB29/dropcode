'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Hash,
  Share2,
  Zap,
  Lock,
  Smartphone,
  UserX,
  CheckCircle2,
} from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Hash,
      title: 'Generate a code',
      description:
        'Drop your files and generate a unique, short 8-character transfer code (e.g. ABCD-7392) or a scannable QR code.',
      accent: 'border-brand-violet/40 text-violet-400 bg-brand-violet/10',
    },
    {
      step: '02',
      icon: Share2,
      title: 'Share the code',
      description:
        'Tell the receiver your code or show them the QR code on your phone or screen. The session stays active for 10 minutes.',
      accent: 'border-brand-cyan/40 text-cyan-400 bg-brand-cyan/10',
    },
    {
      step: '03',
      icon: Zap,
      title: 'Files fly across',
      description:
        'Approve the receiver, and files stream directly peer-to-peer at maximum network speed with live progress and zero cloud storage.',
      accent: 'border-purple-400/40 text-purple-300 bg-purple-500/10',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Direct WebRTC data channels transfer files peer-to-peer over local network or optimal internet routes without server throttling.',
      iconColor: 'text-amber-400',
    },
    {
      icon: Lock,
      title: 'Secure & Ephemeral',
      description:
        'End-to-end encrypted DTLS data channels. Codes auto-expire in 10 minutes, and the sender must explicitly approve the receiver.',
      iconColor: 'text-brand-violet',
    },
    {
      icon: Smartphone,
      title: 'Any Device',
      description:
        'Works seamlessly between iOS, Android, macOS, Windows, Linux, and Chromebooks using any modern web browser.',
      iconColor: 'text-brand-cyan',
    },
    {
      icon: UserX,
      title: 'No Account Ever',
      description:
        'No sign-ups, no passwords, no email collection, and no tracking. Open the page and start sharing in 3 seconds.',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 pb-24">
      {/* How it Works Section */}
      <div className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-brand-cyan mb-2">
            Seamless Workflow
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            How DropCode Works
          </h3>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Effortless peer-to-peer file transfer in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative rounded-2xl border border-white/5 bg-navy-800/50 p-6 backdrop-blur-sm hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${item.accent}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-slate-600">
                    {item.step}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Core Features Grid */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-mono tracking-widest text-brand-violet mb-2">
            Why Choose DropCode
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered for Privacy &amp; Speed
          </h3>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Built with modern web standards, zero servers in the file path.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-white/5 bg-navy-800/40 p-6 hover:bg-navy-800/70 hover:border-white/10 transition-all duration-200"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 border border-white/5 mb-4">
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h4 className="text-base font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
