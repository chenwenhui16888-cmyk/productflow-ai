import { NextResponse } from "next/server";
import { generatePrdDocument } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const prdDocument = await generatePrdDocument(params.projectId);
  return NextResponse.json({ prdDocument });
}
