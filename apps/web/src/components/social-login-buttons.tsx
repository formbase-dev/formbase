'use client';

import { GitHubLogoIcon } from '@radix-ui/react-icons';

import { Button } from '@formbase/ui/primitives/button';

type SocialProvider = 'github' | 'google';

interface SocialLoginButtonsProps {
  onSocialSignIn: (provider: SocialProvider) => void;
  loading: SocialProvider | null;
  disabled?: boolean;
  variant: 'login' | 'signup';
}

export function SocialLoginButtons({
  onSocialSignIn,
  loading,
  disabled = false,
  variant,
}: SocialLoginButtonsProps) {
  const actionText = variant === 'login' ? 'Log in' : 'Sign up';
  const isDisabled = disabled || loading !== null;

  return (
    <div className="grid gap-2">
      <Button
        variant="outline"
        className="w-full"
        disabled={isDisabled}
        onClick={() => {
          onSocialSignIn('github');
        }}
      >
        <GitHubLogoIcon className="mr-2 h-5 w-5" />
        {actionText} with GitHub
      </Button>
      <Button
        variant="outline"
        className="w-full"
        disabled={isDisabled}
        onClick={() => {
          onSocialSignIn('google');
        }}
      >
        {actionText} with Google
      </Button>
    </div>
  );
}
