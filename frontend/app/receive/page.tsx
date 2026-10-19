'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useReceiverFlow } from '@/hooks/useReceiverFlow';
import { CodeInput } from '@/components/receive/CodeInput';
import { FilePreview } from '@/components/receive/FilePreview';
import { DownloadProgress } from '@/components/receive/DownloadProgress';

function ReceiveContent() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get('code') || '';

  const {
    state,
    code,
    senderDeviceName,
    files,
    progress,
    downloadedFiles,
    error,
    setCode,
    joinSession,
    acceptTransfer,
    rejectTransfer,
    reset,
  } = useReceiverFlow(urlCode);

  // Auto-fill and auto-join if URL contains valid code
  useEffect(() => {
    if (urlCode && state === 'IDLE') {
      setCode(urlCode);
    }
  }, [urlCode, setCode, state]);

  const isEnteringCode = state === 'IDLE';
  const isPreviewingManifest = state === 'SESSION_CREATED';
  const isConnectingOrDownloading =
    state === 'CONNECTING' ||
    state === 'TRANSFERRING' ||
    state === 'COMPLETED' ||
    state === 'FAILED' ||
    state === 'EXPIRED' ||
    state === 'CANCELLED' ||
    state === 'REJECTED';

  return (
    <div className="container relative mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-16">
      {/* Ambient background glows */}
      <div className="ambient-glow-2 -top-20 -right-20" />
      <div className="ambient-glow-1 top-40 -left-20" />

      {/* Header title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cyan/15 border border-brand-cyan/30 text-xs font-medium text-cyan-300 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-brand-violet" />
          <span>Direct P2P Download</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Receive Files Instantly
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-md mx-auto">
          Connect directly to the sender with an 8-character code and download files without cloud storage.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: CODE INPUT */}
        {isEnteringCode && (
          <motion.div
            key="step-enter-code"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <CodeInput
              code={code}
              onCodeChange={setCode}
              onSubmit={joinSession}
              error={error}
            />
          </motion.div>
        )}

        {/* Step 2: FILE PREVIEW & ACCEPTANCE */}
        {isPreviewingManifest && (
          <motion.div
            key="step-preview-manifest"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <FilePreview
              senderDeviceName={senderDeviceName || 'Remote Peer'}
              files={files}
              onAccept={acceptTransfer}
              onDecline={rejectTransfer}
            />
          </motion.div>
        )}

        {/* Step 3 & 4: CONNECTING / DOWNLOADING / COMPLETED / FAILED */}
        {isConnectingOrDownloading && (
          <motion.div
            key="step-download-progress"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <DownloadProgress
              state={state}
              progress={progress}
              downloadedFiles={downloadedFiles}
              totalExpectedFiles={files.length || 1}
              error={error}
              onReset={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReceivePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
          Loading transfer...
        </div>
      }
    >
      <ReceiveContent />
    </Suspense>
  );
}
