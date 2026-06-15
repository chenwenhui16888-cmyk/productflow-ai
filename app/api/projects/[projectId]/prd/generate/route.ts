import { NextResponse } from "next/server";
import { generatePrdDocument } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const prdDocument = await runGenerationTask(params.projectId, "prd", "generation_task", () =>
    generatePrdDocument(params.projectId)
  );
  return NextResponse.json({ prdDocument });
}
