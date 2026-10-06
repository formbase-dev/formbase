import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('SMTP_TRANSPORT', undefined);
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Installed Nodemailer compatibility without network access', () => {
  it('uses the application noop transport with the installed Nodemailer API', async () => {
    const { sendMail } = await import('../../packages/email/index');

    await expect(
      sendMail({
        to: 'local+test@example.com',
        subject: 'Offline API compatibility',
        body: '<p>Local fixture only</p>',
      }),
    ).resolves.toEqual({
      accepted: [],
      envelope: { from: '', to: [] },
      messageId: 'test-message-id',
      pending: [],
      rejected: [],
      response: '250 ok',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('parses a bounded nested-comment fixture with a custom local transport', async () => {
    const { createTransport } = await import('nodemailer');
    const envelopes: Array<{ from: string | false; to: string[] }> = [];
    const transporter = createTransport({
      name: 'local-fixture',
      version: '1.0.0',
      send: (mail, callback) => {
        const envelope = mail.message.getEnvelope();
        envelopes.push(envelope);
        callback(null, {
          accepted: envelope.to,
          rejected: [],
          envelope,
          messageId: 'bounded-local-fixture',
          response: '250 local fixture',
        });
      },
    });
    const comments = `${'('.repeat(16)}local comment${')'.repeat(16)}`;

    await expect(
      transporter.sendMail({
        from: 'Formbase <noreply@example.com>',
        to: `Recipient ${comments} <recipient+tag@example.com>`,
        subject: 'Bounded parser fixture',
        html: '<p>Local fixture only</p>',
      }),
    ).resolves.toMatchObject({
      accepted: ['recipient+tag@example.com'],
      messageId: 'bounded-local-fixture',
    });

    expect(envelopes).toEqual([
      { from: 'noreply@example.com', to: ['recipient+tag@example.com'] },
    ]);
    expect(fetch).not.toHaveBeenCalled();
    transporter.close();
  });
});
