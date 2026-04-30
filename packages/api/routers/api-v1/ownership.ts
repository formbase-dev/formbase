import type { db as database } from '@formbase/db';

import { TRPCError } from '@trpc/server';

import {
  assertFormDataOwnership,
  assertFormOwnership,
} from '../form-ownership';

type DbContext = { db: typeof database; user: { id: string } };

export async function assertApiFormOwnership(ctx: DbContext, formId: string) {
  return assertFormOwnership(ctx, formId, 'Form not found');
}

export async function assertApiSubmissionOwnership(
  ctx: DbContext,
  formId: string,
  submissionId: string,
) {
  const submission = await assertFormDataOwnership(
    ctx,
    submissionId,
    'Submission not found',
  );

  if (submission.formId !== formId) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Submission not found',
    });
  }

  return submission;
}
