'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Settings, ArrowUpRight, Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/send', label: 'Send', icon: Send },
    { href: '/receive', label: 'Receive', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-navy-900/75 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-violet to-brand-cyan shadow-md shadow-brand-violet/25 group-hover:scale-105 transition-transform duration-200">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
              Drop<span className="text-brand-cyan">Code</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 -mt-1 hidden sm:inline">
              P2P Instant Share
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-1.5 text-xs sm:text-sm font-medium',
                    isActive
                      ? 'bg-brand-cyan/15 text-cyan-300 border border-brand-cyan/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {link.label}
                </Button>
              </Link>
            );
          })}

          <div className="h-4 w-[1px] bg-white/10 mx-1 sm:mx-2" />

          {/* Settings Button */}
          <Link href="/settings">
            <Button
              variant={pathname === '/settings' ? 'secondary' : 'ghost'}
              size="icon"
              className={cn(
                'h-9 w-9 rounded-xl',
                pathname === '/settings'
                  ? 'bg-brand-violet/20 text-violet-300 border border-brand-violet/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              )}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
