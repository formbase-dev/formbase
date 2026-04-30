import { redirect } from 'next/navigation';

import { getSession } from '@formbase/auth/server';
import { env } from '@formbase/env';

import { Logo } from '../_components/logo';
import { VerifyEmail } from './verify-code';

export const metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to continue.',
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const session = await getSession();
  const resolvedSearchParams = await searchParams;
  const tokenParam = resolvedSearchParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!session && !token) {
    redirect('/login');
  }

  if (session?.user.emailVerified || env.SKIP_EMAIL_VERIFICATION) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center space-x-1.5">
          <Logo className="h-7 w-7 text-foreground" aria-hidden={true} />
          <p className="font-medium text-lg text-foreground">Formbase</p>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">
          Verify your email
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {session?.user.email ? (
            <>
              We sent a verification email to{' '}
              <strong className="text-foreground">{session.user.email}</strong>.
              Check your spam folder if you can&apos;t find the email.
            </>
          ) : (
            <>Use the verification link from your email to continue.</>
          )}
        </p>
        <VerifyEmail email={session?.user.email ?? null} />
      </div>
    </div>
  );
}
