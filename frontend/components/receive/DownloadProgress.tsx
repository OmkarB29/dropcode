'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  XCircle,
  RotateCcw,
  ExternalLink,
  Zap,
  FolderDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Speedometer } from '@/components/shared/Speedometer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  TransferProgress,
  TransferState,
  DownloadedFile,
} from '@/types/transfer';
import { formatFileSize } from '@/lib/formatters';

interface DownloadProgressProps {
  state: TransferState;
  progress: TransferProgress | null;
  downloadedFiles: DownloadedFile[];
  totalExpectedFiles: number;
  error: string | null;
  onReset: () => void;
}

export function DownloadProgress({
  state,
  progress,
  downloadedFiles,
  totalExpectedFiles,
  error,
  onReset,
}: DownloadProgressProps) {
  // COMPLETED State
  if (state === 'COMPLETED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 sm:p-8 rounded-3xl bg-navy-800 border border-emerald-500/30 text-center max-w-lg mx-auto shadow-2xl shadow-emerald-500/10 space-y-6"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>

        <div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Files Received!
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            {downloadedFiles.length} file(s) successfully received directly from the sender.
          </p>
        </div>

        {/* List of files with manual download trigger in case browser blocked auto-download */}
        <div className="text-left space-y-2 p-3 rounded-2xl bg-navy-900 border border-white/5 max-h-56 overflow-y-auto">
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            Downloaded Items (click to save again)
          </p>
          {downloadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-navy-800/80 border border-white/5 text-xs"
            >
              <div className="min-w-0 pr-2">
                <p className="font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <a
                href={file.url}
                download={file.name}
                className="inline-flex items-center gap-1 text-xs text-brand-cyan hover:underline shrink-0 p-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </a>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Button
            size="lg"
            onClick={onReset}
            className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-navy-900 font-bold"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Receive More Files</span>
          </Button>
        </div>
      </motion.div>
    );
  }

  // FAILED / CANCELLED / EXPIRED States
  if (state === 'FAILED' || state === 'EXPIRED' || state === 'CANCELLED' || state === 'REJECTED') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-3xl bg-navy-800 border border-red-500/30 text-center max-w-md mx-auto shadow-2xl shadow-red-500/10"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 mb-6">
          <XCircle className="h-8 w-8" />
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight">
          {state === 'EXPIRED'
            ? 'Transfer Expired'
            : state === 'CANCELLED'
            ? 'Transfer Cancelled'
            : state === 'REJECTED'
            ? 'Transfer Declined'
            : 'Transfer Failed'}
        </h3>
        <p className="mt-2 text-sm text-slate-300">
          {error || 'Unable to complete the file transfer.'}
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={onReset}
            className="w-full gap-2 bg-navy-700 hover:bg-navy-600 text-white font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Another Code</span>
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
        <StatusBadge state={state} />
        <span className="text-xs text-slate-400 font-mono">
          {downloadedFiles.length} of {totalExpectedFiles} completed
        </span>
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
            Connecting to sender...
          </h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Awaiting sender approval and establishing an encrypted peer-to-peer data stream.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active File Progress */}
          <div className="space-y-2">
            <ProgressBar
              progress={progress?.currentFileProgress || 0}
              label={progress?.currentFileName || 'Receiving file chunk...'}
              subLabel={`File ${(progress?.currentFileIndex || 0) + 1} of ${totalExpectedFiles}`}
              height="md"
            />
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <ProgressBar
              progress={progress?.overallProgress || 0}
              label="Overall Download Progress"
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

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <FolderDown className="h-4 w-4 text-brand-cyan" />
            <span>Files download automatically as each finishes receiving.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
