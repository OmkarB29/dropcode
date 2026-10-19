'use client';

import React from 'react';
import { formatFileSize, formatSpeed, formatETA } from '@/lib/formatters';
import { Zap, Clock, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeedometerProps {
  speedBps: number;
  estimatedSecondsRemaining: number;
  bytesTransferred: number;
  totalBytes: number;
  className?: string;
}

export function Speedometer({
  speedBps,
  estimatedSecondsRemaining,
  bytesTransferred,
  totalBytes,
  className,
}: SpeedometerProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-3 gap-3 p-4 rounded-xl bg-navy-900/60 border border-white/5 backdrop-blur-sm',
        className
      )}
    >
      {/* Transfer Speed */}
      <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-navy-800/40">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>Speed</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          {formatSpeed(speedBps)}
        </span>
      </div>

      {/* ETA Remaining */}
      <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-navy-800/40">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Clock className="h-3.5 w-3.5 text-brand-cyan" />
          <span>ETA</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          {formatETA(estimatedSecondsRemaining)}
        </span>
      </div>

      {/* Transferred Amount */}
      <div className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-navy-800/40">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <HardDrive className="h-3.5 w-3.5 text-brand-violet" />
          <span>Transferred</span>
        </div>
        <span className="text-sm font-semibold text-white tracking-tight truncate max-w-full">
          {formatFileSize(bytesTransferred)}{' '}
          <span className="text-slate-400 text-xs font-normal">
            / {formatFileSize(totalBytes)}
          </span>
        </span>
      </div>
    </div>
  );
}
