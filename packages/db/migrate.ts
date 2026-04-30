import 'dotenv/config';

import type { Table } from 'drizzle-orm';

import { getTableName, isTable, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

import { db, queryClient } from './index';
import * as schema from './schema';

const migrationsFolder = './drizzle';
const migrationsTable = '__drizzle_migrations';
const migrations = readMigrationFiles({ migrationsFolder });
const tableNames = (Object.values(schema) as unknown[])
  .filter((value): value is Table => isTable(value))
  .map((table) => getTableName(table));

const getLastMigrationTimestamp = async () => {
  try {
    const rows = await db.values(
      sql`SELECT created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
    );

    return rows[0]?.[0] ?? null;
  } catch {
    return null;
  }
};

const hasAnySchemaTable = async () => {
  if (tableNames.length === 0) {
    return false;
  }

  const tableRefs = tableNames.map((name) => sql`${name}`);
  const rows = await db.values(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${sql.join(tableRefs, sql`, `)})`,
  );

  return rows.length > 0;
};

const isExistingTableError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  return (
    maybeError.code === 'SQL_INPUT_ERROR' &&
    (maybeError.message ?? '').includes('already exists')
  );
};

const baselineMigrations = async () => {
  const latest = migrations.at(-1);

  if (!latest) {
    return;
  }

  await queryClient.execute(`
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  await db.run(
    sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES (${latest.hash}, ${latest.folderMillis})`,
  );

  console.warn('Migrations were baselined to match the current schema.');
};

let baselined = false;
if (
  (await getLastMigrationTimestamp()) === null &&
  (await hasAnySchemaTable())
) {
  await baselineMigrations();
  baselined = true;
}

if (!baselined) {
  try {
    await migrate(db, { migrationsFolder });
  } catch (error) {
    if (isExistingTableError(error)) {
      await baselineMigrations();
    } else {
      throw error;
    }
  }
}

queryClient.close();
