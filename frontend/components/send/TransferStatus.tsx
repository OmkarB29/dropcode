'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  X,
  FileCheck2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Speedometer } from '@/components/shared/Speedometer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TransferProgress, TransferState } from '@/types/transfer';

interface TransferStatusProps {
  state: TransferState;
  progress: TransferProgress | null;
  error: string | null;
  totalFiles: number;
  onCancel: () => void;
  onReset: () => void;
}

export function TransferStatus({
  state,
  progress,
  error,
  totalFiles,
  onCancel,
  onReset,
}: TransferStatusProps) {
  // COMPLETED State
  if (state === 'COMPLETED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 sm:p-10 rounded-3xl bg-navy-800 border border-emerald-500/30 text-center max-w-md mx-auto shadow-2xl shadow-emerald-500/10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-6 shadow-xl shadow-emerald-500/20"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </motion.div>

        <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Transfer Complete!
        </h3>
        <p className="mt-2 text-sm text-slate-300">
          All {totalFiles} file(s) have been successfully streamed directly to the receiver.
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={onReset}
            className="w-full gap-2 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Send More Files</span>
          </Button>
        </div>
      </motion.div>
    );
  }

  // FAILED / EXPIRED / CANCELLED States
  if (state === 'FAILED' || state === 'EXPIRED' || state === 'CANCELLED' || state === 'REJECTED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 sm:p-10 rounded-3xl bg-navy-800 border border-red-500/30 text-center max-w-md mx-auto shadow-2xl shadow-red-500/10"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6">
          <XCircle className="h-8 w-8" />
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight">
          {state === 'EXPIRED'
            ? 'Session Expired'
            : state === 'CANCELLED'
            ? 'Transfer Cancelled'
            : state === 'REJECTED'
            ? 'Transfer Declined'
            : 'Transfer Failed'}
        </h3>
        <p className="mt-2 text-sm text-slate-300">
          {error || 'The connection was interrupted or closed by the peer.'}
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={onReset}
            className="w-full gap-2 bg-navy-700 hover:bg-navy-600 text-white font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </motion.div>
    );
  }

  // CONNECTING / TRANSFERRING State
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-white/10 shadow-2xl space-y-6 max-w-lg mx-auto"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <StatusBadge state={state} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-red-400 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          <span>Cancel</span>
        </Button>
      </div>

      {state === 'CONNECTING' ? (
        <div className="py-8 flex flex-col items-center text-center space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan/20 opacity-75"></span>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/20 border border-brand-cyan/40">
              <Zap className="h-6 w-6 text-brand-cyan animate-pulse" />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-white">
            Establishing P2P WebRTC Connection...
          </h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Exchanging ICE candidates and opening an encrypted direct channel between devices.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active File Progress */}
          <div className="space-y-2">
            <ProgressBar
              progress={progress?.currentFileProgress || 0}
              label={progress?.currentFileName || 'Preparing file transfer...'}
              subLabel={`File ${(progress?.currentFileIndex || 0) + 1} of ${totalFiles}`}
              height="md"
            />
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <ProgressBar
              progress={progress?.overallProgress || 0}
              label="Overall Transfer Progress"
              height="lg"
            />
          </div>

          {/* Speed & ETA metrics */}
          <Speedometer
            speedBps={progress?.speedBps || 0}
            estimatedSecondsRemaining={progress?.estimatedSecondsRemaining || 0}
            bytesTransferred={progress?.bytesTransferred || 0}
            totalBytes={progress?.totalBytes || 0}
          />
        </div>
      )}
    </motion.div>
  );
}
