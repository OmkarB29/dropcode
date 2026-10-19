import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-navy-950/60 backdrop-blur-md mt-auto py-8">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand info */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Zap className="h-4 w-4 text-brand-violet" />
              DropCode
            </span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              End-to-End P2P WebRTC
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link
              href="/settings"
              className="hover:text-brand-cyan transition-colors"
            >
              Privacy &amp; Security
            </Link>
            <Link
              href="/settings"
              className="hover:text-brand-cyan transition-colors"
            >
              Transfer Limits
            </Link>
            <Link
              href="/settings"
              className="hover:text-brand-cyan transition-colors"
            >
              FAQ
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/[0.04] text-center text-[11px] text-slate-400">
          Files are transferred directly between devices over encrypted WebRTC data channels. No files are stored on any cloud server.
        </div>
      </div>
    </footer>
  );
}
