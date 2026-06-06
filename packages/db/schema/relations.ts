import { relations } from 'drizzle-orm';

import { accounts } from './accounts';
import { apiAuditLogs } from './api-audit-logs';
import { apiKeys } from './api-keys';
import { formDatas } from './form-data';
import { forms } from './forms';
import { sessions } from './sessions';
import { users } from './users';
import { webhookDeliveryLogs } from './webhook-delivery-logs';

export const userRelations = relations(users, ({ many }) => ({
  forms: many(forms),
  sessions: many(sessions),
  accounts: many(accounts),
  apiKeys: many(apiKeys),
}));

export const apiKeyRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  auditLogs: many(apiAuditLogs),
}));

export const apiAuditLogRelations = relations(apiAuditLogs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiAuditLogs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const formRelations = relations(forms, ({ one, many }) => ({
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
  }),
  formData: many(formDatas),
  webhookDeliveryLogs: many(webhookDeliveryLogs),
}));

export const formDataRelations = relations(formDatas, ({ one }) => ({
  form: one(forms, {
    fields: [formDatas.formId],
    references: [forms.id],
  }),
}));

export const webhookDeliveryLogRelations = relations(
  webhookDeliveryLogs,
  ({ one }) => ({
    form: one(forms, {
      fields: [webhookDeliveryLogs.formId],
      references: [forms.id],
    }),
    formData: one(formDatas, {
      fields: [webhookDeliveryLogs.formDataId],
      references: [formDatas.id],
    }),
  }),
);
