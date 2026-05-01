import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { type z } from 'zod';

import { forms } from './forms';

export const formDatas = sqliteTable(
  'form_datas',
  {
    id: text('id').primaryKey(),
    formId: text('form_id')
      .references(() => forms.id, { onDelete: 'cascade' })
      .notNull(),
    data: text('data').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    isSpam: integer('is_spam', { mode: 'boolean' }).default(false).notNull(),
    spamReason: text('spam_reason'),
    manualOverride: integer('manual_override', { mode: 'boolean' })
      .default(false)
      .notNull(),
  },
  (t) => [
    index('form_idx').on(t.formId),
    index('form_data_created_at_idx').on(t.createdAt),
  ],
);

export const ZSelectFormDataSchema = createSelectSchema(formDatas);
export const ZInsertFormDataSchema = createInsertSchema(formDatas);
export const ZUpdateFormDataSchema = createInsertSchema(formDatas).pick({
  formId: true,
  data: true,
});

export type FormData = z.infer<typeof ZSelectFormDataSchema>;
