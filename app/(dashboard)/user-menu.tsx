'use client';

import Link from 'next/link';
import { Avatar, Dropdown } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import { Home, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserMenu() {
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
