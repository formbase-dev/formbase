'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import {
  BookOpenIcon,
  ChevronDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PaletteIcon,
  SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { signOut, useSession } from '@formbase/auth/client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@formbase/ui/primitives/alert-dialog';
import { Button } from '@formbase/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@formbase/ui/primitives/dropdown-menu';

import { LoadingButton } from '~/components/loading-button';
import { UserAvatar } from '~/components/user-avatar';

export const UserDropdown = ({ className }: { className?: string }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signoutDialogOpen, setSignoutDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`h-auto p-0 hover:bg-transparent ${className ?? ''}`}
          >
            <UserAvatar src={user.image ?? null} seed={user.email} />
            <ChevronDownIcon
              aria-hidden="true"
              className="opacity-60"
              size={16}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/dashboard">
                <LayoutDashboardIcon
                  aria-hidden="true"
                  className="opacity-60"
                  size={16}
                />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/dashboard/settings">
                <SettingsIcon
                  aria-hidden="true"
                  className="opacity-60"
                  size={16}
                />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href="/onboarding">
                <BookOpenIcon
                  aria-hidden="true"
                  className="opacity-60"
                  size={16}
                />
                <span>Onboarding</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <PaletteIcon
                aria-hidden="true"
                className="opacity-60"
                size={16}
              />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme('light');
                  }}
                >
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme('dark');
                  }}
                >
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTheme('system');
                  }}
                >
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <SignoutMenuItem
            onClick={() => {
              setSignoutDialogOpen(true);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <SignoutDialog
        open={signoutDialogOpen}
        onOpenChange={setSignoutDialogOpen}
      />
    </>
  );
};

const SignoutMenuItem = ({ onClick }: { onClick: () => void }) => {
  return (
    <DropdownMenuItem className="cursor-pointer" onClick={onClick}>
      <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
      <span>Sign out</span>
    </DropdownMenuItem>
  );
};

const SignoutDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignout = async () => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        throw new Error(error.message);
      }
      toast('Signed out successfully');
      window.location.href = '/';
    } catch (error) {
      if (error instanceof Error) {
        toast(error.message, {
          icon: (
            <ExclamationTriangleIcon className="h-4 w-4 text-destructive" />
          ),
        });
      }
    } finally {
      onOpenChange(false);
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xs">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Sign out from Formbase?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will be redirected to the home page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <LoadingButton loading={isLoading} onClick={handleSignout}>
            Okay
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
