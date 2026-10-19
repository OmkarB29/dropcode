'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clipboard, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCode } from '@/lib/formatters';

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

export function CodeInput({
  code,
  onCodeChange,
  onSubmit,
  loading,
  error,
}: CodeInputProps) {
  const [pasteFeedback, setPasteFeedback] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCodeChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onCodeChange(text.trim());
        setPasteFeedback(true);
        setTimeout(() => setPasteFeedback(false), 1500);
      }
    } catch (e) {
      console.warn('Failed to read from clipboard:', e);
    }
  };

  const isValidCode = code.replace(/[^A-Za-z0-9]/g, '').length === 8;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 sm:p-10 rounded-3xl bg-navy-800/90 border border-white/10 shadow-2xl max-w-md mx-auto text-center"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 mb-6">
        <KeyRound className="h-8 w-8" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Enter Transfer Code
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-400">
        Enter the 8-character code displayed on the sender&apos;s device to initiate download.
      </p>

      {/* Code Input Box */}
      <div className="mt-8 space-y-4">
        <div className="relative">
          <Input
            type="text"
            value={code}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="ABCD-7392"
            maxLength={9} // 8 chars + 1 hyphen
            disabled={loading}
            className="h-16 text-center text-2xl sm:text-3xl font-mono tracking-widest uppercase bg-navy-900 border-2 border-white/10 focus-visible:border-brand-cyan focus-visible:ring-brand-cyan rounded-2xl selection:bg-brand-cyan selection:text-navy-900 placeholder:text-slate-600"
            autoFocus
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-2 text-xs text-slate-400 hover:text-white"
            title="Paste from clipboard"
          >
            <Clipboard className="h-4 w-4 mr-1" />
            <span>{pasteFeedback ? 'Pasted!' : 'Paste'}</span>
          </Button>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!isValidCode || loading}
          className="w-full gap-2 bg-brand-cyan hover:bg-brand-cyan/90 text-navy-900 font-bold text-base shadow-xl shadow-brand-cyan/20 disabled:opacity-40"
        >
          {loading ? (
            <span>Connecting to session...</span>
          ) : (
            <>
              <span>Join Transfer</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-slate-400">
        Codes are case-insensitive and formatted automatically (e.g. ABCD-7392).
      </div>
    </motion.div>
  );
}
