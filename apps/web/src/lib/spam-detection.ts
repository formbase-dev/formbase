import domains from 'disposable-email-domains';

const disposableDomains = new Set(domains);

export type SpamCheckResult = {
  isSpam: boolean;
  spamReason: string | null;
};

export function checkForSpam(
  formData: Record<string, unknown>,
  honeypotField: string,
): SpamCheckResult {
  if (honeypotField in formData && formData[honeypotField]) {
    return { isSpam: true, spamReason: 'honeypot' };
  }

  const emailValue = formData['email'];
  if (typeof emailValue === 'string' && emailValue.includes('@')) {
    const domain = emailValue.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.has(domain)) {
      return { isSpam: true, spamReason: 'disposable_email' };
    }
  }

  return { isSpam: false, spamReason: null };
}

export function stripHoneypotField(
  formData: Record<string, unknown>,
  honeypotField: string,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(formData).filter(([key]) => key !== honeypotField),
  );
}
