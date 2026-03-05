'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', group: 'manage' },
  { label: 'Plans', href: '/admin/plans', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', group: 'manage' },
  { label: 'Portfolio', href: '/admin/portfolio', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', group: 'manage' },
  { label: 'Sites', href: '/admin/sites', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9', group: 'manage' },
  { label: 'Domains', href: '/admin/domains', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', group: 'manage' },
  { label: 'Agents', href: '/admin/agents', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', group: 'manage' },
  { label: 'Settings', href: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', group: 'system' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen border-r border-border bg-bg-card p-4 space-y-1 flex flex-col">
      <div className="mb-6 px-3">
        <Link href="/" className="text-lg font-bold gradient-text">Rostandy</Link>
        <p className="text-text-dim text-xs mt-1">Admin Panel</p>
      </div>

      <div className="space-y-0.5 flex-1">
        <p className="text-text-dim text-[10px] font-bold uppercase tracking-wider px-3 mb-2">Management</p>
        {navItems.filter(i => i.group === 'manage').map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
              }`}>
              <NavIcon d={item.icon} /><span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-border/50">
          <p className="text-text-dim text-[10px] font-bold uppercase tracking-wider px-3 mb-2">System</p>
        </div>
        {navItems.filter(i => i.group === 'system').map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-accent/10 text-accent border border-accent/20' : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
              }`}>
              <NavIcon d={item.icon} /><span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 mt-4 border-t border-border">
        <button
          onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors w-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
