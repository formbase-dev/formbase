import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const smtp = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('nodemailer', () => ({ createTransport: smtp.createTransport }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('SMTP_TRANSPORT', undefined);
  smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail });
  smtp.sendMail.mockResolvedValue({ messageId: 'auth-local-message' });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Auth email delivery through the shared mailer', () => {
  it.each([
    ['sendVerificationEmail', 'Verify your email', 'Verify email'],
    ['sendResetPasswordEmail', 'Reset your password', 'Reset password'],
  ] as const)(
    'sends %s with the expected recipient and link',
    async (name, subject, label) => {
      const authEmail = await import('../../packages/auth/email');
      const url = 'https://forms.example/auth/callback?token=local-test-token';

      await expect(
        authEmail[name]({ email: 'account+auth@example.com', url }),
      ).resolves.toBeUndefined();

      expect(smtp.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'noop', version: '1.0.0' }),
      );
      expect(smtp.sendMail).toHaveBeenCalledWith({
        from: '"Formbase" <noreply@formbase.dev>',
        to: 'account+auth@example.com',
        subject,
        html: expect.stringContaining(`<a href="${url}">${label}</a>`),
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each(['sendVerificationEmail', 'sendResetPasswordEmail'] as const)(
    'rejects an invalid auth recipient in %s before transport initialization',
    async (name) => {
      const authEmail = await import('../../packages/auth/email');

      await expect(
        authEmail[name]({
          email: 'one@example.com,two@example.com',
          url: 'https://forms.example/auth/callback',
        }),
      ).rejects.toThrow();

      expect(smtp.createTransport).not.toHaveBeenCalled();
      expect(smtp.sendMail).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('propagates transport errors to the auth flow', async () => {
    smtp.sendMail.mockRejectedValue(new Error('Local transport failure'));
    const { sendResetPasswordEmail } =
      await import('../../packages/auth/email');

    await expect(
      sendResetPasswordEmail({
        email: 'account@example.com',
        url: 'https://forms.example/reset-password',
      }),
    ).rejects.toThrow('Local transport failure');
  });
});
