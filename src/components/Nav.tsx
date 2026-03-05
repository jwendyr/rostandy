'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { T } from '@/lib/i18n';

export default function Nav({ t }: { t: T }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold gradient-text shrink-0">WR</Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4 md:gap-6">
          <a href="#about" className="text-text-muted hover:text-text-primary text-sm transition-colors">{t.nav.about}</a>
          <a href="#projects" className="text-text-muted hover:text-text-primary text-sm transition-colors">{t.nav.projects}</a>
          <a href="#skills" className="text-text-muted hover:text-text-primary text-sm transition-colors">{t.nav.skills}</a>
          <Link href="/chat" className="btn-primary text-xs">{t.nav.chatWithAI}</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden p-2 -mr-2 text-text-muted hover:text-text-primary"
          aria-label={t.nav.menu}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-border bg-bg/95 backdrop-blur-lg px-4 py-3 space-y-1">
          <a href="#about" onClick={() => setOpen(false)} className="block py-2 text-text-muted hover:text-text-primary text-sm">{t.nav.about}</a>
          <a href="#projects" onClick={() => setOpen(false)} className="block py-2 text-text-muted hover:text-text-primary text-sm">{t.nav.projects}</a>
          <a href="#skills" onClick={() => setOpen(false)} className="block py-2 text-text-muted hover:text-text-primary text-sm">{t.nav.skills}</a>
          <Link href="/chat" onClick={() => setOpen(false)} className="block py-2 text-accent text-sm font-medium">{t.nav.chatWithAI}</Link>
        </div>
      )}
    </nav>
  );
}
