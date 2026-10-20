'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Laptop,
  Check,
  ShieldCheck,
  HelpCircle,
  HardDrive,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  const [deviceName, setDeviceName] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dropcode_device_name');
      if (saved) {
        setDeviceName(saved);
      } else {
        const defaultName = `Device-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setDeviceName(defaultName);
        localStorage.setItem('dropcode_device_name', defaultName);
      }
    }
  }, []);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('dropcode_device_name', deviceName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const faqs = [
    {
      q: 'Are files uploaded to a cloud server?',
      a: 'No. DropCode uses WebRTC DataChannels to transfer files directly between devices (peer-to-peer). The backend only coordinates the initial handshake and exchange of connection parameters (SDP and ICE candidates). Your file data never passes through or touches our servers.',
    },
    {
      q: 'How long do transfer codes remain valid?',
      a: 'Transfer codes are valid for 10 minutes from creation. If no receiver connects and is approved within 10 minutes, the session expires automatically for your security.',
    },
    {
      q: 'Does it work across different networks (e.g. Wi-Fi to cellular)?',
      a: 'Yes! DropCode leverages standard Google STUN servers to discover optimal network paths and NAT traversal. It transfers over local Wi-Fi at lightning speeds when on the same network, and over the internet when on separate networks.',
    },
    {
      q: 'Why does the sender need to approve the receiver?',
      a: 'Approval prevents unauthorized downloads if someone accidentally or maliciously guesses your 4-digit PIN. Even with the code, the file transfer will not start until you explicitly click "Approve".',
    },
  ];

  return (
    <div className="container relative mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      {/* Background ambient glows */}
      <div className="ambient-glow-1 -top-10 left-1/4" />

      {/* Header title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/15 border border-brand-violet/30 text-xs font-medium text-violet-300 mb-3">
          <SettingsIcon className="h-3.5 w-3.5 text-brand-cyan" />
          <span>Preferences &amp; System Info</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Settings &amp; About
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-md mx-auto">
          Configure your device identity and view network transfer specifications.
        </p>
      </div>

      <div className="space-y-8 max-w-2xl mx-auto">
        {/* Device Nickname Card */}
        <Card className="border border-white/10 bg-navy-800/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-brand-cyan" />
              <span>Device Nickname</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNickname} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-xs text-slate-400">
                  This nickname is visible to the peer when requesting or accepting file transfers.
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="nickname"
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. MacBook Pro, Omkar's Phone"
                    className="bg-navy-900 border-white/10"
                    maxLength={32}
                  />
                  <Button
                    type="submit"
                    className="shrink-0 bg-brand-violet hover:bg-brand-violet/90 text-white gap-1.5"
                  >
                    {isSaved ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Transfer Limits Card */}
        <Card className="border border-white/10 bg-navy-800/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-brand-violet" />
              <span>Session Transfer Specifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-navy-900/80 border border-white/5 text-center">
              <Layers className="h-5 w-5 text-brand-cyan mx-auto mb-2" />
              <div className="text-xl font-bold text-white">10 Files</div>
              <div className="text-xs text-slate-400 mt-1">Per session batch</div>
            </div>

            <div className="p-4 rounded-xl bg-navy-900/80 border border-white/5 text-center">
              <HardDrive className="h-5 w-5 text-brand-violet mx-auto mb-2" />
              <div className="text-xl font-bold text-white">2 GB</div>
              <div className="text-xs text-slate-400 mt-1">Max batch size</div>
            </div>

            <div className="p-4 rounded-xl bg-navy-900/80 border border-white/5 text-center">
              <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">10 Min</div>
              <div className="text-xs text-slate-400 mt-1">Code expiration TTL</div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security Card */}
        <Card className="border border-white/10 bg-navy-800/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>Privacy &amp; Security Architecture</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              DropCode operates on zero-knowledge file transfer principles. Signaling coordinates browser connections via Socket.IO, while all file chunks travel through direct DTLS-SRTP encrypted WebRTC DataChannels.
            </p>
            <div className="p-3 rounded-xl bg-navy-900/90 border border-emerald-500/20 text-emerald-300 flex items-start gap-2 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>
                Zero file caching, zero server databases for file data, and zero personal tracking cookies.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Accordion */}
        <Card className="border border-white/10 bg-navy-800/80">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-brand-cyan" />
              <span>Frequently Asked Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-navy-900/70 border border-white/5 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-medium text-white hover:text-brand-cyan transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-xs sm:text-sm text-slate-400 border-t border-white/5 pt-3 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
