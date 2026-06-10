import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-teal-700">ProductFlow AI</p>
        <h1 className="text-4xl font-bold text-slate-950">AI 产品研发助手</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          从一句产品想法出发，依次完成需求澄清、需求拆解、用户故事、低保真原型、
          PRD、研发协作与评审准备。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/projects/new" className="rounded-md bg-teal-700 px-5 py-3 font-medium text-white hover:bg-teal-800">
            新建项目
          </Link>
          <Link href="/projects" className="rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 hover:bg-slate-100">
            查看项目
          </Link>
        </div>
      </section>
    </main>
  );
}
