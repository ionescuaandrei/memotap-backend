import { getGeminiClient, rotateToNextKey, isQuotaError } from '../config/gemini';
import { config } from '../config/env';
import { AIExtractionResult } from '../types';

const MAX_RETRIES = 5; // Maximum number of key rotations to try

// Get today's date and current time for context in AI prompts
const getTodayContext = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  // Using day index (0=Sunday, 1=Monday, etc.) to let AI interpret in any language
  const dayIndex = now.getDay();
  return `Today's date is ${date} (day of week index: ${dayIndex}, where 0=Sunday, 1=Monday, ..., 6=Saturday). Current time is ${hours}:${minutes}.`;
};

// Wrapper to execute Gemini calls with automatic key rotation on quota errors
const executeWithRetry = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isQuotaError(error)) {
        const rotated = rotateToNextKey();
        if (!rotated) {
          throw new Error('All Gemini API keys have been exhausted. Please try again later.');
        }
        // Continue to next attempt with new key
      } else {
        // Non-quota error, throw immediately
        throw error;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

// Transcribe audio using Gemini
export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  return executeWithRetry(async () => {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64,
        },
      },
      {
        text: 'Transcribe this audio recording exactly as spoken. Only output the transcription, nothing else.',
      },
    ]);

    const response = result.response;
    const transcription = response.text().trim();

    return transcription;
  });
};

// Extract structured data from transcription using Gemini
export const extractStructuredData = async (
  transcription: string
): Promise<AIExtractionResult> => {
  return executeWithRetry(async () => {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: config.geminiModel });

    const prompt = `${getTodayContext()}

You are a multilingual assistant. Your task is to extract structured data from a voice transcription.

**CRITICAL LANGUAGE RULE**: You MUST output all text content (task descriptions, note titles, note content, reminder messages) in the EXACT SAME LANGUAGE as the transcription. If the transcription is in Romanian, output Romanian. If it's in Spanish, output Spanish. NEVER translate to English. Preserve the original language exactly.

Analyze the following voice transcription and extract structured data into these categories:

1. **Tasks**: Action items to do
   - task: The task description (KEEP ORIGINAL LANGUAGE - do NOT translate)
   - day: ISO format date (YYYY-MM-DD)
   - hour: 24h time (HH:MM) if specified, otherwise null

2. **Notes**: Ideas, thoughts, information to remember
   - title: Short title (KEEP ORIGINAL LANGUAGE - do NOT translate)
   - content: Full content (KEEP ORIGINAL LANGUAGE - do NOT translate)

3. **Reminders**: Time-sensitive notifications
   - message: Reminder text (KEEP ORIGINAL LANGUAGE - do NOT translate)
   - remindAt: ISO datetime (YYYY-MM-DDTHH:MM:SS)

Rules:
- Default task date: today
- Default reminder time: 09:00
- Understand dates in any language ("mâine" = tomorrow, "săptămâna viitoare" = next week, etc.)

Transcription:
"${transcription}"

JSON response only (no markdown):
{
  "tasks": [{ "task": "string in original language", "day": "YYYY-MM-DD", "hour": "HH:MM or null" }],
  "notes": [{ "title": "string in original language", "content": "string in original language" }],
  "reminders": [{ "message": "string in original language", "remindAt": "YYYY-MM-DDTHH:MM:SS" }]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Remove markdown code blocks if present
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    try {
      const parsed = JSON.parse(text) as AIExtractionResult;

      // Validate and ensure arrays exist
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', text);
      console.error('Parse error:', error);

      // Return empty result on parse failure
      return {
        tasks: [],
        notes: [],
        reminders: [],
      };
    }
  });
};

// Combined function: transcribe and extract in one call
export const processAudioRecording = async (
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ transcription: string; extracted: AIExtractionResult }> => {
  // Step 1: Transcribe audio
  const transcription = await transcribeAudio(audioBuffer, mimeType);

  if (!transcription || transcription.length === 0) {
    return {
      transcription: '',
      extracted: { tasks: [], notes: [], reminders: [] },
    };
  }

  // Step 2: Extract structured data from transcription
  const extracted = await extractStructuredData(transcription);

  return { transcription, extracted };
};
