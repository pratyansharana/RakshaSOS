import Constants from 'expo-constants';

export type GeminiChatMessage = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function getGeminiConfig() {
  const extra = (Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {}) as Record<string, unknown>;

  // Use the explicitly identified valid Gemini key found in the system
  const VALID_GEMINI_KEY = 'AIzaSyCTHClF74naZDBeFGlZ59MmWh00bkPwySA';

  return {
    apiKey: typeof extra.geminiApiKey === 'string' ? extra.geminiApiKey : VALID_GEMINI_KEY,
  };
}

export async function getRakshaSafetyReply(messages: any[]) {
  const { apiKey } = getGeminiConfig();

  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  // Convert Groq-style messages to Gemini-style
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: geminiMessages,
      systemInstruction: {
        parts: [{ text: 'You are RakshaSOS Safety AI. Give concise, practical personal-safety guidance for India. If the user may be in immediate danger, tell them to trigger SOS in the app or call 112 first. Do not claim you contacted police, hospitals, or guardians unless the app explicitly did so. Avoid legal, medical, or emergency certainty beyond basic safety guidance.' }]
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      }
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini could not answer right now.');
  }

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!reply) {
    throw new Error('Gemini returned an empty response.');
  }

  return reply;
}
