import { NextResponse } from "next/server";
import { generateReviewReport } from "@/lib/agents/mock";

export async function POST(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const report = await generateReviewReport(params.projectId);

  return NextResponse.json({ report });
}
