import dotenv from 'dotenv';

dotenv.config();

const getTrimmedEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

// Parse multiple Gemini API keys from comma-separated string
const parseGeminiApiKeys = (): string[] => {
  const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysString
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
};

const rawS3Config = {
  endpoint: getTrimmedEnv('S3_API_HOST') || getTrimmedEnv('S3_ENDPOINT'),
  accessKeyId: getTrimmedEnv('S3_ACCESS_KEY_ID'),
  secretAccessKey: getTrimmedEnv('S3_SECRET_ACCESS_KEY'),
  region: getTrimmedEnv('S3_REGION') || 'us-east-1',
  defaultBucket: getTrimmedEnv('S3_BUCKET'),
  publicBaseUrl: getTrimmedEnv('S3_PUBLIC_BASE_URL'),
  forcePathStyle: (getTrimmedEnv('S3_FORCE_PATH_STYLE') || 'false').toLowerCase() === 'true',
};

const hasAnyS3Value = [
  rawS3Config.endpoint,
  rawS3Config.accessKeyId,
  rawS3Config.secretAccessKey,
].some(Boolean);

const hasAllRequiredS3Values = [
  rawS3Config.endpoint,
  rawS3Config.accessKeyId,
  rawS3Config.secretAccessKey,
].every(Boolean);

if (hasAnyS3Value && !hasAllRequiredS3Values) {
  throw new Error(
    'Incomplete S3 configuration. Set S3_API_HOST, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY together.'
  );
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKeys: parseGeminiApiKeys(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  s3: {
    enabled: hasAllRequiredS3Values,
    endpoint: rawS3Config.endpoint,
    accessKeyId: rawS3Config.accessKeyId,
    secretAccessKey: rawS3Config.secretAccessKey,
    region: rawS3Config.region,
    defaultBucket: rawS3Config.defaultBucket,
    publicBaseUrl: rawS3Config.publicBaseUrl,
    forcePathStyle: rawS3Config.forcePathStyle,
  },
};
