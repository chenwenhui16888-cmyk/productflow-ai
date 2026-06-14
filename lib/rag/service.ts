import { prisma } from "@/lib/db";
import { embedWithOllama } from "@/lib/ai/ollama";

export type RagSource = {
  chunkId: string;
  fileName: string;
  content: string;
  score: number;
};

export function splitDocument(content: string, maxLength = 700, overlap = 100) {
  const paragraphs = content.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length <= maxLength) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }
    if (current) chunks.push(current);
    const carry = current.slice(-overlap);
    current = `${carry}\n${paragraph}`.trim().slice(0, maxLength);
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [content.slice(0, maxLength)];
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

function cosineSimilarity(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return dot / ((Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) || 1);
}
