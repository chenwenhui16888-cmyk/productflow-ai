import Link from "next/link";
import { NewProjectForm } from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/projects" className="text-sm font-medium text-teal-700 hover:text-teal-800">
          返回项目列表
        </Link>
        <div className="mt-5 border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-teal-700">ProductFlow AI</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">新建产品项目</h1>
          <p className="mt-3 text-slate-600">
            输入一个真实的产品想法，后续内容会围绕该想法和你的澄清答案生成。
          </p>
          <NewProjectForm />
        </div>
      </div>
    </main>
  );
}
