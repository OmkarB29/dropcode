'use client';

import React, { useState } from 'react';
import {
  FileText,
  ClipboardPaste,
  Code2,
  Link2,
  Trash2,
  Plus,
  ArrowRight,
  Check,
  AlignLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextShareZoneProps {
  onAddTextFile: (text: string, title?: string) => void;
  onSendImmediately: (text: string, title?: string) => void;
  disabled?: boolean;
}

export function TextShareZone({
  onAddTextFile,
  onSendImmediately,
  disabled,
}: TextShareZoneProps) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isCodeFont, setIsCodeFont] = useState(false);
  const [pastedFeedback, setPastedFeedback] = useState(false);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split('\n').length : 0;

  const handlePaste = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText((prev) => (prev ? `${prev}\n${clipText}` : clipText));
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 1500);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied or unsupported:', err);
    }
  };

  const handleClear = () => {
    setText('');
    setTitle('');
  };

  const handleTemplate = (type: 'message' | 'link' | 'code') => {
    if (type === 'link') {
      setTitle((prev) => prev || 'shared-link');
      setText((prev) => (prev ? prev : 'https://'));
    } else if (type === 'code') {
      setTitle((prev) => prev || 'snippet.js');
      setIsCodeFont(true);
    } else {
      setTitle((prev) => prev || 'note');
      setIsCodeFont(false);
    }
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddTextFile(text, title);
    setText('');
    setTitle('');
  };

  const handleSendNow = () => {
    if (!text.trim()) return;
    onSendImmediately(text, title);
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-navy-800/50 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
      {/* Header controls & template buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Templates:</span>
          <button
            type="button"
            onClick={() => handleTemplate('message')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900/80 border border-white/5 text-xs text-slate-300 hover:text-white hover:border-brand-violet/40 transition-colors"
          >
            <AlignLeft className="h-3 w-3 text-brand-violet" />
            <span>Note</span>
          </button>
          <button
            type="button"
            onClick={() => handleTemplate('link')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900/80 border border-white/5 text-xs text-slate-300 hover:text-white hover:border-brand-cyan/40 transition-colors"
          >
            <Link2 className="h-3 w-3 text-brand-cyan" />
            <span>Link / URL</span>
          </button>
          <button
            type="button"
            onClick={() => handleTemplate('code')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900/80 border border-white/5 text-xs text-slate-300 hover:text-white hover:border-purple-400 transition-colors"
          >
            <Code2 className="h-3 w-3 text-purple-400" />
            <span>Code</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePaste}
            className="h-8 gap-1.5 bg-navy-900/60 border-white/10 text-xs text-slate-300 hover:text-white hover:bg-navy-900"
          >
            {pastedFeedback ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Pasted!</span>
              </>
            ) : (
              <>
                <ClipboardPaste className="h-3.5 w-3.5 text-brand-cyan" />
                <span>Paste</span>
              </>
            )}
          </Button>

          {text && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Clear text"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title / Name input (optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <Label htmlFor="text-title" className="text-xs text-slate-300 font-medium">
            Snippet / Note Title <span className="text-slate-500 font-normal">(optional)</span>
          </Label>
          <button
            type="button"
            onClick={() => setIsCodeFont(!isCodeFont)}
            className="text-[11px] text-brand-cyan hover:underline font-mono"
          >
            {isCodeFont ? 'Use Normal Font' : 'Use Monospace'}
          </button>
        </div>
        <Input
          id="text-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Wi-Fi Password, Meeting Notes, snippet.js"
          disabled={disabled}
          className="h-10 bg-navy-900/80 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-sm"
        />
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text, links, code, tokens, or messages here..."
          rows={6}
          disabled={disabled}
          className={`w-full rounded-2xl bg-navy-900/90 border border-white/10 p-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-violet/50 focus:ring-1 focus:ring-brand-violet/50 transition-all resize-y min-h-[140px] ${
            isCodeFont ? 'font-mono text-xs leading-relaxed' : 'font-sans'
          }`}
        />
      </div>

      {/* Counter bar & buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400 font-mono">
          <span>{charCount} chars</span>
          <span className="mx-1.5 text-slate-600">•</span>
          <span>{wordCount} words</span>
          {lineCount > 1 && (
            <>
              <span className="mx-1.5 text-slate-600">•</span>
              <span>{lineCount} lines</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!text.trim() || disabled}
            className="flex-1 sm:flex-none gap-1.5 h-10 px-4 rounded-xl bg-navy-900 border-white/10 text-slate-200 hover:text-white hover:bg-navy-800 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Add to Files</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendNow}
            disabled={!text.trim() || disabled}
            className="flex-1 sm:flex-none gap-2 h-10 px-5 rounded-xl bg-brand-violet hover:bg-brand-violet/90 text-white font-bold text-xs shadow-lg shadow-brand-violet/25"
          >
            <span>Share Text Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
