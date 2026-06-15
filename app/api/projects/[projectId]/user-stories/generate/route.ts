import { NextResponse } from "next/server";
import { generateUserStories } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const stories = await runGenerationTask(params.projectId, "user_story", "generation_task", () =>
    generateUserStories(params.projectId)
  );
  return NextResponse.json({ stories });
}
