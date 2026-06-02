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

  const isIpv6Literal = hostname.startsWith('[') && hostname.endsWith(']');
  const host = isIpv6Literal ? hostname.slice(1, -1) : hostname;

  if (isIpv6Literal) {
    if (
      host === '::1' ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe8') ||
      host.startsWith('fe9') ||
      host.startsWith('fea') ||
      host.startsWith('feb')
    ) {
      return false;
    }
  }

  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.startsWith('127.') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.')
  ) {
    return false;
  }

  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) {
    return false;
  }

  const match172 = /^172\.(\d{1,3})\./.exec(host);
  if (match172) {
    const secondOctet = Number(match172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return false;
  }

  return true;
}
