'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Input, Label } from '@heroui/react';
import {
  Activity,
  Bell,
  Bot,
  Building2,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Shield,
  Users
} from 'lucide-react';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', icon: Users, label: 'Team' },
      { href: '/dashboard/ai', icon: Bot, label: 'AI Launch Plan' },
      { href: '/dashboard/general', icon: Settings, label: 'General' },
      { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
      { href: '/dashboard/security', icon: Shield, label: 'Security' }
    ]
  },
  {
    label: 'Product',
    items: [
      { href: '/pricing', icon: CreditCard, label: 'Billing' }
    ]
  }
];

function Sidebar({
  pathname,
  onNavigate
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex size-9 items-center justify-center rounded bg-foreground text-background">
          <Building2 className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">ACME</p>
          <p className="text-xs text-muted">Team workspace</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-xs font-medium uppercase text-muted">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex h-10 items-center justify-between rounded px-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted hover:bg-default hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" />
                      {item.label}
                    </span>
                    {isActive ? <ChevronRight className="size-4" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded border border-border bg-surface-secondary p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutDashboard className="size-4" />
            Pro layout
          </div>
          <p className="mt-1 text-xs leading-5 text-muted">
            Compact navigation, status cards, and workspace controls.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[calc(100dvh-65px)] bg-background">
      <div className="flex min-h-[calc(100dvh-65px)]">
        <div className="hidden lg:block">
          <Sidebar pathname={pathname} />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/30"
              type="button"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative h-full">
              <Sidebar
                pathname={pathname}
                onNavigate={() => setIsSidebarOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-6">
            <Button
              aria-label="Open navigation"
              className="lg:hidden"
              isIconOnly
              variant="ghost"
              onPress={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>

            <div className="hidden min-w-[260px] md:block">
              <Label className="sr-only" htmlFor="dashboard-search">
                Search
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="dashboard-search"
                  className="pl-9"
                  placeholder="Search workspace"
                  variant="secondary"
                  fullWidth
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button aria-label="Notifications" isIconOnly variant="ghost">
                <Bell className="size-5" />
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
