import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { embedWithOllama } from "@/lib/ai/ollama";
import { splitDocument } from "@/lib/rag/service";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  const document = await prisma.knowledgeDocument.findFirst({
    where: { id: params.documentId, projectId: params.projectId }
  });
  if (!document) return NextResponse.json({ error: "文档不存在。" }, { status: 404 });

  await prisma.knowledgeDocument.update({
    where: { id: document.id },
    data: { status: "processing" }
  });

  try {
    const chunks = splitDocument(document.content);
    const vectors = await Promise.all(chunks.map((chunk) => embedWithOllama(chunk)));
    await prisma.$transaction([
      prisma.knowledgeChunk.deleteMany({ where: { documentId: document.id } }),
      prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: "ready",
          chunks: {
            create: chunks.map((content, index) => ({
              projectId: params.projectId,
              chunkIndex: index,
              content,
              embedding: vectors[index].embedding
            }))
          }
        }
      })
    ]);
    return NextResponse.json({
      ok: true,
      chunkCount: chunks.length,
      embeddingMode: vectors[0]?.mode ?? "fallback",
      embeddingModel: vectors[0]?.model ?? "local-hash-embedding"
    });
  } catch (error) {
    await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status: "failed" }
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "重新索引失败。" }, { status: 500 });
  }
}
