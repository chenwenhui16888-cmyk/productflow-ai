import { NextResponse } from "next/server";
import { generateClarificationQuestions } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const questions = await generateClarificationQuestions(params.projectId);
  return NextResponse.json({ questions });
}
