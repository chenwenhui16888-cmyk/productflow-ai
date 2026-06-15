import { NextResponse } from "next/server";
import { generateClarificationQuestions } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const questions = await runGenerationTask(params.projectId, "clarification", "generation_task", () =>
    generateClarificationQuestions(params.projectId)
  );
  return NextResponse.json({ questions });
}
