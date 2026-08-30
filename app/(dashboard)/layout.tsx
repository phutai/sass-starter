'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { CircleIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/app/theme-toggle';
import { UserMenu } from './user-menu';

function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-accent" />
          <span className="ml-2 text-xl font-semibold">ACME</span>
        </Link>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith('/dashboard');

  return (
    <section className="flex flex-col min-h-screen">
      {showHeader ? <Header /> : null}
      {children}
    </section>
  );
}
