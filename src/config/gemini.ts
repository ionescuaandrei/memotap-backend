import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';

// Track current key index and failed keys
let currentKeyIndex = 0;
const failedKeys = new Set<number>();

// Cache clients for each key
const clientCache = new Map<number, GoogleGenerativeAI>();

/**
 * Get the current Gemini API key
 */
export const getCurrentApiKey = (): string => {
  if (config.geminiApiKeys.length === 0) {
    throw new Error('No GEMINI_API_KEYS defined in environment variables');
  }
  return config.geminiApiKeys[currentKeyIndex]!;
};

/**
 * Get a Gemini client for the current API key
 */
export const getGeminiClient = (): GoogleGenerativeAI => {
  if (config.geminiApiKeys.length === 0) {
    throw new Error('No GEMINI_API_KEYS defined in environment variables');
  }

  // Check if all keys have failed
  if (failedKeys.size >= config.geminiApiKeys.length) {
    throw new Error('All Gemini API keys have been exhausted');
  }

  // Get or create client for current key
  if (!clientCache.has(currentKeyIndex)) {
    const apiKey = config.geminiApiKeys[currentKeyIndex]!;
    clientCache.set(currentKeyIndex, new GoogleGenerativeAI(apiKey));
  }

  return clientCache.get(currentKeyIndex)!;
};

/**
 * Mark current key as failed and rotate to next available key
 * Returns true if rotation was successful, false if all keys exhausted
 */
export const rotateToNextKey = (): boolean => {
  console.log(`Gemini API key ${currentKeyIndex + 1} exhausted, rotating...`);
  failedKeys.add(currentKeyIndex);

  // Find next available key
  for (let i = 0; i < config.geminiApiKeys.length; i++) {
    const nextIndex = (currentKeyIndex + 1 + i) % config.geminiApiKeys.length;
    if (!failedKeys.has(nextIndex)) {
      currentKeyIndex = nextIndex;
      console.log(`Rotated to Gemini API key ${currentKeyIndex + 1} of ${config.geminiApiKeys.length}`);
      return true;
    }
  }

  console.error('All Gemini API keys have been exhausted!');
  return false;
};

/**
 * Check if an error is a quota/rate limit error that should trigger key rotation
 */
export const isQuotaError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('quota') ||
      message.includes('rate limit') ||
      message.includes('resource exhausted') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }
  return false;
};

/**
 * Get status of all API keys
 */
export const getKeysStatus = (): {
  total: number;
  current: number;
  failed: number[];
  available: number;
} => {
  return {
    total: config.geminiApiKeys.length,
    current: currentKeyIndex + 1,
    failed: Array.from(failedKeys).map((i) => i + 1),
    available: config.geminiApiKeys.length - failedKeys.size,
  };
};
