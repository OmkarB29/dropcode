'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FolderPlus, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFilesSelected, disabled }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'group relative flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden',
        isDragOver
          ? 'border-brand-violet bg-brand-violet/10 shadow-2xl shadow-brand-violet/20 scale-[1.01]'
          : 'border-white/10 bg-navy-800/40 hover:border-brand-violet/40 hover:bg-navy-800/60',
        disabled && 'opacity-50 pointer-events-none cursor-not-allowed'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Hover background highlight */}
      <div className="absolute inset-0 bg-radial-glow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Icon */}
      <div
        className={cn(
          'flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl transition-all duration-300 mb-4',
          isDragOver
            ? 'bg-brand-violet text-white scale-110 shadow-lg shadow-brand-violet/30'
            : 'bg-navy-900/80 text-brand-cyan border border-white/10 group-hover:border-brand-violet/30 group-hover:text-violet-300 group-hover:scale-105'
        )}
      >
        <UploadCloud className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
        Drop files here or click to browse
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm">
        Drag photos, videos, archives, or documents. Share up to 10 files (2 GB total) directly peer-to-peer.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          className="bg-brand-violet hover:bg-brand-violet/90 text-white gap-2 pointer-events-none"
        >
          <FolderPlus className="h-4 w-4" />
          <span>Browse Files</span>
        </Button>
      </div>
    </div>
  );
}
