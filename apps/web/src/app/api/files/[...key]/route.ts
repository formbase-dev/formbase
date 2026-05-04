import { createFileDownloadUrl } from '~/lib/upload-file';

export const dynamic = 'force-dynamic';

const isFileKey = (key: string) =>
  /^[0-9A-Za-z]{15}\.[+0-9A-Za-z._-]+$/.test(key);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const fileKey = key.join('/');

  if (!isFileKey(fileKey)) {
    return new Response('File not found', { status: 404 });
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      Location: await createFileDownloadUrl(fileKey),
    },
  });
}
