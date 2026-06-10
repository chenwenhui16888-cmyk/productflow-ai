import { NextResponse } from "next/server";
import { generateWireframePages } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const pages = await generateWireframePages(params.projectId);
  return NextResponse.json({ pages });
}
