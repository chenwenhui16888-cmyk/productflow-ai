"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReviewReport = {
  id: string;
  overallScore: number;
  conclusion: string;
  readinessStatus: string;
  dimensionScores: unknown;
  issues: unknown;
  risks: unknown;
  suggestions: unknown;
  nextActions: unknown;
  createdAt: Date;
};

type ReviewStepProps = {
  projectId: string;
  report: ReviewReport | null;
};

export function ReviewStep({ projectId, report }: ReviewStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generateReview() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/review/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 8 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u8d28\u91cf\u8bc4\u5ba1"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateReview} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : report ? "\u91cd\u65b0\u751f\u6210\u8bc4\u5ba1" : "\u751f\u6210\u8d28\u91cf\u8bc4\u5ba1"}
        </button>
      </div>

      {!report ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u5b8c\u6210 PRD \u548c\u4ea4\u4ed8\u62c6\u89e3\u540e\uff0c\u751f\u6210\u4e00\u4efd\u9700\u6c42\u6210\u719f\u5ea6\u8bc4\u5ba1\u62a5\u544a\uff0c\u7528\u4e8e\u68c0\u67e5\u7f3a\u53e3\u548c\u5c55\u793a PM \u601d\u8003\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 18, display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: 18, alignItems: "center" }}>
            <div style={{
              width: 118,
              height: 118,
              borderRadius: "50%",
              border: "10px solid #2563eb",
              display: "grid",
              placeItems: "center",
              background: "#fff"
            }}>
              <strong style={{ fontSize: 30 }}>{report.overallScore}</strong>
            </div>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>{formatReadiness(report.readinessStatus)}</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{"\u8bc4\u5ba1\u7ed3\u8bba"}</h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.8 }}>{report.conclusion}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {formatScores(report.dimensionScores).map((score) => (
              <div key={score.label} className="card" style={{ padding: 14 }}>
                <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{score.label}</div>
                <strong style={{ fontSize: 22 }}>{score.value}</strong>
              </div>
            ))}
          </div>

          <ReportBlock title={"\u4e3b\u8981\u95ee\u9898"} items={formatIssueList(report.issues)} />
          <ReportBlock title={"\u98ce\u9669\u63d0\u793a"} items={formatList(report.risks)} />
          <ReportBlock title={"\u4fee\u6539\u5efa\u8bae"} items={formatList(report.suggestions)} />
          <ReportBlock title={"\u4e0b\u4e00\u6b65\u884c\u52a8"} items={formatList(report.nextActions)} />
        </div>
      )}
    </section>
  );
}

function ReportBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${index}`} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 8, lineHeight: 1.7 }}>
            <span className="muted">{index + 1}</span>
            <span className="muted" style={{ whiteSpace: "pre-wrap" }}>{item}</span>
          </div>
        )) : <p className="muted" style={{ margin: 0 }}>{"\u6682\u65e0"}</p>}
      </div>
    </div>
  );
}

function formatScores(value: unknown) {
  const record = isRecord(value) ? value : {};
  return [
    { label: "\u6f84\u6e05\u5b8c\u6574\u5ea6", value: `${Number(record.clarification ?? 0)}/20` },
    { label: "\u9700\u6c42\u8303\u56f4", value: `${Number(record.requirement ?? 0)}/20` },
    { label: "\u6545\u4e8b\u8986\u76d6", value: `${Number(record.userStory ?? 0)}/20` },
    { label: "\u539f\u578b\u8868\u8fbe", value: `${Number(record.wireframe ?? 0)}/15` },
    { label: "\u4ea4\u4ed8\u62c6\u89e3", value: `${Number(record.delivery ?? 0)}/15` },
    { label: "PRD", value: `${Number(record.prd ?? 0)}/10` }
  ];
}

function formatIssueList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (!isRecord(item)) return String(item);
    return [
      `${formatLevel(String(item.level ?? ""))}${String(item.title ?? "\u672a\u547d\u540d\u95ee\u9898")}`,
      String(item.detail ?? ""),
      `\u5efa\u8bae\uff1a${String(item.suggestion ?? "\u5f85\u8865\u5145")}`
    ].filter(Boolean).join("\n");
  });
}

function formatList(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function formatLevel(level: string) {
  if (level === "high") return "\u9ad8\u98ce\u9669\uff1a";
  if (level === "medium") return "\u4e2d\u98ce\u9669\uff1a";
  if (level === "low") return "\u4f4e\u98ce\u9669\uff1a";
  return "";
}

function formatReadiness(status: string) {
  if (status === "ready") return "\u72b6\u6001\uff1a\u53ef\u8fdb\u5165\u521d\u6b65\u8bc4\u5ba1";
  if (status === "needs_revision") return "\u72b6\u6001\uff1a\u9700\u4fee\u8ba2\u540e\u8bc4\u5ba1";
  return "\u72b6\u6001\uff1a\u6682\u4e0d\u5efa\u8bae\u8bc4\u5ba1";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
