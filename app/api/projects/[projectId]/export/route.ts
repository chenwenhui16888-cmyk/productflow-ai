import { NextResponse } from "next/server";
import { buildExportFileName, buildPrdWordHtml } from "@/lib/projects/export";
import { getProjectWorkspace } from "@/lib/projects/service";

export async function GET(
  _request: Request,
  { params }: { params: { projectId: string } }
) {
  const project = await getProjectWorkspace(params.projectId);
  if (!project) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  const documentHtml = buildPrdWordHtml(project);
  if (!documentHtml) {
    return NextResponse.json(
      { error: "prd_not_found", message: "\u8bf7\u5148\u751f\u6210 PRD\uff0c\u518d\u6267\u884c\u5bfc\u51fa\u3002" },
      { status: 409 }
    );
  }

  const fileName = encodeURIComponent(buildExportFileName(project.name));
  return new NextResponse(documentHtml, {
    headers: {
      "Content-Type": "application/msword; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`
    }
  });
}
