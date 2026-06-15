import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const logs = await prisma.generationLog.findMany({
    where: { projectId: params.projectId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return NextResponse.json({ logs });
}
