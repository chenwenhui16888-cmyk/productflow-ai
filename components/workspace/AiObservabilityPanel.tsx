"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type GenerationLog = {
  id: string;
  stepKey: string;
  artifactType: string;
  mode: string;
  modelName: string | null;
  status: string;
  outputSnapshot: unknown;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export function AiObservabilityPanel({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [expanded, setExpanded] = useState(false);

  const loadLogs = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/generation-logs`, { cache: "no-store" });
    if (response.ok) setLogs((await response.json()).logs);
  }, [projectId]);

  useEffect(() => {
    void loadLogs();
    const timer = window.setInterval(loadLogs, 2500);
    return () => window.clearInterval(timer);
  }, [loadLogs]);

  const running = logs.find((log) => log.status === "running");
  const recent = useMemo(() => logs.filter((log) => log.artifactType !== "generation_task").slice(0, 6), [logs]);

  return (
    <div className="card" style={{ marginTop: 18, padding: 14, background: "var(--panel-soft)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <strong>AI 运行状态</strong>
        <button className="button" type="button" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "收起" : "查看日志"}
        </button>
      </div>
      <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", background: "#fff" }}>
        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: running ? "#d97706" : "#059669", marginRight: 8 }} />
        <strong style={{ fontSize: 13 }}>{running ? `正在生成：${stepLabel(running.stepKey)}` : "当前无运行任务"}</strong>
        {running ? <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>任务状态已持久化，刷新页面后仍可查看。</p> : null}
      </div>

      {expanded ? (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {recent.length ? recent.map((log) => {
            const metrics = getMetrics(log.outputSnapshot);
            return (
              <div key={log.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8, fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{stepLabel(log.stepKey)}</strong>
                  <span>{statusLabel(log.status)}</span>
                </div>
                <div className="muted" style={{ marginTop: 4, lineHeight: 1.6 }}>
                  {log.modelName ?? log.mode}
                  {metrics.durationMs ? ` · ${(metrics.durationMs / 1000).toFixed(1)} 秒` : ""}
                  {metrics.attempts ? ` · ${metrics.attempts} 次尝试` : ""}
                  {metrics.repairSucceeded ? " · 自动修复成功" : ""}
                  {log.mode === "mock" ? " · 已降级" : ""}
                </div>
                {log.errorMessage ? <div style={{ color: "#b91c1c", marginTop: 4 }}>{log.errorMessage}</div> : null}
              </div>
            );
          }) : <span className="muted" style={{ fontSize: 12 }}>暂无生成记录。</span>}
        </div>
      ) : null}
    </div>
  );
}

function getMetrics(value: unknown) {
  if (!value || typeof value !== "object") return {} as Record<string, unknown>;
  const output = value as Record<string, unknown>;
  return output.metrics && typeof output.metrics === "object"
    ? output.metrics as Record<string, any>
    : output as Record<string, any>;
}

function stepLabel(step: string) {
  const labels: Record<string, string> = {
    clarification: "需求澄清",
    requirement_breakdown: "需求拆解",
    user_story: "用户故事",
    wireframe: "低保真原型",
    prd: "PRD",
    delivery: "研发协作",
    review: "评审准备"
  };
  return labels[step] ?? step;
}

function statusLabel(status: string) {
  if (status === "running") return "运行中";
  if (status === "failed") return "失败";
  return "已完成";
}
