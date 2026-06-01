import type { TransportOptions } from 'nodemailer';

import { env } from '@formbase/env';

export type MessageInfo = {
  to: string;
  subject: string;
  body: string;
};

type MailTransporter = {
  sendMail: (mailOptions: {
    from: string;
    html: string;
    subject: string;
    to: string;
  }) => Promise<unknown>;
};

const from = '"Formbase" <noreply@formbase.dev>';

const createSmtpTransport = async (): Promise<MailTransporter> => {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    throw new Error('Missing SMTP_HOST or SMTP_PORT');
  }
  if ((env.SMTP_USER && !env.SMTP_PASS) || (!env.SMTP_USER && env.SMTP_PASS)) {
    throw new Error('SMTP_USER and SMTP_PASS must both be set');
  }

  const smtpConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.NODE_ENV === 'production',
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  };
  // Dynamic import keeps Node-only nodemailer out of Cloudflare email transport bundles.
  const { createTransport } = await import('nodemailer');

  return createTransport(smtpConfig as TransportOptions);
};

let cachedTransporter: MailTransporter | null = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (env.NODE_ENV === 'test') {
    // Dynamic import keeps Node-only nodemailer out of Cloudflare email transport bundles.
    const { createTransport } = await import('nodemailer');
    cachedTransporter = createTransport({
      name: 'noop',
      version: '1.0.0',
      send: (_mail, callback) => {
        callback(null, {
          accepted: [],
          envelope: { from: '', to: [] },
          messageId: 'test-message-id',
          pending: [],
          rejected: [],
          response: '250 ok',
        });
      },
    });
    return cachedTransporter;
  }

  const hasSmtpConfig =
    env.SMTP_TRANSPORT === 'smtp' ||
    !!env.SMTP_HOST ||
    !!env.SMTP_PORT ||
    !!env.SMTP_USER ||
    !!env.SMTP_PASS;

  if (!hasSmtpConfig) {
    throw new Error(
      'Email transport not configured. Set SMTP_TRANSPORT to cloudflare or smtp.',
    );
  }

  cachedTransporter = await createSmtpTransport();
  return cachedTransporter;
};

const sendCloudflareMail = async ({
  to,
  subject,
  body,
}: MessageInfo): Promise<unknown> => {
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    throw new Error('Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID');
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM ?? from,
        to,
        subject,
        html: body,
      }),
    },
  );
  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    errors?: Array<{ message?: unknown }>;
  } | null;

  if (!response.ok || result?.success !== true) {
    const errorMessage = result?.errors?.[0]?.message;
    const message =
      typeof errorMessage === 'string'
        ? errorMessage
        : `Cloudflare email request failed with status ${response.status}`;

    throw new Error(message);
  }

  return result;
};

export const sendMail = async ({
  to,
  subject,
  body,
}: MessageInfo): Promise<unknown> => {
  if (env.SMTP_TRANSPORT === 'cloudflare') {
    return sendCloudflareMail({ to, subject, body });
  }

  const transporter = await getTransporter();
  const mailOptions = {
    from,
    to,
    subject,
    html: body,
  };
  return transporter.sendMail(mailOptions);
};
