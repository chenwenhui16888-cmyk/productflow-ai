import { prisma } from "@/lib/db";
import { embedWithOllama } from "@/lib/ai/ollama";
import { cosineSimilarity, splitText } from "@/lib/shared/rag-utils.mjs";

export type RagSource = {
  chunkId: string;
  fileName: string;
  content: string;
  score: number;
};

export function splitDocument(content: string, maxLength = 700, overlap = 100) {
  return splitText(content, maxLength, overlap);
}

export async function addKnowledgeDocument(projectId: string, fileName: string, content: string) {
  const chunks = splitDocument(content);
  const vectors = await Promise.all(chunks.map((chunk) => embedWithOllama(chunk)));
  const document = await prisma.knowledgeDocument.create({
    data: {
      projectId,
      fileName,
      content,
      chunks: {
        create: chunks.map((chunk, index) => ({
          projectId,
          chunkIndex: index,
          content: chunk,
          embedding: vectors[index].embedding
        }))
      }
    },
    include: { chunks: true }
  });
  return {
    document,
    embeddingMode: vectors[0]?.mode ?? "fallback",
    embeddingModel: vectors[0]?.model ?? "local-hash-embedding"
  };
}

export async function retrieveKnowledge(projectId: string, query: string, topK = 4) {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { projectId },
    include: { document: { select: { fileName: true } } }
  });
  if (!chunks.length) return [] as RagSource[];

  const queryVector = (await embedWithOllama(query)).embedding;
  return chunks
    .map((chunk) => ({
      chunkId: chunk.id,
      fileName: chunk.document.fileName,
      content: chunk.content,
      score: cosineSimilarity(queryVector, asNumberArray(chunk.embedding))
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}

export function formatRagContext(sources: RagSource[]) {
  if (!sources.length) return "未检索到项目知识库资料。";
  return sources
    .map((source, index) => `[资料 ${index + 1}｜${source.fileName}]\n${source.content}`)
    .join("\n\n");
}

function asNumberArray(value: unknown) {
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
}
