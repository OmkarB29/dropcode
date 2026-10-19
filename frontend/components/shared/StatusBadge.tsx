import React from 'react';
import { TransferState } from '@/types/transfer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Radio,
  FileCheck,
} from 'lucide-react';

interface StatusBadgeProps {
  state: TransferState;
  className?: string;
}

export function StatusBadge({ state, className }: StatusBadgeProps) {
  switch (state) {
    case 'IDLE':
      return (
        <Badge variant="outline" className={cn('gap-1.5 py-1 px-3', className)}>
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Ready
        </Badge>
      );
    case 'SELECTING_FILES':
      return (
        <Badge variant="secondary" className={cn('gap-1.5 py-1 px-3', className)}>
          <FileCheck className="h-3.5 w-3.5" />
          Files Selected
        </Badge>
      );
    case 'SESSION_CREATED':
    case 'WAITING_FOR_RECEIVER':
      return (
        <Badge variant="default" className={cn('gap-1.5 py-1 px-3 animate-pulse', className)}>
          <Radio className="h-3.5 w-3.5 text-violet-300 animate-spin" />
          Waiting for Peer
        </Badge>
      );
    case 'RECEIVER_REQUESTED':
      return (
        <Badge variant="warning" className={cn('gap-1.5 py-1 px-3', className)}>
          <Clock className="h-3.5 w-3.5" />
          Approval Required
        </Badge>
      );
    case 'RECEIVER_APPROVED':
    case 'CONNECTING':
      return (
        <Badge variant="secondary" className={cn('gap-1.5 py-1 px-3', className)}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Connecting P2P...
        </Badge>
      );
    case 'TRANSFERRING':
      return (
        <Badge
          className={cn(
            'gap-1.5 py-1 px-3 bg-gradient-to-r from-brand-violet to-brand-cyan text-white border-0 shadow-sm shadow-brand-cyan/20 animate-pulse',
            className
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Transferring
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="success" className={cn('gap-1.5 py-1 px-3', className)}>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Transfer Complete
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className={cn('gap-1.5 py-1 px-3', className)}>
          <XCircle className="h-3.5 w-3.5" />
          Declined
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="warning" className={cn('gap-1.5 py-1 px-3', className)}>
          <AlertCircle className="h-3.5 w-3.5" />
          Cancelled
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="destructive" className={cn('gap-1.5 py-1 px-3', className)}>
          <Clock className="h-3.5 w-3.5" />
          Session Expired
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className={cn('gap-1.5 py-1 px-3', className)}>
          <AlertCircle className="h-3.5 w-3.5" />
          Failed
        </Badge>
      );
    default:
      return null;
  }
}
