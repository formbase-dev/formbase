import type { Client } from '@libsql/client';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

import { createClient } from '@libsql/client';
import {
  and,
  count,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';

import { getDatabaseCredentials } from './credentials';
import * as schema from './schema';

let queryClientInstance: Client | undefined;

const getQueryClient = () => {
  queryClientInstance ??= createClient(getDatabaseCredentials());
  return queryClientInstance;
};

export const queryClient = new Proxy({} as Client, {
  get(_target, property) {
    const client = getQueryClient();
    const value: unknown = Reflect.get(client, property);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
  set(_target, property, value) {
    return Reflect.set(getQueryClient(), property, value);
  },
});

const createDb = () =>
  drizzle(queryClient, {
    schema: schema,
  });

type Database = LibSQLDatabase<typeof schema>;

let dbInstance: Database | undefined;

const getDb = () => {
  dbInstance ??= createDb();
  return dbInstance;
};

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const database = getDb();
    const value: unknown = Reflect.get(database, property);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(database)
      : value;
  },
  set(_target, property, value) {
    return Reflect.set(getDb(), property, value);
  },
});

export const drizzlePrimitives = {
  eq,
  and,
  or,
  count,
  sql,
  gt,
  gte,
  lt,
  lte,
  inArray,
  isNull,
};
