import '../styles/globals.css';

import { Inter as FontSans } from 'next/font/google';
import Script from 'next/script';

import type { Metadata, Viewport } from 'next';

import { Toaster } from 'sonner';

import { TooltipProvider } from '@formbase/ui/primitives/tooltip';
import { cn } from '@formbase/ui/utils/cn';

import { ThemeProvider } from '~/components/theme-provider';
import { TRPCReactProvider } from '~/lib/trpc/react';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const umamiTrackingId = process.env['UMAMI_TRACKING_ID'];

export const metadata: Metadata = {
  title: {
    default: 'Formbase',
    template: `%s | Formbase`,
  },
  description: 'Manage forms with ease',
  icons: [{ rel: 'icon', url: '/icon.png' }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
        {umamiTrackingId && (
          <Script
            async
            src="https://analytics.duncan.land/script.js"
            data-website-id={umamiTrackingId}
          />
        )}
      </body>
    </html>
  );
}
