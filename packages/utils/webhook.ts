export function isValidWebhookUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const isProduction = process.env['NODE_ENV'] === 'production';

  if (!isProduction) {
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:') {
      return hostname === 'localhost' || hostname === '127.0.0.1';
    }
    return false;
  }

  if (parsed.protocol !== 'https:') return false;

  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return false;
  }

  if (
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('169.254.')
  ) {
    return false;
  }

  const match172 = /^172\.(\d{1,3})\./.exec(hostname);
  if (match172) {
    const secondOctet = Number(match172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return false;
  }

  return true;
}
