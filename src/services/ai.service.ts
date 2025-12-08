import { getGeminiClient, rotateToNextKey, isQuotaError } from '../config/gemini';
import { config } from '../config/env';
import { AIExtractionResult } from '../types';

const MAX_RETRIES = 5; // Maximum number of key rotations to try

// Get today's date and current time for context in AI prompts
const getTodayContext = (): string => {
  const now = new Date();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayName = dayNames[now.getDay()];
  const date = now.toISOString().split('T')[0];
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `Today is ${dayName}, ${date}. Current time is ${hours}:${minutes}.`;
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

Analyze the following voice transcription and extract structured data. Categorize the content into:

1. **Tasks**: Action items with specific things to do. Include:
   - task: The task description
   - day: The date in ISO format (YYYY-MM-DD). Use relative dates like "tomorrow", "next Monday" based on today's date.
   - hour: Time in 24h format (HH:MM) - ONLY include this field if a specific time is mentioned or can be calculated (e.g., "at 2:30 PM" = "14:30", "in 3 hours" from current time). If no time is specified, omit this field entirely or set to null.

2. **Notes**: Ideas, thoughts, information to remember that aren't tasks or reminders. Include:
   - title: A short descriptive title (generate one if not explicit)
   - content: The full note content

3. **Reminders**: Things to be reminded about at a specific time/date. Include:
   - message: What to be reminded about
   - remindAt: ISO datetime string (YYYY-MM-DDTHH:MM:SS) for when to send the reminder

Guidelines:
- If no specific date/time is mentioned for a task, use today's date
- If no specific time is mentioned for a reminder, default to 09:00
- Separate content appropriately - one voice recording may contain multiple items
- If content doesn't fit any category, make it a note
- Be smart about understanding natural language dates ("tomorrow", "next week", "in 2 hours")

Transcription:
"${transcription}"

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "tasks": [
    { "task": "string", "day": "YYYY-MM-DD", "hour": "HH:MM or null" }
  ],
  "notes": [
    { "title": "string", "content": "string" }
  ],
  "reminders": [
    { "message": "string", "remindAt": "YYYY-MM-DDTHH:MM:SS" }
  ]
}

For tasks: set "hour" to the calculated time (HH:MM) if a time is specified/calculable, otherwise set to null.
If a category has no items, use an empty array [].`;

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
