'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  File,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileCategory } from '@/lib/formatters';

interface FileListProps {
  files: File[];
  onRemove: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function FileList({ files, onRemove, onClear, disabled }: FileListProps) {
  if (files.length === 0) return null;

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
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Selected files ({files.length}):{' '}
          <strong className="text-white font-medium">
            {formatFileSize(totalBytes)}
          </strong>
        </span>
        {!disabled && (
          <button
            onClick={onClear}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${file.size}-${index}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between p-3 rounded-xl bg-navy-800/80 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="h-8 w-8 rounded-lg bg-navy-900 flex items-center justify-center shrink-0 border border-white/5">
                  {renderFileIcon(file.type, file.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
