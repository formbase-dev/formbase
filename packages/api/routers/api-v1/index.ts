import { formsRouter } from './forms';
import { submissionsRouter } from './submissions';
import { createApiV1Caller, createApiV1Router } from './trpc';

export const apiV1Router = createApiV1Router({
  forms: formsRouter,
  submissions: submissionsRouter,
});

export type ApiV1Router = typeof apiV1Router;

export const createApiV1CallerFactory = createApiV1Caller(apiV1Router);

export { createApiV1Context, type ApiV1Context } from './trpc';
