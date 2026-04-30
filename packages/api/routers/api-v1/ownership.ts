import type { db as database } from '@formbase/db';

import { TRPCError } from '@trpc/server';

import { drizzlePrimitives } from '@formbase/db';

const { and, eq } = drizzlePrimitives;

type DbContext = { db: typeof database; user: { id: string } };

export async function assertApiFormOwnership(ctx: DbContext, formId: string) {
  const form = await ctx.db.query.forms.findFirst({
    where: (table) => and(eq(table.id, formId), eq(table.userId, ctx.user.id)),
  });

  if (!form) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Form not found',
    });
  }

  return form;
}

export async function assertApiSubmissionOwnership(
  ctx: DbContext,
  formId: string,
  submissionId: string,
) {
  await assertApiFormOwnership(ctx, formId);

  const submission = await ctx.db.query.formDatas.findFirst({
    where: (table) => and(eq(table.id, submissionId), eq(table.formId, formId)),
  });

  if (!submission) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Submission not found',
    });
  }

  return submission;
}
