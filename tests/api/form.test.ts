import type { TestSession, TestUser } from '../helpers';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  createAuthenticatedCaller,
  createTestSession,
  createTestUser,
} from '../helpers';

describe('Form API', () => {
  let user: TestUser;
  let session: TestSession;
  let caller: Awaited<ReturnType<typeof createAuthenticatedCaller>>;

  beforeEach(async () => {
    const password = 'Password123!';
    user = await createTestUser({
      email: 'formtest@example.com',
      password,
    });
    session = await createTestSession(user.email, password);
    caller = await createAuthenticatedCaller(user, session);
  });

  describe('form.create', () => {
    it('creates a form with valid input and returns the form ID', async () => {
      const result = await caller.form.create({
        title: 'Contact Form',
        description: 'A contact form for the website',
        returnUrl: 'https://example.com/thank-you',
      });

      expect(result).toHaveProperty('id');
      expect(result.id).toHaveLength(15);
    });
  });

  describe('form.get', () => {
    it('retrieves a form by ID for the owner', async () => {
      const created = await caller.form.create({ title: 'My Form' });
      const form = await caller.form.get({ formId: created.id });

      expect(form).not.toBeNull();
      expect(form?.title).toBe('My Form');
      expect(form?.keys).toEqual(['']);
    });

    it('returns null for nonexistent form', async () => {
      const form = await caller.form.get({ formId: 'nonexistent12345' });
      expect(form).toBeNull();
    });
  });

  describe('form.update', () => {
    it('updates form properties for the owner', async () => {
      const created = await caller.form.create({ title: 'Original Title' });

      await caller.form.update({
        id: created.id,
        title: 'Updated Title',
        description: 'New description',
        enableSubmissions: false,
      });

      const form = await caller.form.get({ formId: created.id });
      expect(form?.title).toBe('Updated Title');
      expect(form?.description).toBe('New description');
    });

    it('updates the notification recipient with a valid single address', async () => {
      const created = await caller.form.create({ title: 'Notifications' });

      await caller.form.update({
        id: created.id,
        defaultSubmissionEmail: 'notifications+contact@example.com',
      });

      const form = await caller.form.get({ formId: created.id });
      expect(form?.defaultSubmissionEmail).toBe(
        'notifications+contact@example.com',
      );
    });

    it('preserves the notification recipient when it is omitted', async () => {
      const created = await caller.form.create({ title: 'Notifications' });
      await caller.form.update({
        id: created.id,
        defaultSubmissionEmail: 'notifications@example.com',
      });

      await caller.form.update({ id: created.id, title: 'Renamed form' });

      const form = await caller.form.get({ formId: created.id });
      expect(form?.title).toBe('Renamed form');
      expect(form?.defaultSubmissionEmail).toBe('notifications@example.com');
    });

    it('accepts a notification recipient at the 254-character limit', async () => {
      const created = await caller.form.create({ title: 'Notifications' });
      const recipient = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;
      expect(recipient).toHaveLength(254);

      await caller.form.update({
        id: created.id,
        defaultSubmissionEmail: recipient,
      });

      const form = await caller.form.get({ formId: created.id });
      expect(form?.defaultSubmissionEmail).toBe(recipient);
    });

    it.each([
      ['empty address', ''],
      ['invalid address', 'not-an-email'],
      ['display name', 'Notifications <notifications@example.com>'],
      ['recipient list', 'first@example.com,second@example.com'],
      ['line feed', 'notifications@example.com\n'],
      ['carriage return', 'notifications@example.com\r'],
      ['null byte', 'notifications\0@example.com'],
      [
        '255-character address',
        `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(62)}`,
      ],
    ])('rejects a %s without changing the form', async (_, recipient) => {
      const created = await caller.form.create({ title: 'Original title' });
      const before = await caller.form.get({ formId: created.id });

      await expect(
        caller.form.update({
          id: created.id,
          title: 'Should not be saved',
          defaultSubmissionEmail: recipient,
        }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

      const after = await caller.form.get({ formId: created.id });
      expect(after).toEqual(before);
    });
  });

  describe('form.delete', () => {
    it('deletes a form owned by the user', async () => {
      const created = await caller.form.create({ title: 'To Delete' });
      await caller.form.delete({ id: created.id });

      const form = await caller.form.get({ formId: created.id });
      expect(form).toBeNull();
    });
  });

  describe('form.list', () => {
    it('lists forms belonging to the user', async () => {
      await caller.form.create({ title: 'Form 1' });
      await caller.form.create({ title: 'Form 2' });
      await caller.form.create({ title: 'Form 3' });

      const result = await caller.form.list({ page: 1, perPage: 10 });

      expect(result).toHaveLength(3);
      // Check all forms exist (order may vary due to same-millisecond creation)
      const titles = result.map((f) => f.title);
      expect(titles).toContain('Form 1');
      expect(titles).toContain('Form 2');
      expect(titles).toContain('Form 3');
    });
  });
});
