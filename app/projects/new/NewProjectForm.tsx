"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [productType, setProductType] = useState("Web 应用");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        ideaText: form.get("ideaText"),
        productType,
        targetUsers: form.get("targetUsers"),
        constraints: form.get("constraints"),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? payload.message ?? "创建失败，请检查输入后重试。");
      setSubmitting(false);
      return;
    }

    router.push(`/workspace/${payload.project.id}`);
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">项目名称</span>
        <input
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="例如：AI 面试复盘助手"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">产品想法</span>
        <textarea
          name="ideaText"
          required
          minLength={8}
          rows={6}
          placeholder="描述你想解决的问题、目标用户和大致使用场景。"
          className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">产品类型</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["Web 应用", "移动应用", "小程序", "内部工具"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setProductType(option)}
              className={`rounded-md border px-3 py-2 text-sm ${
                productType === option
                  ? "border-teal-700 bg-teal-50 font-medium text-teal-800"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">目标用户</span>
        <input
          name="targetUsers"
          required
          placeholder="例如：刚入门的产品经理、创业团队"
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <span className="mt-1 block text-xs text-slate-400">多个用户群体可用逗号分隔。</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">限制条件（选填）</span>
        <textarea
          name="constraints"
          rows={3}
          placeholder="例如：首版两周完成、只做 Web 端、不接入支付"
          className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "正在创建..." : "创建项目并进入工作台"}
      </button>
    </form>
  );
}
