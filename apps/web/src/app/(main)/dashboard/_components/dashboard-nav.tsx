'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GearIcon } from '@radix-ui/react-icons';
import { BookOpenIcon, FileTextIcon } from 'lucide-react';

import { cn } from '@formbase/ui/utils/cn';

const items = [
  {
    title: 'Posts',
    href: '/dashboard',
    icon: FileTextIcon,
  },

  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: GearIcon,
  },
  {
    title: 'Docs',
    href: 'https://docs.formbase.dev/',
    icon: BookOpenIcon,
  },
];

interface Props {
  className?: string;
}

export function DashboardNav({ className }: Props) {
  const path = usePathname();

  return (
    <nav className={cn(className)}>
      {items.map((item) => (
        <Link href={item.href} key={item.href}>
          <span
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              path === item.href ? 'bg-accent' : 'transparent',
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
