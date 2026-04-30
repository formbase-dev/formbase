import { TRPCError } from '@trpc/server';

import { drizzlePrimitives } from '@formbase/db';

import { type createTRPCContext } from '../trpc';

const { and, eq } = drizzlePrimitives;

type Context = Awaited<ReturnType<typeof createTRPCContext>>;
type AuthedContext = Context & { user: NonNullable<Context['user']> };

export const assertFormOwnership = async (
  ctx: AuthedContext,
  formId: string,
) => {
  const form = await ctx.db.query.forms.findFirst({
    where: (table) => and(eq(table.id, formId), eq(table.userId, ctx.user.id)),
  });

  if (!form) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return form;
};

export const assertFormDataOwnership = async (
  ctx: AuthedContext,
  formDataId: string,
) => {
  const formData = await ctx.db.query.formDatas.findFirst({
    where: (table, { eq }) => eq(table.id, formDataId),
    with: {
      form: {
        columns: {
          userId: true,
        },
      },
    },
  });

  if (formData?.form.userId !== ctx.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return {
    id: formData.id,
    formId: formData.formId,
    data: formData.data,
    createdAt: formData.createdAt,
    isSpam: formData.isSpam,
    spamReason: formData.spamReason,
    manualOverride: formData.manualOverride,
  };
};
