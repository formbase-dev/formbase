'use client';

import { ClipboardIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useCopyToClipboard } from '~/lib/hooks/use-copy-to-clipboard';

type CopyFormIdProps = {
  formId: string;
};

export default function CopyFormId({ formId }: CopyFormIdProps) {
  const [, copy] = useCopyToClipboard();

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-sm font-medium">
        {formId}
      </span>
      <ClipboardIcon
        onClick={() =>
          copy(formId).then(() => {
            toast('Copied to Clipboard', {
              icon: <ClipboardIcon className="h-4 w-4" />,
            });
          })
        }
        className="h-4 w-4 text-muted-foreground"
      />
    </div>
  );
}
