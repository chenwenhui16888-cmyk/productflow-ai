import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addKnowledgeDocument } from "@/lib/rag/service";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const documents = await prisma.knowledgeDocument.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } }
  });
  return NextResponse.json({ documents });
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const body = (await request.json()) as { fileName?: string; content?: string };
  const fileName = body.fileName?.trim();
  const content = body.content?.trim();
  if (!fileName || !content || content.length < 20) {
    return NextResponse.json({ error: "文件名和至少 20 个字符的正文为必填项。" }, { status: 400 });
  }
  if (content.length > 200000) {
    return NextResponse.json({ error: "单个文档不能超过 200,000 个字符。" }, { status: 400 });
  }
  const result = await addKnowledgeDocument(params.projectId, fileName, content);
  return NextResponse.json(result, { status: 201 });
}
