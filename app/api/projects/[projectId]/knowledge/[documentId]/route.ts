import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { projectId: string; documentId: string } }
) {
  const result = await prisma.knowledgeDocument.deleteMany({
    where: { id: params.documentId, projectId: params.projectId }
  });
  if (!result.count) {
    return NextResponse.json({ error: "\u6587\u6863\u4e0d\u5b58\u5728\u3002" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
