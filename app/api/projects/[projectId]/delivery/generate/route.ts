import { NextResponse } from "next/server";
import { generateDeliveryItems } from "@/lib/agents/mock";
import { runGenerationTask } from "@/lib/ai/generation-task";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const items = await runGenerationTask(params.projectId, "delivery", "generation_task", () =>
    generateDeliveryItems(params.projectId)
  );

  return NextResponse.json({ items });
}
