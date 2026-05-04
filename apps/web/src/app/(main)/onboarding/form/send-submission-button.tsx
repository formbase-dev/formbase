'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { LoadingButton } from '~/components/loading-button';

type SendFormSubmissionButton = {
  formId: string | null;
};

export default function SendFormSubmissionButton({
  formId,
}: SendFormSubmissionButton) {
  const [isSubmittingForm, startFormSubmitTransition] = useTransition();
  const router = useRouter();

  const handleFormSubmission = () => {
    startFormSubmitTransition(async () => {
      await fetch(`/s/${formId}`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello, welcome to formbase',
        }),
      });

      toast.success('Form submission sent!');

      router.push(`/form/${formId}`);
    });
  };
  return (
    <LoadingButton
      onClick={handleFormSubmission}
      className="flex items-center gap-1"
      loading={isSubmittingForm}
      disabled={!formId || isSubmittingForm}
    >
      {!isSubmittingForm && <Send className="w-4 h-4" />}
      <span>Send a submission</span>
    </LoadingButton>
  );
}
