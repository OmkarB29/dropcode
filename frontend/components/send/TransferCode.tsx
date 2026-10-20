'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, QrCode, Clock, X, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { getSiteUrl } from '@/lib/constants';
import { formatETA } from '@/lib/formatters';

interface TransferCodeProps {
  code: string;
  expiresAt: number | null;
  onCancel: () => void;
}

export function TransferCode({ code, expiresAt, onCancel }: TransferCodeProps) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [showQR, setShowQR] = useState(true);

  // Expiry countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const receiveUrl = `${getSiteUrl()}/receive?code=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(receiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center space-y-6 max-w-md mx-auto"
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 rounded-full bg-brand-violet/10 border border-brand-violet/30 px-3 py-1 text-xs text-violet-300">
        <Radio className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
        <span>Waiting for receiver to join</span>
        <span className="flex h-1.5 w-1.5 rounded-full bg-brand-cyan animate-ping" />
      </div>

      {/* Big monospace code */}
      <div className="w-full relative group">
        <div className="p-6 rounded-2xl bg-navy-900/90 border-2 border-brand-violet/40 shadow-2xl shadow-brand-violet/20 flex flex-col items-center justify-center">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
            One-Time 4-Digit PIN
          </span>
          <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-[0.25em] text-white selection:bg-brand-violet">
            {code}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 bg-navy-800 text-xs text-slate-200 hover:text-white border-white/10"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-brand-cyan" />
                  <span>Copy PIN</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 bg-navy-800 text-xs text-slate-200 hover:text-white border-white/10"
            >
              <span>Copy Direct Link</span>
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code toggle card */}
      <div className="p-4 rounded-2xl bg-navy-800/80 border border-white/5 flex flex-col items-center">
        <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/40">
          <QRCodeSVG
            value={receiveUrl}
            size={160}
            level="M"
            includeMargin={false}
            fgColor="#0a0e1a"
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Scan with your phone or tablet camera to open instantly
        </p>
      </div>

      {/* Countdown timer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5 text-amber-400" />
        <span>Code expires in:</span>
        <strong className="text-white font-mono">
          {formatETA(secondsLeft)}
        </strong>
      </div>

      {/* Cancel button */}
      <div className="pt-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          <span>Cancel Session</span>
        </Button>
      </div>
    </motion.div>
  );
}
