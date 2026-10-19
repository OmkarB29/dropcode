'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  X,
  File,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Laptop,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileManifestEntry } from '@/types/transfer';
import { formatFileSize, getFileCategory } from '@/lib/formatters';

interface FilePreviewProps {
  senderDeviceName: string;
  files: FileManifestEntry[];
  onAccept: () => void;
  onDecline: () => void;
}

export function FilePreview({
  senderDeviceName,
  files,
  onAccept,
  onDecline,
}: FilePreviewProps) {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const renderFileIcon = (mimeType: string, fileName: string) => {
    const category = getFileCategory(mimeType, fileName);
    switch (category) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-emerald-400" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-400" />;
      case 'audio':
        return <Music className="h-4 w-4 text-pink-400" />;
      case 'archive':
        return <FileArchive className="h-4 w-4 text-amber-400" />;
      case 'code':
        return <FileCode className="h-4 w-4 text-brand-cyan" />;
      case 'document':
        return <FileText className="h-4 w-4 text-blue-400" />;
      default:
        return <File className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 sm:p-8 rounded-3xl bg-navy-800/90 border border-white/10 shadow-2xl max-w-lg mx-auto space-y-6"
    >
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 mb-3">
          <Download className="h-6 w-6" />
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Ready to Receive Files
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Incoming transfer from{' '}
          <strong className="text-white font-medium">
            {senderDeviceName || 'Remote Peer'}
          </strong>
        </p>
      </div>

      {/* Manifest summary card */}
      <div className="p-4 rounded-2xl bg-navy-900 border border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
          <span>{files.length} file(s) available</span>
          <span>
            Total size:{' '}
            <strong className="text-white font-semibold">
              {formatFileSize(totalBytes)}
            </strong>
          </span>
        </div>

        {/* Files list */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-navy-800/60 border border-white/5 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="h-7 w-7 rounded-lg bg-navy-950 flex items-center justify-center shrink-0">
                  {renderFileIcon(file.mimeType, file.name)}
                </div>
                <span className="font-medium text-white truncate max-w-[220px] sm:max-w-xs">
                  {file.name}
                </span>
              </div>
              <span className="text-slate-400 font-mono shrink-0">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="destructive"
          size="lg"
          onClick={onDecline}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          <span>Decline</span>
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onAccept}
          className="gap-2 bg-gradient-to-r from-brand-violet to-brand-cyan hover:brightness-110 text-white font-bold shadow-lg shadow-brand-violet/20"
        >
          <Check className="h-4 w-4" />
          <span>Accept Transfer</span>
        </Button>
      </div>
    </motion.div>
  );
}
