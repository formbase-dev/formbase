import { sendMail } from '@formbase/email';

export const sendVerificationEmail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  await sendMail({
    to: email,
    subject: 'Verify your email',
    body: `<p>Click the link to verify your email:</p><p><a href="${url}">Verify email</a></p>`,
  });
};

export const sendResetPasswordEmail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  await sendMail({
    to: email,
    subject: 'Reset your password',
    body: `<p>Click the link to reset your password:</p><p><a href="${url}">Reset password</a></p>`,
  });
};
