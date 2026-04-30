import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { drizzlePrimitives } from '@formbase/db';
import { forms } from '@formbase/db/schema';
import { generateId } from '@formbase/utils/generate-id';

import { parseJsonArray, serializeJson } from '../../utils/json';
import { assertApiFormOwnership } from './ownership';
import {
  bulkCreateFormInputSchema,
  bulkDeleteInputSchema,
  bulkUpdateFormInputSchema,
  createFormInputSchema,
  formSchema,
  paginationInputSchema,
  paginationOutputSchema,
  updateFormInputSchema,
} from './schemas';
import { apiKeyProcedure, createApiV1Router } from './trpc';

const { and, count, eq, inArray } = drizzlePrimitives;

export const formsRouter = createApiV1Router({
  list: apiKeyProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/forms',
        tags: ['Forms'],
        summary: 'List all forms',
        description:
          'Returns a paginated list of forms owned by the authenticated user.',
      },
    })
    .input(paginationInputSchema)
    .output(
      z.object({
        forms: z.array(formSchema),
        pagination: paginationOutputSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const offset = (input.page - 1) * input.perPage;

      const [formsList, totalResult] = await Promise.all([
        ctx.db.query.forms.findMany({
          where: (table) => eq(table.userId, userId),
          offset,
          limit: input.perPage,
          orderBy: (table, { desc }) => desc(table.createdAt),
          with: {
            formData: true,
          },
        }),
        ctx.db
          .select({ count: count() })
          .from(forms)
          .where(eq(forms.userId, userId)),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        forms: formsList.map((form) => ({
          id: form.id,
          title: form.title,
          description: form.description,
          returnUrl: form.returnUrl,
          keys: parseJsonArray(form.keys),
          submissionCount: form.formData.length,
          createdAt: form.createdAt.toISOString(),
          updatedAt: form.updatedAt?.toISOString() ?? null,
        })),
        pagination: {
          page: input.page,
          perPage: input.perPage,
          total,
          totalPages: Math.ceil(total / input.perPage),
        },
      };
    }),

  create: apiKeyProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms',
        tags: ['Forms'],
        summary: 'Create a new form',
      },
    })
    .input(createFormInputSchema)
    .output(z.object({ id: z.string() }))
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
        keys: serializeJson([]),
        enableEmailNotifications: true,
        enableSubmissions: true,
        defaultSubmissionEmail: userEmail,
      });

      return { id };
    }),

  get: apiKeyProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Get a single form',
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(formSchema)
    .query(async ({ ctx, input }) => {
      const form = await ctx.db.query.forms.findFirst({
        where: (table) =>
          and(eq(table.id, input.formId), eq(table.userId, ctx.user.id)),
        with: { formData: true },
      });

      if (!form) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Form not found',
        });
      }

      return {
        id: form.id,
        title: form.title,
        description: form.description,
        returnUrl: form.returnUrl,
        keys: parseJsonArray(form.keys),
        submissionCount: form.formData.length,
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt?.toISOString() ?? null,
      };
    }),

  update: apiKeyProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Update a form',
      },
    })
    .input(updateFormInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const form = await assertApiFormOwnership(ctx, input.formId);

      await ctx.db
        .update(forms)
        .set({
          title: input.title ?? form.title,
          description: input.description ?? form.description,
          returnUrl: input.returnUrl ?? form.returnUrl,
          updatedAt: new Date(),
        })
        .where(eq(forms.id, input.formId));

      return { success: true };
    }),

  delete: apiKeyProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Delete a form',
        description: 'Permanently deletes a form and all its submissions.',
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertApiFormOwnership(ctx, input.formId);
      await ctx.db.delete(forms).where(eq(forms.id, input.formId));
      return { success: true };
    }),

  duplicate: apiKeyProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms/{formId}/duplicate',
        tags: ['Forms'],
        summary: 'Duplicate a form',
        description: 'Creates a copy of a form with its configuration.',
      },
    })
    .input(z.object({ formId: z.string() }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingForm = await assertApiFormOwnership(ctx, input.formId);
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
      });

      return { id: newId };
    }),

  bulkCreate: apiKeyProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms/bulk',
        tags: ['Forms'],
        summary: 'Create multiple forms',
      },
    })
    .input(bulkCreateFormInputSchema)
    .output(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const userEmail = ctx.user.email;
      const ids: string[] = [];

      for (const form of input.forms) {
        const id = generateId(15);
        ids.push(id);

        await ctx.db.insert(forms).values({
          id,
          userId: ctx.user.id,
          title: form.title,
          description: form.description ?? null,
          updatedAt: new Date(),
          returnUrl: form.returnUrl ?? null,
          keys: serializeJson([]),
          enableEmailNotifications: true,
          enableSubmissions: true,
          defaultSubmissionEmail: userEmail,
        });
      }

      return { ids };
    }),

  bulkUpdate: apiKeyProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/forms/bulk',
        tags: ['Forms'],
        summary: 'Update multiple forms',
      },
    })
    .input(bulkUpdateFormInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      for (const formUpdate of input.forms) {
        const form = await assertApiFormOwnership(ctx, formUpdate.id);

        await ctx.db
          .update(forms)
          .set({
            title: formUpdate.title ?? form.title,
            description: formUpdate.description ?? form.description,
            returnUrl: formUpdate.returnUrl ?? form.returnUrl,
            updatedAt: new Date(),
          })
          .where(eq(forms.id, formUpdate.id));
      }

      return { success: true };
    }),

  bulkDelete: apiKeyProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/forms/bulk',
        tags: ['Forms'],
        summary: 'Delete multiple forms',
      },
    })
    .input(bulkDeleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userForms = await ctx.db.query.forms.findMany({
        where: (table) =>
          and(inArray(table.id, input.ids), eq(table.userId, ctx.user.id)),
      });

      const ownedIds = userForms.map((f) => f.id);
      const notFound = input.ids.filter((id) => !ownedIds.includes(id));

      if (notFound.length > 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Forms not found: ${notFound.join(', ')}`,
        });
      }

      await ctx.db.delete(forms).where(inArray(forms.id, input.ids));

      return { success: true };
    }),
});
