import type { Client } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from '@formbase/db/schema';

let client: Client;
let testDb: LibSQLDatabase<typeof schema>;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER DEFAULT 0 NOT NULL,
  image TEXT,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  updated_at INTEGER,
  return_url TEXT,
  send_email_for_new_submissions INTEGER DEFAULT 1 NOT NULL,
  keys TEXT NOT NULL,
  enable_submissions INTEGER DEFAULT 1 NOT NULL,
  enable_retention INTEGER DEFAULT 1 NOT NULL,
  default_submission_email TEXT,
  honeypot_field TEXT DEFAULT '_gotcha' NOT NULL,
  enable_webhook INTEGER DEFAULT false NOT NULL,
  webhook_url TEXT,
  webhook_secret TEXT,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS form_datas (
  id TEXT PRIMARY KEY NOT NULL,
  form_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  is_spam INTEGER DEFAULT 0 NOT NULL,
  spam_reason TEXT,
  manual_override INTEGER DEFAULT 0 NOT NULL,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id TEXT PRIMARY KEY NOT NULL,
  form_id TEXT NOT NULL,
  form_data_id TEXT,
  webhook_url TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 0 NOT NULL,
  next_retry_at INTEGER,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (form_data_id) REFERENCES form_datas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS onboarding_forms (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  form_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY NOT NULL,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  expires_at INTEGER,
  last_used_at INTEGER,
  created_at INTEGER DEFAULT (cast(unixepoch('subsec') * 1000 as integer)) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_email_idx ON user(email);
CREATE INDEX IF NOT EXISTS session_userId_idx ON session(user_id);
CREATE INDEX IF NOT EXISTS account_userId_idx ON account(user_id);
CREATE INDEX IF NOT EXISTS form_user_idx ON forms(user_id);
CREATE INDEX IF NOT EXISTS form_created_at_idx ON forms(created_at);
CREATE INDEX IF NOT EXISTS form_idx ON form_datas(form_id);
CREATE INDEX IF NOT EXISTS form_data_created_at_idx ON form_datas(created_at);
CREATE INDEX IF NOT EXISTS webhook_log_form_idx ON webhook_delivery_logs(form_id);
CREATE INDEX IF NOT EXISTS webhook_log_status_idx ON webhook_delivery_logs(status);
CREATE INDEX IF NOT EXISTS webhook_log_next_retry_idx ON webhook_delivery_logs(next_retry_at);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
CREATE INDEX IF NOT EXISTS api_key_user_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_key_hash_idx ON api_keys(key_hash);
`;

const RESET_SQL = `
DELETE FROM api_keys;
DELETE FROM webhook_delivery_logs;
DELETE FROM form_datas;
DELETE FROM onboarding_forms;
DELETE FROM forms;
DELETE FROM session;
DELETE FROM account;
DELETE FROM verification;
DELETE FROM user;
`;

export async function setupTestDatabase(): Promise<void> {
  // Use shared in-memory database - matches DATABASE_URL env var set in vitest.setup.ts
  client = createClient({
    url: 'file::memory:?cache=shared',
  });
  testDb = drizzle(client, { schema });

  // Create schema - execute each statement separately
  const statements = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
}

export async function resetDatabase(): Promise<void> {
  // Delete data in correct order to respect foreign keys
  const statements = RESET_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await client.execute(stmt);
  }
}

export async function teardownTestDatabase(): Promise<void> {
  client.close();
}

export function getTestDb(): LibSQLDatabase<typeof schema> {
  return testDb;
}

export function getTestClient(): Client {
  return client;
}
