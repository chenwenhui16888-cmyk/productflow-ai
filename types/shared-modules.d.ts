declare module "@/lib/shared/json-utils.mjs" {
  export function parseJsonObject(raw: string): Record<string, unknown> | null;
}

declare module "@/lib/shared/rag-utils.mjs" {
  export function splitText(content: string, maxLength?: number, overlap?: number): string[];
  export function cosineSimilarity(left: number[], right: number[]): number;
}
