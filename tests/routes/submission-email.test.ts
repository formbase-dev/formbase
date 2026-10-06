import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  deferred: [] as Array<() => Promise<void>>,
  getForm: vi.fn(),
  getUser: vi.fn(),
  setFormData: vi.fn(),
  checkForSpam: vi.fn(),
  renderEmail: vi.fn(),
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('next/server', () => ({
  after: mocks.after,
  userAgent: () => ({ browser: {} }),
}));
vi.mock('~/lib/trpc/server', () => ({
  api: {
    form: { getFormById: mocks.getForm },
    user: { getUserById: mocks.getUser },
    formData: { setFormData: mocks.setFormData },
  },
}));
vi.mock('~/lib/email/templates/new-submission', () => ({
  renderNewSubmissionEmail: mocks.renderEmail,
}));
vi.mock('~/lib/spam-detection', () => ({
  checkForSpam: mocks.checkForSpam,
  stripHoneypotField: (data: Record<string, unknown>, field: string) =>
    Object.fromEntries(Object.entries(data).filter(([key]) => key !== field)),
}));
vi.mock('~/lib/upload-file', () => ({
  assignFileOrImage: vi.fn(),
  uploadFileFromBlob: vi.fn(),
}));
vi.mock('nodemailer', () => ({ createTransport: mocks.createTransport }));

const form = {
  id: 'local-form',
  userId: 'local-owner',
  title: 'Contact us',
  keys: ['name'],
  honeypotField: '_gotcha',
  enableEmailNotifications: true,
  defaultSubmissionEmail: 'notifications@example.com' as string | null,
};

const submit = async (data = { name: 'Local test', _gotcha: '' }) => {
  const { POST } = await import('../../apps/web/src/app/api/s/[id]/route');
  return POST(
    new Request('https://forms.example/api/s/local-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    { params: Promise.resolve({ id: 'local-form' }) },
  );
};

const runNotifications = async () => {
  for (const callback of mocks.deferred) await callback();
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.deferred.length = 0;
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('SMTP_TRANSPORT', undefined);
  vi.stubGlobal('fetch', vi.fn());
  mocks.after.mockImplementation((callback: () => Promise<void>) => {
    mocks.deferred.push(callback);
  });
  mocks.getForm.mockResolvedValue({ ...form });
  mocks.getUser.mockResolvedValue({ email: 'owner@example.com' });
  mocks.setFormData.mockResolvedValue(undefined);
  mocks.checkForSpam.mockReturnValue({ isSpam: false, spamReason: undefined });
  mocks.renderEmail.mockResolvedValue('<p>Submission notification</p>');
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
  mocks.sendMail.mockResolvedValue({ messageId: 'local-submission-email' });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Submission notification email', () => {
  it('sends to the configured recipient after the submission response', async () => {
    const response = await submit();

    expect(response.status).toBe(200);
    expect(mocks.setFormData).toHaveBeenCalledWith({
      data: { name: 'Local test' },
      formId: form.id,
      keys: ['name'],
      isSpam: false,
      spamReason: undefined,
    });
    expect(mocks.after).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).not.toHaveBeenCalled();

    await runNotifications();

    expect(mocks.getUser).toHaveBeenCalledWith({ userId: form.userId });
    expect(mocks.renderEmail).toHaveBeenCalledWith({
      formTitle: form.title,
      submissionData: { name: 'Local test' },
    });
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: '"Formbase" <noreply@formbase.dev>',
      to: 'notifications@example.com',
      subject: 'New Submission for "Contact us"',
      html: '<p>Submission notification</p>',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('falls back to the owner email when no recipient is configured', async () => {
    mocks.getForm.mockResolvedValue({ ...form, defaultSubmissionEmail: null });

    expect((await submit()).status).toBe(200);
    await runNotifications();

    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@example.com' }),
    );
  });

  it('stores spam without scheduling or sending a notification', async () => {
    mocks.checkForSpam.mockReturnValue({
      isSpam: true,
      spamReason: 'honeypot',
    });

    expect(
      (await submit({ name: 'Local test', _gotcha: 'filled' })).status,
    ).toBe(200);
    await runNotifications();

    expect(mocks.setFormData).toHaveBeenCalledWith(
      expect.objectContaining({ isSpam: true, spamReason: 'honeypot' }),
    );
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('does not send email when notifications are disabled', async () => {
    mocks.getForm.mockResolvedValue({
      ...form,
      enableEmailNotifications: false,
    });

    expect((await submit()).status).toBe(200);
    await runNotifications();

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.renderEmail).not.toHaveBeenCalled();
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('rejects an invalid legacy recipient before transport initialization', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mocks.getForm.mockResolvedValue({
      ...form,
      defaultSubmissionEmail: `${'('.repeat(128)}legacy@example.com${')'.repeat(128)}`,
    });

    expect((await submit()).status).toBe(200);
    await runNotifications();

    expect(error).toHaveBeenCalledWith(
      'Failed to send submission notification email',
      expect.any(Error),
    );
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
