import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">ProductFlow AI</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">项目列表</h1>
          </div>
          <Link href="/projects/new" className="rounded-md bg-teal-700 px-4 py-2.5 font-medium text-white hover:bg-teal-800">
            新建项目
          </Link>
        </header>

        {projects.length === 0 ? (
          <section className="border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-900">还没有项目</h2>
            <p className="mt-2 text-slate-500">从一个产品想法开始你的第一个工作流。</p>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/workspace/${project.id}`} className="border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-500 hover:shadow">
                <h2 className="font-semibold text-slate-950">{project.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{project.ideaText}</p>
                <p className="mt-5 text-xs text-slate-400">
                  更新于 {project.updatedAt.toLocaleString("zh-CN")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
