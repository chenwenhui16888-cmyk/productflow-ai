import { NextResponse } from "next/server";
import { generateRequirementBreakdown } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const items = await generateRequirementBreakdown(params.projectId);
  return NextResponse.json({ items });
}
