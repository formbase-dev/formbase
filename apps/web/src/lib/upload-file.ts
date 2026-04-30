import { Client } from 'minio';

import { env } from '@formbase/env';
import { generateId } from '@formbase/utils/generate-id';

type FormData = Record<string, Blob | string | undefined>;

let client: Client | null = null;

const getClient = () => {
  if (client) return client;
  if (
    !env.STORAGE_ENDPOINT ||
    env.STORAGE_PORT === undefined ||
    env.STORAGE_USESSL === undefined ||
    !env.STORAGE_ACCESS_KEY ||
    !env.STORAGE_SECRET_KEY
  ) {
    throw new Error('Storage is not configured');
  }
  client = new Client({
    endPoint: env.STORAGE_ENDPOINT,
    port: env.STORAGE_PORT,
    useSSL: env.STORAGE_USESSL,
    accessKey: env.STORAGE_ACCESS_KEY,
    secretKey: env.STORAGE_SECRET_KEY,
  });
  return client;
};

async function ensureBucket(bucketName: string) {
  const c = getClient();
  if (!(await c.bucketExists(bucketName))) {
    await c.makeBucket(bucketName);
  }
}

export async function uploadFile(fileBuffer: Buffer, mimetype: string) {
  const c = getClient();
  const bucket = env.STORAGE_BUCKET;

  if (!bucket) {
    throw new Error('Storage bucket is not configured');
  }

  const name = `${generateId(15)}.${mimetype.split('/')[1]}`;

  await ensureBucket(bucket);
  await c.putObject(bucket, name, fileBuffer);

  return c.presignedUrl('GET', bucket, name);
}

export async function uploadFileFromBlob({
  file,
}: {
  file: Blob;
}): Promise<string> {
  const response = new Response(file);
  const buffer = await response.arrayBuffer();
  return uploadFile(Buffer.from(buffer), file.type);
}

export function assignFileOrImage({
  formData,
  key,
  fileUrl,
}: {
  formData: FormData;
  key: string;
  fileUrl: string;
}): void {
  const isImage =
    formData[key] instanceof Blob && formData[key].type.startsWith('image/');
  const field = isImage ? 'image' : 'file';
  formData[field] = fileUrl;

  if (key !== 'file' && key !== 'image') {
    formData[key] = undefined;
  }
}
