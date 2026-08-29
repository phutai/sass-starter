'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Avatar, Dropdown } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import { CircleIcon, Home, LogOut } from 'lucide-react';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          href="/sign-up"
          className={buttonVariants({ variant: 'secondary' })}
        >
          Sign Up
        </Link>
      </>
    );
  }

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Avatar className="size-9">
          <Avatar.Image alt={user.name || ''} />
          <Avatar.Fallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === 'sign-out') handleSignOut();
          }}
        >
          <Dropdown.Item
            id="dashboard"
            href="/dashboard"
            textValue="Dashboard"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Dropdown.Item>
          <Dropdown.Item id="sign-out" textValue="Sign out">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function Header() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-accent" />
          <span className="ml-2 text-xl font-semibold">ACME</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
