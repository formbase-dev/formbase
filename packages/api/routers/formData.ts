import { z } from 'zod';

import { drizzlePrimitives } from '@formbase/db';
import { formDatas, forms } from '@formbase/db/schema';
import { flattenObject } from '@formbase/utils/flatten-object';
import { generateId } from '@formbase/utils/generate-id';

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { parseJsonObject, serializeJson } from '../utils/json';
import { assertFormDataOwnership, assertFormOwnership } from './form-ownership';

const { eq } = drizzlePrimitives;

export const formDataRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const row = await assertFormDataOwnership(ctx, input.id);

      return {
        ...row,
        data: parseJsonObject(row.data),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        data: z.unknown(),
        formId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertFormOwnership(ctx, input.formId);
      const id = generateId(15);

      await ctx.db.insert(formDatas).values({
        id,
        data: serializeJson(input.data),
        formId: input.formId,
      });

      await ctx.db
        .update(forms)
        .set({ updatedAt: new Date() })
        .where(eq(forms.id, input.formId));

      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertFormDataOwnership(ctx, input.id);
      await ctx.db
        .update(formDatas)
        .set({
          data: serializeJson(input.data),
        })
        .where(eq(formDatas.id, input.id));
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertFormDataOwnership(ctx, input.id);
      await ctx.db.delete(formDatas).where(eq(formDatas.id, input.id));
    }),

  all: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertFormOwnership(ctx, input.formId);
      const formData = await ctx.db.query.formDatas.findMany({
        where: (table, { eq }) => eq(table.formId, input.formId),
      });

      return formData.map((data) => {
        const parsed = parseJsonObject(data.data);
        const normalized = {
          ...data,
          data: parsed,
        };

        return {
          ...flattenObject({
            ...data,
            data: parsed ?? {},
          }),
          ...normalized,
        };
      });
    }),

  setFormData: publicProcedure
    .input(
      z.object({
        formId: z.string(),
        data: z.unknown(),
        keys: z.array(z.string()),
        isSpam: z.boolean().optional().default(false),
        spamReason: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        const formdata = await tx.insert(formDatas).values({
          data: serializeJson(input.data),
          formId: input.formId,
          id: generateId(15),
          createdAt: new Date(),
          isSpam: input.isSpam,
          spamReason: input.spamReason ?? null,
        });

        await tx
          .update(forms)
          .set({
            updatedAt: new Date(),
            keys: serializeJson(input.keys),
          })
          .where(eq(forms.id, input.formId));

        return formdata;
      });
    }),

  markAsSpam: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isSpam: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertFormDataOwnership(ctx, input.id);
      await ctx.db
        .update(formDatas)
        .set({
          isSpam: input.isSpam,
          manualOverride: true,
        })
        .where(eq(formDatas.id, input.id));
    }),
});
