import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';

let genAI: GoogleGenerativeAI | null = null;

export const getGeminiClient = (): GoogleGenerativeAI => {
  if (!genAI) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
};
