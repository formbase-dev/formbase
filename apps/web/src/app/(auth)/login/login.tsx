'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { SyntheticEvent } from 'react';

import { IconBrandGithub, IconBrandGoogleFilled } from '@tabler/icons-react';

import { signIn } from '@formbase/auth/client';
import { Button } from '@formbase/ui/primitives/button';
import { Input } from '@formbase/ui/primitives/input';
import { Label } from '@formbase/ui/primitives/label';
import { Separator } from '@formbase/ui/primitives/separator';

import { LoadingButton } from '~/components/loading-button';
import { PasswordInput } from '~/components/password-input';
import { useSocialAuth } from '~/lib/hooks/use-social-auth';

import { Logo } from '../_components/logo';

export function Login() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSocialSignIn,
    loading: socialLoading,
    error: socialError,
  } = useSocialAuth();

  const displayError = formError ?? socialError;

  const handleLogin = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get('email');
    const passwordValue = formData.get('password');
    const email = typeof emailValue === 'string' ? emailValue : '';
    const password = typeof passwordValue === 'string' ? passwordValue : '';

    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      });

      if (error) {
        setFormError(error.message ?? null);
        return;
      }

      router.push('/dashboard');
    } catch {
      setFormError('Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSocialDisabled = socialLoading !== null;

  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center space-x-1.5">
          <Logo className="h-7 w-7 text-foreground" aria-hidden={true} />
          <p className="font-medium text-lg text-foreground">Formbase</p>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">
          Sign in to your account
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/90"
          >
            Sign up
          </Link>
        </p>
        <div className="mt-8 flex flex-col items-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button
            variant="outline"
            className="w-full flex-1 items-center justify-center py-2"
            onClick={() => handleSocialSignIn('github')}
            disabled={isSocialDisabled}
          >
            <IconBrandGithub className="size-4" aria-hidden={true} />
            <span className="text-sm font-medium">
              {socialLoading === 'github'
                ? 'Signing in...'
                : 'Login with GitHub'}
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2 flex-1 items-center justify-center py-2 sm:mt-0"
            onClick={() => handleSocialSignIn('google')}
            disabled={isSocialDisabled}
          >
            <IconBrandGoogleFilled className="size-4" aria-hidden={true} />
            <span className="text-sm font-medium">
              {socialLoading === 'google'
                ? 'Signing in...'
                : 'Login with Google'}
            </span>
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="email@example.com"
              className="mt-2"
              required
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="********"
              className="mt-2"
              required
            />
          </div>

          {displayError ? (
            <p className="rounded-lg border bg-destructive/10 p-2 text-[0.8rem] font-medium text-destructive">
              {displayError}
            </p>
          ) : null}

          <LoadingButton
            type="submit"
            className="mt-4 w-full py-2 font-medium"
            loading={isSubmitting}
          >
            Sign in
          </LoadingButton>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Forgot your password?{' '}
          <Link
            href="/reset-password"
            className="font-medium text-primary hover:text-primary/90"
          >
            Reset password
          </Link>
        </p>
      </div>
    </div>
  );
}
