import dotenv from 'dotenv';

dotenv.config();

// Parse multiple Gemini API keys from comma-separated string
const parseGeminiApiKeys = (): string[] => {
  const keysString = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysString
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKeys: parseGeminiApiKeys(),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};
