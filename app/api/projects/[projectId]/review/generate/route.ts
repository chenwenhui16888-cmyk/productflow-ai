import { NextResponse } from "next/server";
import { generateReviewReport } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const report = await runGenerationTask(params.projectId, "review", "generation_task", () =>
    generateReviewReport(params.projectId)
  );

  return NextResponse.json({ report });
}
