import { NextResponse } from "next/server";
import { generateWireframePages } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const pages = await runGenerationTask(params.projectId, "wireframe", "generation_task", () =>
    generateWireframePages(params.projectId)
  );
  return NextResponse.json({ pages });
}
