import { WorkspaceClient, type WorkspaceProject } from "./WorkspaceClient";

type WorkspaceLayoutProps = {
  project: WorkspaceProject;
};

export function WorkspaceLayout({ project }: WorkspaceLayoutProps) {
  return <WorkspaceClient project={project} />;
}
