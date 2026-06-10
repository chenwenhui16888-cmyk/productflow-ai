import { notFound } from "next/navigation";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { getProjectWorkspace } from "@/lib/projects/service";

export default async function WorkspacePage({
  params
}: {
  params: { projectId: string };
}) {
  const project = await getProjectWorkspace(params.projectId);

  if (!project) {
    notFound();
  }

  return <WorkspaceLayout project={project} />;
}
