import { NextResponse } from "next/server";
import { getProjectWorkspace } from "@/lib/projects/service";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const workspace = await getProjectWorkspace(params.projectId);

  if (!workspace) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  return NextResponse.json({ workspace });
}
