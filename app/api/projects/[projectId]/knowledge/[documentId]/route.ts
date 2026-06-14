import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  const result = await prisma.knowledgeDocument.deleteMany({
    where: { id: params.documentId, projectId: params.projectId }
  });
  if (!result.count) return NextResponse.json({ error: "文档不存在。" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
