import { getGeminiClient } from '../config/gemini';
import { AIExtractionResult } from '../types';

// Get today's date for context in AI prompts
const getTodayContext = (): string => {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[today.getDay()];
  return `Today is ${dayName}, ${today.toISOString().split('T')[0]}.`;
};

// Transcribe audio using Gemini
export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
};

// Extract structured data from transcription using Gemini
export const extractStructuredData = async (
  transcription: string
): Promise<AIExtractionResult> => {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${getTodayContext()}

Analyze the following voice transcription and extract structured data. Categorize the content into:

1. **Tasks**: Action items with specific things to do. Include:
   - task: The task description
   - day: The date in ISO format (YYYY-MM-DD). Use relative dates like "tomorrow", "next Monday" based on today's date.
   - hour: Optional time in 24h format (HH:MM) if mentioned

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
    { "task": "string", "day": "YYYY-MM-DD", "hour": "HH:MM" }
  ],
  "notes": [
    { "title": "string", "content": "string" }
  ],
  "reminders": [
    { "message": "string", "remindAt": "YYYY-MM-DDTHH:MM:SS" }
  ]
}

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
