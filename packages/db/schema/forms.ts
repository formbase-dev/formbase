import type { InferSelectModel } from 'drizzle-orm';

import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { users } from './users';

export const forms = sqliteTable(
  'forms',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }),
    returnUrl: text('return_url'),
    enableEmailNotifications: integer('send_email_for_new_submissions', {
      mode: 'boolean',
    })
      .default(true)
      .notNull(),
    keys: text('keys').notNull(),
    enableSubmissions: integer('enable_submissions', {
      mode: 'boolean',
    })
      .default(true)
      .notNull(),
    enableRetention: integer('enable_retention', {
      mode: 'boolean',
    })
      .default(true)
      .notNull(),
    defaultSubmissionEmail: text('default_submission_email'),
    honeypotField: text('honeypot_field').default('_gotcha').notNull(),
  },
  (t) => [
    index('form_user_idx').on(t.userId),
    index('form_created_at_idx').on(t.createdAt),
  ],
);

export const ZSelectFormSchema = createSelectSchema(forms);
export const ZInsertFormSchema = createInsertSchema(forms);
export const ZUpdateFormSchema = createInsertSchema(forms).pick({
  id: true,
  title: true,
  description: true,
  returnUrl: true,
  enableSubmissions: true,
  enableEmailNotifications: true,
  enableRetention: true,
  honeypotField: true,
});

export type Form = InferSelectModel<typeof forms>;
