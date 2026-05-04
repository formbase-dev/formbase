import { env } from '@formbase/env';
import { generateId } from '@formbase/utils/generate-id';

type FormData = Record<string, Blob | string | undefined>;

type StorageConfig = {
  accessKey: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  port: number;
  region: string;
  secretKey: string;
  useSSL: boolean;
};

type PresignedHeaders = Record<string, string>;

const encoder = new TextEncoder();
const presignedUrlExpirySeconds = 60 * 5;

const encodeRfc3986 = (value: string) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const encodePath = (value: string) =>
  value.split('/').map(encodeRfc3986).join('/');

const compareCanonicalValue = (left: string, right: string) => {
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

async function hmac(key: ArrayBuffer | Uint8Array | string, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? encoder.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value));
}

async function sha256(value: string) {
  return crypto.subtle.digest('SHA-256', encoder.encode(value));
}

async function createSigningKey({
  dateStamp,
  region,
  secretKey,
}: {
  dateStamp: string;
  region: string;
  secretKey: string;
}) {
  const dateKey = await hmac(`AWS4${secretKey}`, dateStamp);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

const createCanonicalQuery = (params: Record<string, string>) =>
  Object.entries(params)
    .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyComparison = compareCanonicalValue(leftKey, rightKey);
      return keyComparison === 0
        ? compareCanonicalValue(leftValue, rightValue)
        : keyComparison;
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

const createCanonicalHeaders = (headers: PresignedHeaders) => {
  const entries = Object.entries(headers)
    .map(
      ([key, value]) =>
        [key.trim().toLowerCase(), value.trim().replace(/\s+/g, ' ')] as const,
    )
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyComparison = compareCanonicalValue(leftKey, rightKey);
      return keyComparison === 0
        ? compareCanonicalValue(leftValue, rightValue)
        : keyComparison;
    });

  return {
    canonicalHeaders: entries
      .map(([key, value]) => `${key}:${value}\n`)
      .join(''),
    signedHeaders: entries.map(([key]) => key).join(';'),
  };
};

const formatAmzDate = (date: Date) =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, '');

const getStorageRegion = (endpoint: string) =>
  env.STORAGE_REGION ??
  (endpoint.endsWith('.r2.cloudflarestorage.com') ? 'auto' : 'us-east-1');

const getStorageForcePathStyle = (endpoint: string) =>
  env.STORAGE_FORCE_PATH_STYLE ??
  (endpoint === 'localhost' ||
    endpoint.startsWith('127.') ||
    endpoint.endsWith('.r2.cloudflarestorage.com'));

const getStorageConfig = (): StorageConfig => {
  if (
    !env.STORAGE_ENDPOINT ||
    env.STORAGE_PORT === undefined ||
    env.STORAGE_USESSL === undefined ||
    !env.STORAGE_ACCESS_KEY ||
    !env.STORAGE_SECRET_KEY ||
    !env.STORAGE_BUCKET
  ) {
    throw new Error('Storage is not configured');
  }

  return {
    accessKey: env.STORAGE_ACCESS_KEY,
    bucket: env.STORAGE_BUCKET,
    endpoint: env.STORAGE_ENDPOINT,
    forcePathStyle: getStorageForcePathStyle(env.STORAGE_ENDPOINT),
    port: env.STORAGE_PORT,
    region: getStorageRegion(env.STORAGE_ENDPOINT),
    secretKey: env.STORAGE_SECRET_KEY,
    useSSL: env.STORAGE_USESSL,
  };
};

const getStorageOrigin = ({ endpoint, port, useSSL }: StorageConfig) => {
  const url = new URL(`${useSSL ? 'https' : 'http'}://${endpoint}`);
  url.port = String(port);
  return url.origin;
};

const createStorageUrl = (config: StorageConfig, key?: string) => {
  if (!config.forcePathStyle) {
    return new URL(
      `${getStorageOrigin({
        ...config,
        endpoint: `${config.bucket}.${config.endpoint}`,
      })}${key ? `/${encodePath(key)}` : ''}`,
    );
  }

  return new URL(
    `${getStorageOrigin(config)}/${encodePath(config.bucket)}${
      key ? `/${encodePath(key)}` : ''
    }`,
  );
};

const createFileUrl = (key: string) =>
  new URL(`/api/files/${encodePath(key)}`, env.NEXT_PUBLIC_APP_URL).toString();

async function createPresignedUrl({
  config,
  expiresIn = presignedUrlExpirySeconds,
  headers = {},
  key,
  method,
}: {
  config: StorageConfig;
  expiresIn?: number;
  headers?: PresignedHeaders;
  key?: string;
  method: 'GET' | 'PUT';
}) {
  const date = new Date();
  const amzDate = formatAmzDate(date);
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const url = createStorageUrl(config, key);
  const { canonicalHeaders, signedHeaders } = createCanonicalHeaders({
    host: url.host,
    ...headers,
  });
  const query = createCanonicalQuery({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKey}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeaders,
  });
  const canonicalRequest = [
    method,
    url.pathname,
    query,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    toHex(await sha256(canonicalRequest)),
  ].join('\n');
  const signingKey = await createSigningKey({
    dateStamp,
    region: config.region,
    secretKey: config.secretKey,
  });
  const signature = toHex(await hmac(signingKey, stringToSign));

  url.search = `${query}&X-Amz-Signature=${signature}`;
  return url.toString();
}

export function createFileDownloadUrl(
  key: string,
  expiresIn = presignedUrlExpirySeconds,
) {
  return createPresignedUrl({
    config: getStorageConfig(),
    expiresIn,
    key,
    method: 'GET',
  });
}

async function sendStorageRequest({
  body,
  config,
  headers,
  key,
  method,
}: {
  body?: BodyInit;
  config: StorageConfig;
  headers?: PresignedHeaders;
  key?: string;
  method: 'PUT';
}) {
  const url = await createPresignedUrl({ config, headers, key, method });
  return fetch(url, { body, headers, method });
}

const getFileExtension = (mimetype: string) => {
  const subtype = mimetype.split('/')[1];
  return subtype?.split('+').at(0) ?? 'bin';
};

export async function uploadFile(file: BodyInit, mimetype: string) {
  const config = getStorageConfig();
  const name = `${generateId(15)}.${getFileExtension(mimetype)}`;
  const contentType = mimetype || 'application/octet-stream';

  const response = await sendStorageRequest({
    body: file,
    config,
    headers: {
      'Content-Type': contentType,
    },
    key: name,
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed with status ${response.status}`);
  }

  return createFileUrl(name);
}

export async function uploadFileFromBlob({
  file,
}: {
  file: Blob;
}): Promise<string> {
  return uploadFile(file, file.type);
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
