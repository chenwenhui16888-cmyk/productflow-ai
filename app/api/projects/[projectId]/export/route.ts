import { NextResponse } from "next/server";
import { buildExportFileName, buildProjectWordHtml } from "@/lib/projects/export";
import { getProjectWorkspace } from "@/lib/projects/service";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const project = await getProjectWorkspace(params.projectId);

  if (!project) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  const documentHtml = buildProjectWordHtml(project);
  const fileName = encodeURIComponent(buildExportFileName(project.name));

  return new NextResponse(documentHtml, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`
    }
  });
}
