import { NextResponse } from "next/server";
import { generateRequirementBreakdown } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const items = await runGenerationTask(params.projectId, "requirement_breakdown", "generation_task", () =>
    generateRequirementBreakdown(params.projectId)
  );
  return NextResponse.json({ items });
}
