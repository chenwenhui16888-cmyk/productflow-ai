import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/projects/service";
import { createProjectSchema } from "@/lib/projects/schema";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        issues: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const project = await createProject(parsed.data);
  return NextResponse.json({ project }, { status: 201 });
}
