'use client';

import * as React from 'react';

import type { InputProps } from '@formbase/ui/primitives/input';

import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { Input } from '@formbase/ui/primitives/input';
import { cn } from '@formbase/ui/utils/cn';

const PasswordInputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    return (
      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          className={cn('pe-9', className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          onClick={toggleVisibility}
          disabled={props.disabled}
        >
          {isVisible ? (
            <EyeOffIcon aria-hidden="true" size={16} />
          ) : (
            <EyeIcon aria-hidden="true" size={16} />
          )}
        </button>
      </div>
    );
  },
);
PasswordInputComponent.displayName = 'PasswordInput';

export const PasswordInput = PasswordInputComponent;
