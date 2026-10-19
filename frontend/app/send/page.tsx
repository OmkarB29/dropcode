'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, AlertCircle, FilePlus2 } from 'lucide-react';
import { useSenderFlow } from '@/hooks/useSenderFlow';
import { FileDropZone } from '@/components/send/FileDropZone';
import { FileList } from '@/components/send/FileList';
import { TransferCode } from '@/components/send/TransferCode';
import { ReceiverApproval } from '@/components/send/ReceiverApproval';
import { TransferStatus } from '@/components/send/TransferStatus';
import { Button } from '@/components/ui/button';

export default function SendPage() {
  const {
    state,
    files,
    transferCode,
    expiresAt,
    receiverDeviceName,
    progress,
    error,
    addFiles,
    removeFile,
    clearFiles,
    createSession,
    approveReceiver,
    rejectReceiver,
    cancelTransfer,
    reset,
  } = useSenderFlow();

  const isSelectingOrIdle = state === 'IDLE' || state === 'SELECTING_FILES';
  const isWaitingForReceiver = state === 'SESSION_CREATED' || state === 'WAITING_FOR_RECEIVER';
  const isReceiverRequested = state === 'RECEIVER_REQUESTED';
  const isTransferringOrConnecting =
    state === 'RECEIVER_APPROVED' ||
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
      <div className="ambient-glow-1 -top-20 -left-20" />
      <div className="ambient-glow-2 top-40 -right-20" />

      {/* Header title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-violet/15 border border-brand-violet/30 text-xs font-medium text-violet-300 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
          <span>Encrypted Peer-to-Peer Transfer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Send Files Directly
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-md mx-auto">
          Add files to generate a secure transfer code. Files stay on your device until the receiver connects.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: IDLE / SELECTING FILES */}
        {isSelectingOrIdle && (
          <motion.div
            key="step-select-files"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <FileDropZone onFilesSelected={addFiles} />

            {files.length > 0 && (
              <div className="space-y-4">
                <FileList
                  files={files}
                  onRemove={removeFile}
                  onClear={clearFiles}
                />

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    size="lg"
                    onClick={createSession}
                    className="w-full gap-2 bg-brand-violet hover:bg-brand-violet/90 text-white font-semibold text-base shadow-xl shadow-brand-violet/30 h-14 rounded-2xl"
                  >
                    <span>Generate Transfer Code</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: WAITING FOR RECEIVER (CODE DISPLAY) */}
        {isWaitingForReceiver && transferCode && (
          <motion.div
            key="step-waiting-code"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <TransferCode
              code={transferCode}
              expiresAt={expiresAt}
              onCancel={cancelTransfer}
            />
          </motion.div>
        )}

        {/* Step 3: RECEIVER REQUESTED (APPROVAL DIALOG) */}
        {isReceiverRequested && (
          <motion.div
            key="step-receiver-requested"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <ReceiverApproval
              deviceName={receiverDeviceName || 'Remote Peer'}
              fileCount={files.length}
              onApprove={approveReceiver}
              onReject={rejectReceiver}
            />
          </motion.div>
        )}

        {/* Step 4 & 5: CONNECTING / TRANSFERRING / COMPLETED / FAILED */}
        {isTransferringOrConnecting && (
          <motion.div
            key="step-transferring-status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <TransferStatus
              state={state}
              progress={progress}
              error={error}
              totalFiles={files.length}
              onCancel={cancelTransfer}
              onReset={reset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
