'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  QrCode,
  Clock,
  X,
  Radio,
  Users,
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Smartphone,
  Zap,
  CheckCircle2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { QRCodeSVG } from 'qrcode.react';
import { getSiteUrl } from '@/lib/constants';
import { formatETA, formatFileSize, formatSpeed } from '@/lib/formatters';
import { ReceiverPeer } from '@/types/transfer';

interface TransferCodeProps {
  code: string;
  expiresAt: number | null;
  fileCount: number;
  receivers?: Record<string, ReceiverPeer>;
  autoApprove?: boolean;
  onSetAutoApprove?: (enabled: boolean) => void;
  onApprovePeer?: (receiverId: string) => void;
  onRejectPeer?: (receiverId: string) => void;
  onCancel: () => void;
}

export function TransferCode({
  code,
  expiresAt,
  fileCount,
  receivers = {},
  autoApprove = true,
  onSetAutoApprove,
  onApprovePeer,
  onRejectPeer,
  onCancel,
}: TransferCodeProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [showQR, setShowQR] = useState(false);

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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const receiverList = Object.values(receivers);
  const connectedCount = receiverList.filter(
    (r) => r.status !== 'disconnected' && r.status !== 'rejected' && r.status !== 'failed'
  ).length;
  const completedCount = receiverList.filter((r) => r.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center space-y-6 max-w-xl mx-auto"
    >
      {/* Live Broadcast Header Badge */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold tracking-wide">Multi-Peer Broadcast Active</span>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-navy-800/80 border border-white/10 px-3 py-1 text-xs text-slate-300">
          <Users className="h-3.5 w-3.5 text-brand-cyan" />
          <span>
            {connectedCount === 0
              ? 'Ready for peers'
              : `${connectedCount} peer${connectedCount > 1 ? 's' : ''} connected`}
          </span>
        </div>
      </div>

      {/* Main Transfer PIN Box */}
      <div className="w-full relative group">
        <div className="p-6 sm:p-8 rounded-3xl bg-navy-900/95 border-2 border-brand-violet/50 shadow-2xl shadow-brand-violet/20 flex flex-col items-center justify-center text-center backdrop-blur-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
            Universal Transfer PIN
          </span>

          <div className="text-5xl sm:text-6xl font-black font-mono tracking-[0.25em] text-white selection:bg-brand-violet py-2 drop-shadow-md">
            {code}
          </div>

          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
            Anyone can enter this code to download your {fileCount} item{fileCount > 1 ? 's' : ''} at the same time.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 bg-navy-800 text-xs font-semibold text-slate-200 hover:text-white border-white/10 h-10 px-4 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>PIN Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-brand-cyan" />
                  <span>Copy PIN</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 bg-navy-800 text-xs font-semibold text-slate-200 hover:text-white border-white/10 h-10 px-4 rounded-xl"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-brand-violet" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQR((prev) => !prev)}
              className="gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-navy-800 h-10 px-3 rounded-xl"
            >
              <QrCode className="h-4 w-4 text-brand-cyan" />
              <span>{showQR ? 'Hide QR' : 'Show QR'}</span>
              {showQR ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>

          {/* Collapsible QR Code Card */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden w-full pt-5"
              >
                <div className="p-4 rounded-2xl bg-navy-800/80 border border-white/10 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl shadow-lg shadow-black/40">
                    <QRCodeSVG
                      value={receiveUrl}
                      size={150}
                      level="M"
                      includeMargin={false}
                      fgColor="#0a0e1a"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Scan with any phone camera to access files directly
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Auto-Approve Toggle Card */}
      {onSetAutoApprove && (
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-navy-800/60 border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${autoApprove ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-semibold text-white">
                Auto-approve incoming peers
              </div>
              <div className="text-[11px] text-slate-400">
                {autoApprove
                  ? 'Peers download immediately when entering PIN'
                  : 'Manual approval required for each person'}
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoApprove}
            onClick={() => onSetAutoApprove(!autoApprove)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoApprove ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                autoApprove ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {/* Connected Peers List Section */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Connected Peers ({receiverList.length})
            </h4>
          </div>
          {completedCount > 0 && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{completedCount} downloaded</span>
            </span>
          )}
        </div>

        {receiverList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-navy-900/60 border border-white/5 text-center space-y-2">
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-brand-violet/15 flex items-center justify-center text-brand-violet animate-pulse">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-200">
              Waiting for people to enter PIN...
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Share the code <strong className="text-white font-mono">{code}</strong>. Multiple people can download the files or text at the same time!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {receiverList.map((peer) => {
              const isPhone = /iphone|android|mobile/i.test(peer.deviceName);
              const isCompleted = peer.status === 'completed';
              const isTransferring = peer.status === 'transferring';
              const isWaiting = peer.status === 'waiting';
              const isConnecting = peer.status === 'connecting';
              const isRejected = peer.status === 'rejected';

              return (
                <div
                  key={peer.id}
                  className="p-4 rounded-2xl bg-navy-900/80 border border-white/10 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-navy-800 border border-white/5 text-slate-300 shrink-0">
                        {isPhone ? (
                          <Smartphone className="h-4 w-4 text-brand-cyan" />
                        ) : (
                          <Laptop className="h-4 w-4 text-brand-violet" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {peer.deviceName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isCompleted && (
                            <span className="text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Downloaded successfully
                            </span>
                          )}
                          {isTransferring && (
                            <span className="text-cyan-300 flex items-center gap-1 font-medium">
                              <Zap className="h-3 w-3 animate-pulse" />
                              Downloading... {peer.progress ? `${peer.progress.overallProgress}%` : ''}
                              {peer.progress?.speedBps ? ` (${formatSpeed(peer.progress.speedBps)})` : ''}
                            </span>
                          )}
                          {isConnecting && (
                            <span className="text-violet-300">
                              Establishing peer connection...
                            </span>
                          )}
                          {isWaiting && (
                            <span className="text-amber-400 font-medium">
                              Awaiting your approval
                            </span>
                          )}
                          {isRejected && (
                            <span className="text-red-400">Declined</span>
                          )}
                          {peer.status === 'disconnected' && (
                            <span className="text-slate-500">Disconnected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Waiting actions if manual approval */}
                    {isWaiting && onApprovePeer && onRejectPeer && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onRejectPeer(peer.id)}
                          className="h-8 px-2.5 text-xs rounded-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline ml-1">Decline</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onApprovePeer(peer.id)}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Transfer progress bar for this peer */}
                  {isTransferring && peer.progress && (
                    <div className="pt-1">
                      <ProgressBar
                        progress={peer.progress.overallProgress}
                        height="sm"
                        showPercentage={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Countdown timer & Stop sharing control */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Session expires in:</span>
          <strong className="text-white font-mono">{formatETA(secondsLeft)}</strong>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="gap-2 text-xs border-red-500/30 text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl"
        >
          <X className="h-3.5 w-3.5" />
          <span>Finish &amp; End Sharing</span>
        </Button>
      </div>
    </motion.div>
  );
}
