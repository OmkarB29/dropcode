'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Check, X, Smartphone, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiverApprovalProps {
  deviceName: string;
  fileCount: number;
  onApprove: () => void;
  onReject: () => void;
}

export function ReceiverApproval({
  deviceName,
  fileCount,
  onApprove,
  onReject,
}: ReceiverApprovalProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="p-6 sm:p-8 rounded-3xl bg-navy-800 border-2 border-brand-violet/50 shadow-2xl shadow-brand-violet/25 text-center max-w-md mx-auto"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-violet/20 text-brand-violet border border-brand-violet/30 mb-5 animate-bounce">
        <ShieldAlert className="h-8 w-8 text-brand-cyan" />
      </div>

      <h3 className="text-2xl font-bold text-white tracking-tight">
        Someone wants your files!
      </h3>

      <p className="mt-2 text-sm text-slate-300">
        A peer device connected with your transfer code and is requesting to download{' '}
        <span className="text-white font-medium">{fileCount} file(s)</span>.
      </p>

      {/* Device Info Badge */}
      <div className="my-6 p-4 rounded-xl bg-navy-900 border border-white/5 flex items-center justify-center gap-3">
        <Laptop className="h-5 w-5 text-brand-violet" />
        <span className="text-sm font-semibold text-white tracking-tight">
          {deviceName || 'Remote Peer Device'}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-6">
        Do you recognize this device? Only approve if you initiated this transfer.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="destructive"
          size="lg"
          onClick={onReject}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          <span>Decline</span>
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onApprove}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
        >
          <Check className="h-4 w-4" />
          <span>Approve</span>
        </Button>
      </div>
    </motion.div>
  );
}
