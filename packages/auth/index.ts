import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@formbase/db';
import * as schema from '@formbase/db/schema';
import { env } from '@formbase/env';

import { sendResetPasswordEmail, sendVerificationEmail } from './email';

const createAuth = () => {
  const socialProviders = {
    ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? {
          github: {
            clientId: env.AUTH_GITHUB_ID,
            clientSecret: env.AUTH_GITHUB_SECRET,
          },
        }
      : {}),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? {
          google: {
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
          },
        }
      : {}),
  };

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        ...schema,
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: env.ALLOW_SIGNIN_SIGNUP === 'false',
      sendResetPassword: async ({ user, url }) => {
        await sendResetPasswordEmail({
          email: user.email,
          url,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: !env.SKIP_EMAIL_VERIFICATION,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (env.SKIP_EMAIL_VERIFICATION) return;
        await sendVerificationEmail({
          email: user.email,
          url,
        });
      },
    },
    ...(Object.keys(socialProviders).length > 0 ? { socialProviders } : {}),
    session: {
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
  });
};

type Auth = ReturnType<typeof createAuth>;

let authInstance: Auth | undefined;

const getAuth = () => {
  authInstance ??= createAuth();
  return authInstance;
};

export const auth = new Proxy({} as Auth, {
  get(_target, property) {
    const authClient = getAuth();
    const value = Reflect.get(authClient, property);
    return typeof value === 'function' ? value.bind(authClient) : value;
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
