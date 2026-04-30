'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import type { SyntheticEvent } from 'react';

import { toast } from 'sonner';

import { authClient } from '@formbase/auth/client';
import { Input } from '@formbase/ui/primitives/input';
import { Label } from '@formbase/ui/primitives/label';

import { LoadingButton } from '~/components/loading-button';

export function SendResetEmail() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetRequest = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const emailValue = formData.get('email');
    const email = typeof emailValue === 'string' ? emailValue : '';

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
      });

      if (error) {
        setFormError(error.message ?? null);
        return;
      }

      toast('A password reset link has been sent to your email.');
      router.push('/login');
    } catch {
      setFormError('Unable to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={handleResetRequest}>
      <div>
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
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

      {formError ? (
        <p className="rounded-lg border bg-destructive/10 p-2 text-[0.8rem] font-medium text-destructive">
          {formError}
        </p>
      ) : null}

      <LoadingButton
        className="mt-4 w-full py-2 font-medium"
        loading={isSubmitting}
      >
        Send reset link
      </LoadingButton>
    </form>
  );
}
