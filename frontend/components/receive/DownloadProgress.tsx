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
  Copy,
  Check,
  FileText,
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

function ReceivedTextCard({ file }: { file: DownloadedFile }) {
  const [content, setContent] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(file.url)
      .then((res) => res.text())
      .then((txt) => {
        if (active) setContent(txt);
      })
      .catch((err) => {
        console.warn('Failed to read text snippet:', err);
      });
    return () => {
      active = false;
    };
  }, [file.url]);

  if (content === null) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUrl =
    content.trim().startsWith('http://') ||
    content.trim().startsWith('https://');

  return (
    <div className="p-4 rounded-2xl bg-navy-900 border border-brand-cyan/25 text-left space-y-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-brand-cyan shrink-0" />
          <span className="text-xs font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
            {file.name}
          </span>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            ({content.length} chars)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isUrl && (
            <a
              href={content.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-800 border border-white/10 text-xs text-brand-cyan hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Open Link</span>
            </a>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2.5 text-xs font-semibold bg-brand-cyan/15 hover:bg-brand-cyan/25 text-cyan-300 border border-brand-cyan/30 rounded-lg gap-1"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-navy-950 border border-white/5 max-h-40 overflow-y-auto">
        <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-all">
          {content}
        </pre>
      </div>
    </div>
  );
}

export function DownloadProgress({
  state,
  progress,
  downloadedFiles,
  totalExpectedFiles,
  error,
  onReset,
}: DownloadProgressProps) {
  const handleSaveFile = (file: DownloadedFile) => {
    try {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          if (a.parentNode) a.parentNode.removeChild(a);
        } catch (e) {}
      }, 1000);
    } catch (e) {
      window.open(file.url, '_blank');
    }
  };

  const handleSaveAll = () => {
    downloadedFiles.forEach((file, index) => {
      setTimeout(() => {
        handleSaveFile(file);
      }, index * 300);
    });
  };

  // COMPLETED State
  if (state === 'COMPLETED') {
    if (downloadedFiles.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-navy-800 border border-amber-500/30 text-center max-w-md mx-auto shadow-2xl shadow-amber-500/10 space-y-6"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <XCircle className="h-8 w-8 text-amber-400" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Transfer Ended Early
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              The session was closed before file data could be fully received.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="lg"
              onClick={onReset}
              className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-navy-900 font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </motion.div>
      );
    }

    const isTextFile = (file: DownloadedFile) =>
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.py') ||
      file.name.endsWith('.log') ||
      Boolean(file.mimeType?.startsWith('text/'));

    const textFiles = downloadedFiles.filter(isTextFile);

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
            {textFiles.length === downloadedFiles.length
              ? 'Text Received!'
              : 'Files & Text Received!'}
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            {downloadedFiles.length} item(s) successfully received directly from the sender.
          </p>
        </div>

        {/* Text Snippets preview cards (if any) */}
        {textFiles.length > 0 && (
          <div className="space-y-3">
            {textFiles.map((tf, i) => (
              <ReceivedTextCard key={tf.id || i} file={tf} />
            ))}
          </div>
        )}

        {/* List of files with manual download trigger in case browser blocked auto-download */}
        <div className="text-left space-y-2 p-3 rounded-2xl bg-navy-900 border border-white/5 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Downloaded Items
            </p>
            {downloadedFiles.length > 1 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="text-xs text-brand-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                <FolderDown className="h-3 w-3" />
                <span>Save All ({downloadedFiles.length})</span>
              </button>
            )}
          </div>

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

              <button
                type="button"
                onClick={() => handleSaveFile(file)}
                className="inline-flex items-center gap-1 text-xs text-brand-cyan hover:bg-brand-cyan/20 shrink-0 p-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
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
