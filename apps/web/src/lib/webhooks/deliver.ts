import type { WebhookPayload } from '@formbase/api/lib/webhook';

const WEBHOOK_TIMEOUT_MS = 10000;

async function signBody(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function deliverWebhook({
  webhookUrl,
  payload,
  secret,
}: {
  webhookUrl: string;
  payload: WebhookPayload;
  secret: string | null;
}): Promise<{
  success: boolean;
  statusCode?: number;
  body?: string;
  error?: string;
}> {
  const body = JSON.stringify(payload);
  const timestamp = String(Date.now());
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Formbase-Event': payload.event,
    'X-Formbase-Timestamp': timestamp,
  };

  if (secret) {
    headers['X-Formbase-Signature'] =
      'sha256=' + (await signBody(secret, timestamp + '.' + body));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const responseBody = await response.text();
    return {
      success: response.ok,
      statusCode: response.status,
      body: responseBody,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}
