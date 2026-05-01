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

export const queryClient = createClient(getDatabaseCredentials());

export const db = drizzle(queryClient, {
  schema: schema,
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
