import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config/env';
import { S3UploadOptions, S3UploadResult } from '../types';

let s3Client: S3Client | null = null;

const ensureProtocol = (value: string): string => {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const getNormalizedEndpoint = (): string => {
  const endpoint = config.s3.endpoint;

  if (!endpoint) {
    throw new Error('S3 is not configured. Missing S3_API_HOST.');
  }

  return ensureProtocol(endpoint);
};

const assertS3Enabled = (): void => {
  if (!config.s3.enabled) {
    throw new Error(
      'S3 is not configured. Set S3_API_HOST, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.'
    );
  }
};

const resolveBucket = (bucket?: string): string => {
  const resolvedBucket = bucket || config.s3.defaultBucket;

  if (!resolvedBucket) {
    throw new Error('No S3 bucket provided. Set S3_BUCKET or pass bucket explicitly.');
  }

  return resolvedBucket;
};

export const isS3Configured = (): boolean => config.s3.enabled;

export const getS3Client = (): S3Client => {
  assertS3Enabled();

  if (!s3Client) {
    s3Client = new S3Client({
      region: config.s3.region,
      endpoint: getNormalizedEndpoint(),
      forcePathStyle: config.s3.forcePathStyle,
      credentials: {
        accessKeyId: config.s3.accessKeyId!,
        secretAccessKey: config.s3.secretAccessKey!,
      },
    });
  }

  return s3Client;
};

export const getS3ObjectUrl = (key: string, bucket?: string): string => {
  const resolvedBucket = resolveBucket(bucket);
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  if (config.s3.publicBaseUrl) {
    const baseUrl = config.s3.publicBaseUrl.replace(/\/+$/, '');
    return `${baseUrl}/${encodedKey}`;
  }

  const endpoint = new URL(getNormalizedEndpoint());

  if (config.s3.forcePathStyle) {
    endpoint.pathname = `/${resolvedBucket}/${encodedKey}`;
    return endpoint.toString();
  }

  endpoint.hostname = `${resolvedBucket}.${endpoint.hostname}`;
  endpoint.pathname = `/${encodedKey}`;
  return endpoint.toString();
};

export const uploadBufferToS3 = async ({
  bucket,
  key,
  body,
  contentType,
  cacheControl,
  contentDisposition,
  metadata,
}: S3UploadOptions): Promise<S3UploadResult> => {
  const resolvedBucket = resolveBucket(bucket);
  const client = getS3Client();

  const result = await client.send(
    new PutObjectCommand({
      Bucket: resolvedBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      ContentDisposition: contentDisposition,
      Metadata: metadata,
    })
  );

  return {
    bucket: resolvedBucket,
    key,
    etag: result.ETag,
    url: getS3ObjectUrl(key, resolvedBucket),
  };
};

export const deleteS3Object = async (key: string, bucket?: string): Promise<void> => {
  const resolvedBucket = resolveBucket(bucket);
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: resolvedBucket,
      Key: key,
    })
  );
};
