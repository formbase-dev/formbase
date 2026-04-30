import type { db as database } from '@formbase/db';

import { TRPCError } from '@trpc/server';

import { drizzlePrimitives } from '@formbase/db';

const { and, eq } = drizzlePrimitives;

type OwnershipContext = { db: typeof database; user: { id: string } };

export const assertFormOwnership = async (
  ctx: OwnershipContext,
  formId: string,
  notFoundMessage?: string,
) => {
  const form = await ctx.db.query.forms.findFirst({
    where: (table) => and(eq(table.id, formId), eq(table.userId, ctx.user.id)),
  });

  if (!form) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      ...(notFoundMessage ? { message: notFoundMessage } : {}),
    });
  }

  return form;
};

export const assertFormDataOwnership = async (
  ctx: OwnershipContext,
  formDataId: string,
  notFoundMessage?: string,
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
    throw new TRPCError({
      code: 'NOT_FOUND',
      ...(notFoundMessage ? { message: notFoundMessage } : {}),
    });
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
