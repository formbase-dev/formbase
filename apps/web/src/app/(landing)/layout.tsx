import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { Header } from './_components/header';
import { SiteFooter } from './_components/site-footer';

export const dynamic = 'force-dynamic';

async function LandingPageLayout({ children }: { children: ReactNode }) {
  const databaseUrl = process.env['DATABASE_URL'];
  const hasSessionRuntimeEnv =
    !!databaseUrl &&
    (!databaseUrl.startsWith('libsql://') || !!process.env['TURSO_AUTH_TOKEN']) &&
    !!process.env['BETTER_AUTH_SECRET'] &&
    !!process.env['NEXT_PUBLIC_APP_URL'] &&
    !!process.env['ALLOW_SIGNIN_SIGNUP'];
  let isLoggedIn = false;

  if (hasSessionRuntimeEnv) {
    const { getSession } = await import('@formbase/auth/server');
    isLoggedIn = !!(await getSession())?.user;

    if (isLoggedIn) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="bg-white dark:bg-black">
      <Header isLoggedIn={isLoggedIn} />
      {children}

      <SiteFooter />
    </div>
  );
}

export default LandingPageLayout;
