'use client';

import { useState } from 'react';

import { CheckIcon, ClipboardIcon } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@formbase/ui/utils/cn';

import { useCopyToClipboard } from '~/lib/hooks/use-copy-to-clipboard';

type CopyButtonProps = {
  text: string;
  className?: string;
};

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [, copy] = useCopyToClipboard();
  const [hasCopied, setHasCopied] = useState(false);

  return (
    <>
      {hasCopied ? (
        <CheckIcon
          className={cn(
            'h-4 w-4 cursor-pointer text-muted-foreground transition-transform hover:scale-110 hover:transform',
            className,
          )}
        />
      ) : (
        <ClipboardIcon
          className={cn(
            'h-4 w-4 cursor-pointer text-muted-foreground transition-transform hover:scale-110 hover:transform',
            className,
          )}
          onClick={async (e) => {
            e.preventDefault();
            await copy(text);
            toast('Copied to clipboard', {
              icon: <ClipboardIcon className="h-4 w-4" />,
            });

            setHasCopied(true);

            setTimeout(() => {
              setHasCopied(false);
            }, 2000);
          }}
        />
      )}
    </>
  );
};
