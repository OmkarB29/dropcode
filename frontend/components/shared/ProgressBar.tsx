'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  subLabel?: string;
  className?: string;
  barClassName?: string;
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  label,
  subLabel,
  className,
  barClassName,
  height = 'md',
  showPercentage = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-medium truncate max-w-[70%]">{label}</span>
          <div className="flex items-center gap-2">
            {subLabel && <span className="text-slate-400">{subLabel}</span>}
            {showPercentage && (
              <span className="font-mono text-cyan-300 font-semibold">
                {clampedProgress}%
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          'w-full bg-navy-950/80 rounded-full overflow-hidden border border-white/5 relative p-[1px]',
          heightClasses[height]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-brand-violet via-purple-500 to-brand-cyan shadow-sm shadow-brand-violet/50',
            barClassName
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
