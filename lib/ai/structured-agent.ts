import { generateWithOllama, getOllamaModel } from "./ollama";
import { parseJsonObject } from "@/lib/shared/json-utils.mjs";

export type StructuredGenerationResult<T> = {
  data: T | null;
  metrics: {
    durationMs: number;
    attempts: number;
    firstParseSucceeded: boolean;
    firstValidationSucceeded: boolean;
    repairSucceeded: boolean;
    finalValidationSucceeded: boolean;
    errorType: string | null;
  };
};

export async function generateJsonWithLocalAi<T>(
  system: string,
  prompt: string,
  validate: (value: unknown) => T | null
): Promise<StructuredGenerationResult<T>> {
  const startedAt = Date.now();
  let attempts = 0;
  let firstParseSucceeded = false;
  let firstValidationSucceeded = false;
  let errorType: string | null = null;

  try {
    attempts = 1;
    const raw = await generateWithOllama({
      model: getOllamaModel(),
      system,
      prompt,
      temperature: 0.2
    });
    const parsed = parseJsonObject(raw);
    firstParseSucceeded = Boolean(parsed);
    const firstData = parsed ? validate(parsed) : null;
    firstValidationSucceeded = Boolean(firstData);
    if (firstData) {
      return result(firstData, false);
    }

    errorType = parsed ? "schema_validation_failed" : "json_parse_failed";
    attempts = 2;
    const repairedRaw = await generateWithOllama({
      model: getOllamaModel(),
      system: [
        system,
        "\u4e0a\u4e00\u6b21\u8f93\u51fa\u672a\u901a\u8fc7 JSON \u89e3\u6790\u6216 Schema \u6821\u9a8c\u3002",
        "\u8bf7\u53ea\u8f93\u51fa\u4fee\u590d\u540e\u7684\u5b8c\u6574 JSON\uff0c\u4e0d\u8981\u89e3\u91ca\u3002"
      ].join("\n"),
      prompt: [
        prompt,
        "",
        `\u5931\u8d25\u7c7b\u578b\uff1a${errorType}`,
        "\u4e0a\u4e00\u6b21\u8f93\u51fa\uff1a",
        raw.slice(0, 12000)
      ].join("\n"),
      temperature: 0.1
    });
    const repairedParsed = parseJsonObject(repairedRaw);
    const repairedData = repairedParsed ? validate(repairedParsed) : null;
    if (!repairedParsed) errorType = "repair_json_parse_failed";
    else if (!repairedData) errorType = "repair_schema_validation_failed";
    return result(repairedData, Boolean(repairedData));
  } catch (error) {
    console.warn("Ollama structured generation failed, fallback to mock.", error);
    errorType = error instanceof Error && error.name === "AbortError" ? "timeout" : "model_request_failed";
    return result(null, false);
  }

  function result(data: T | null, repairSucceeded: boolean): StructuredGenerationResult<T> {
    return {
      data,
      metrics: {
        durationMs: Date.now() - startedAt,
        attempts,
        firstParseSucceeded,
        firstValidationSucceeded,
        repairSucceeded,
        finalValidationSucceeded: Boolean(data),
        errorType: data ? null : errorType
      }
    };
  }
}

export { parseJsonObject };

export function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
