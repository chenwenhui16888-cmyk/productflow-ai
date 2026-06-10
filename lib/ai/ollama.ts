type OllamaGenerateOptions = {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
};

type OllamaGenerateResponse = {
  response?: string;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b";

export function getOllamaModel() {
  return process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
}

export async function generateWithOllama(options: OllamaGenerateOptions) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = options.model || getOllamaModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt: options.prompt,
        system: options.system,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.4
        }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    return data.response?.trim() || "";
  } finally {
    clearTimeout(timeout);
  }
}
