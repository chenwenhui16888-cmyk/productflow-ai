import { NextResponse } from "next/server";
import { generateUserStories } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const stories = await generateUserStories(params.projectId);
  return NextResponse.json({ stories });
}
