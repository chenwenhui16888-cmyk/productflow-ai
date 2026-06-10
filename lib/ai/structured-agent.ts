import { generateWithOllama, getOllamaModel } from "./ollama";

export async function generateJsonWithLocalAi<T>(
  system: string,
  prompt: string,
  validate: (value: unknown) => T | null
) {
  try {
    const raw = await generateWithOllama({
      model: getOllamaModel(),
      system,
      prompt,
      temperature: 0.2
    });
    const parsed = parseJsonObject(raw);
    return parsed ? validate(parsed) : null;
  } catch (error) {
    console.warn("Ollama structured generation failed, fallback to mock.", error);
    return null;
  }
}

export function parseJsonObject(raw: string) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
