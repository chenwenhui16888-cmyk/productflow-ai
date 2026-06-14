type OllamaGenerateOptions = {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
};

type OllamaGenerateResponse = {
  response?: string;
};

type OllamaEmbeddingResponse = {
  embedding?: number[];
  embeddings?: number[][];
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

export async function embedWithOllama(text: string) {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama embedding failed: ${response.status}`);
    const data = (await response.json()) as OllamaEmbeddingResponse;
    const embedding = data.embeddings?.[0] ?? data.embedding;
    if (!embedding?.length) throw new Error("Ollama returned an empty embedding.");
    return { embedding, model, mode: "ollama" as const };
  } catch {
    return {
      embedding: createLocalEmbedding(text),
      model: "local-hash-embedding",
      mode: "fallback" as const
    };
  } finally {
    clearTimeout(timeout);
  }
}

function createLocalEmbedding(text: string, dimensions = 256) {
  const vector = new Array<number>(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  for (let index = 0; index < normalized.length; index += 1) {
    const token = normalized.slice(index, index + 3);
    let hash = 2166136261;
    for (const char of token) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}
