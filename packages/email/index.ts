import type { TransportOptions } from 'nodemailer';

import { ResendTransport } from '@documenso/nodemailer-resend';
import { createTransport } from 'nodemailer';

import { env } from '@formbase/env';

export type MessageInfo = {
  to: string;
  subject: string;
  body: string;
};

const createSmtpTransport = () => {
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

  return createTransport(smtpConfig as TransportOptions);
};

let cachedTransporter: ReturnType<typeof createTransport> | null = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  // Use noop transport in test environment
  if (env.NODE_ENV === 'test') {
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

  if (env.SMTP_TRANSPORT === 'resend') {
    if (!env.RESEND_API_KEY) {
      throw new Error('Missing RESEND_API_KEY');
    }

    cachedTransporter = createTransport(
      ResendTransport.makeTransport({
        apiKey: env.RESEND_API_KEY,
      }),
    );
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
      'Email transport not configured. Set SMTP_TRANSPORT to resend or smtp.',
    );
  }

  cachedTransporter = createSmtpTransport();
  return cachedTransporter;
};

export const sendMail = async ({ to, subject, body }: MessageInfo) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: '"Formbase" <noreply@formbase.dev>',
    to,
    subject,
    html: body,
  };
  return transporter.sendMail(mailOptions);
};
