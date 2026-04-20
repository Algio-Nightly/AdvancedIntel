import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Model Presets ─────────────────────────────────────────────
const MODELS = {
  gemma4:    'gemma-4-26b-it',
  flashLite: 'gemini-3.1-flash-lite-preview',
};

const MODEL_LABELS = {
  gemma4:    'Gemma 4 · 26B',
  flashLite: 'Gemini 3.1 Flash Lite',
};

// ─── Dynamic Client Factory ────────────────────────────────────
let cachedKey = null;
let cachedClient = null;

function getClient(apiKey) {
  if (!apiKey) return null;
  if (apiKey === cachedKey && cachedClient) return cachedClient;
  cachedClient = new GoogleGenerativeAI(apiKey);
  cachedKey = apiKey;
  return cachedClient;
}

// ─── Core API ──────────────────────────────────────────────────

export async function generateText(apiKey, prompt, options = {}) {
  const client = getClient(apiKey);
  if (!client) throw new Error('AI is not configured. Add your Gemini API key in Settings.');

  const {
    model = 'flashLite',
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const modelId = MODELS[model] || MODELS.flashLite;

  const generativeModel = client.getGenerativeModel({
    model: modelId,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function streamText(apiKey, prompt, onChunk, options = {}) {
  const client = getClient(apiKey);
  if (!client) throw new Error('AI is not configured. Add your Gemini API key in Settings.');

  const {
    model = 'flashLite',
    systemInstruction,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const modelId = MODELS[model] || MODELS.flashLite;

  const generativeModel = client.getGenerativeModel({
    model: modelId,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const result = await generativeModel.generateContentStream(prompt);

  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onChunk(text);
    }
  }
  return full;
}

export function createChat(apiKey, options = {}) {
  const client = getClient(apiKey);
  if (!client) throw new Error('AI is not configured. Add your Gemini API key in Settings.');

  const {
    model = 'flashLite',
    systemInstruction,
    history = [],
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const modelId = MODELS[model] || MODELS.flashLite;

  const generativeModel = client.getGenerativeModel({
    model: modelId,
    ...(systemInstruction && { systemInstruction }),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  let chat = generativeModel.startChat({ history });

  async function send(message) {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }

  async function sendStream(message, onChunk) {
    const result = await chat.sendMessageStream(message);
    let full = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        full += text;
        onChunk(text);
      }
    }
    return full;
  }

  function getHistory() {
    return chat.getHistory ? chat.getHistory() : [];
  }

  function clearHistory() {
    chat = generativeModel.startChat({ history: [] });
  }

  return { send, sendStream, getHistory, clearHistory };
}

export { MODELS, MODEL_LABELS };
