import { drizzlePrimitives } from "@formbase/db";
import { formDatas, forms, onboardingForms } from "@formbase/db/schema";
import { generateId } from "@formbase/utils/generate-id";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { parseJsonArray, serializeJson } from "../utils/json";
import { assertFormOwnership } from "./form-ownership";

const { and, count, eq } = drizzlePrimitives;

export const formRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().default(1),
        perPage: z.number().int().default(12),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.query.forms.findMany({
        where: (table) => eq(table.userId, ctx.user.id),
        offset: (input.page - 1) * input.perPage,
        limit: input.perPage,
        orderBy: (table, { desc }) => desc(table.createdAt),
        columns: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
        with: { user: { columns: { email: true } } },
      }),
    ),

  get: protectedProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.query.forms.findFirst({
        where: (table) =>
          and(eq(table.id, input.formId), eq(table.userId, ctx.user.id)),
        with: { user: { columns: { email: true } } },
      });

      if (!form) return null;

      return {
        ...form,
        keys: parseJsonArray(form.keys),
      };
    }),

  getOnboardingForm: protectedProcedure.query(async ({ ctx }) =>
    ctx.db.query.onboardingForms.findMany({
      where: (table) => eq(table.userId, ctx.user.id),
    }),
  ),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        returnUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = generateId(15);
      const userEmail = ctx.user.email;

      await ctx.db.insert(forms).values({
        id,
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        updatedAt: new Date(),
        returnUrl: input.returnUrl ?? null,
        keys: serializeJson(['']),
        enableEmailNotifications: true,
        enableSubmissions: true,
        defaultSubmissionEmail: userEmail,
      });

      return { id };
    }),

  createOnboardingForm: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        returnUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const formId = generateId(15);

      await ctx.db.insert(forms).values({
        id: formId,
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        updatedAt: new Date(),
        returnUrl: input.returnUrl ?? null,
        keys: serializeJson(['']),
        enableEmailNotifications: true,
        enableSubmissions: true,
      });

      await ctx.db.insert(onboardingForms).values({
        id: generateId(15),
        formId: formId,
        userId: ctx.user.id,
      });

      return { formId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        enableSubmissions: z.boolean().optional(),
        enableEmailNotifications: z.boolean().optional(),
        returnUrl: z.string().optional(),
        defaultSubmissionEmail: z.string().optional(),
        honeypotField: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const form = await assertFormOwnership(ctx, input.id);

      await ctx.db
        .update(forms)
        .set({
          title: input.title ?? form.title,
          description: input.description ?? form.description,
          updatedAt: new Date(),
          enableSubmissions: input.enableSubmissions ?? form.enableSubmissions,
          enableEmailNotifications:
            input.enableEmailNotifications ?? form.enableEmailNotifications,
          returnUrl: input.returnUrl ?? form.returnUrl,
          defaultSubmissionEmail:
            input.defaultSubmissionEmail ?? form.defaultSubmissionEmail,
          honeypotField: input.honeypotField ?? form.honeypotField,
        })
        .where(eq(forms.id, input.id));
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertFormOwnership(ctx, input.id);
      await ctx.db.delete(forms).where(eq(forms.id, input.id));
    }),

  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingForm = await assertFormOwnership(ctx, input.id);
      const newId = generateId(15);

      await ctx.db.insert(forms).values({
        id: newId,
        userId: ctx.user.id,
        title: `${existingForm.title} (Copy)`,
        description: existingForm.description,
        updatedAt: new Date(),
        returnUrl: existingForm.returnUrl,
        keys: existingForm.keys,
        enableEmailNotifications: existingForm.enableEmailNotifications,
        enableSubmissions: existingForm.enableSubmissions,
        defaultSubmissionEmail: existingForm.defaultSubmissionEmail,
        honeypotField: existingForm.honeypotField,
      });

      return { id: newId };
    }),

  userForms: protectedProcedure
    .input(
      z.object({
        page: z.number().int().default(1),
        perPage: z.number().int().default(12),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.query.forms.findMany({
        where: (table) => eq(table.userId, ctx.user.id),
        offset: (input.page - 1) * input.perPage,
        limit: input.perPage,
        columns: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          formData: true,
        },
      }),
    ),

  getReturnUrl: publicProcedure
    .input(z.object({ formId: z.string() }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.query.forms.findFirst({
        where: (table) => eq(table.id, input.formId),
        columns: { returnUrl: true },
      });
      return { returnUrl: form?.returnUrl ?? null };
    }),

  formSubmissions: protectedProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertFormOwnership(ctx, input.formId);
      return ctx.db
        .select({ count: count(formDatas.data) })
        .from(formDatas)
        .where(eq(formDatas.formId, input.formId));
    }),

  getFormById: publicProcedure
    .input(
      z.object({
        formId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.query.forms.findFirst({
        where: (table) => eq(table.id, input.formId),
      });

      if (!form) return null;

      return {
        ...form,
        keys: parseJsonArray(form.keys),
      };
    }),
});
