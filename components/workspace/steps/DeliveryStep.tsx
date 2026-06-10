"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

type DeliveryItem = {
  id: string;
  moduleName: string;
  requirementName: string;
  description: string;
  relatedPageIds: unknown;
  relatedUserStoryIds: unknown;
  acceptanceCriteria: unknown;
  priority: string;
  versionPlan: string;
  dependencies: unknown;
  collaborators: unknown;
  deliveryStatus: string;
};

type DeliveryStepProps = {
  projectId: string;
  items: DeliveryItem[];
  onGoReview: () => void;
};

export function DeliveryStep({ projectId, items, onGoReview }: DeliveryStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);

  async function generateDelivery() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/delivery/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 7 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u4ea4\u4ed8\u62c6\u89e3"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateDelivery} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : items.length ? "\u91cd\u65b0\u751f\u6210\u4ea4\u4ed8\u62c6\u89e3" : "\u751f\u6210\u4ea4\u4ed8\u62c6\u89e3"}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u751f\u6210 PRD \u521d\u7a3f\u540e\uff0c\u53ef\u4ee5\u4ece PM \u89c6\u89d2\u628a\u9700\u6c42\u62c6\u6210\u7814\u53d1\u534f\u4f5c\u6e05\u5355\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            <Metric label={"\u4ea4\u4ed8\u9879"} value={String(items.length)} />
            <Metric label={"P0 \u9879"} value={String(items.filter((item) => item.priority === "P0").length)} />
            <Metric label={"MVP \u9879"} value={String(items.filter((item) => item.versionPlan === "MVP").length)} />
            <Metric label={"\u5f85\u5904\u7406"} value={String(items.filter((item) => item.deliveryStatus === "todo").length)} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr style={{ background: "var(--panel-soft)" }}>
                  {["\u6a21\u5757", "\u4ea4\u4ed8\u9879", "\u4f18\u5148\u7ea7", "\u7248\u672c", "\u72b6\u6001", "\u8be6\u60c5"].map((head) => (
                    <th key={head} style={thStyle}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr>
                      <td style={tdStyle}>{item.moduleName}</td>
                      <td style={tdStyle}>{item.requirementName}</td>
                      <td style={tdStyle}>{item.priority}</td>
                      <td style={tdStyle}>{item.versionPlan}</td>
                      <td style={tdStyle}>{formatStatus(item.deliveryStatus)}</td>
                      <td style={tdStyle}>
                        <button className="button" type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                          {expandedId === item.id ? "\u6536\u8d77" : "\u67e5\u770b"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === item.id ? (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, background: "#fff" }}>
                          <div style={{ display: "grid", gap: 12, lineHeight: 1.7 }}>
                            <Detail label={"\u9700\u6c42\u8bf4\u660e"} value={item.description} multiline />
                            <Detail label={"\u6d4b\u8bd5\u9a8c\u6536\u70b9"} value={formatList(item.acceptanceCriteria)} multiline />
                            <Detail label={"\u4f9d\u8d56\u548c\u524d\u7f6e\u6761\u4ef6"} value={formatList(item.dependencies)} multiline />
                            <Detail label={"\u534f\u4f5c\u89d2\u8272"} value={formatList(item.collaborators)} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 16, background: "var(--panel-soft)", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {"\u4ea4\u4ed8\u62c6\u89e3\u5b8c\u6210\u540e\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u68c0\u67e5\u9700\u6c42\u5b8c\u6574\u6027\u548c\u534f\u4f5c\u98ce\u9669\u3002"}
            </p>
            <button className="button primary" type="button" onClick={onGoReview}>
              {"\u8fdb\u5165\u8d28\u91cf\u8bc4\u5ba1"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{label}</div>
      <strong style={{ fontSize: 22 }}>{value}</strong>
    </div>
  );
}

function Detail({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <strong>{label}{"\uff1a"}</strong>
      <span className="muted" style={{ whiteSpace: multiline ? "pre-wrap" : "normal" }}>{value}</span>
    </div>
  );
}

function formatList(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item) => `- ${String(item)}`).join("\n");
  }
  return "\u672a\u586b\u5199";
}

function formatStatus(status: string) {
  if (status === "todo") return "\u5f85\u5904\u7406";
  if (status === "doing") return "\u8fdb\u884c\u4e2d";
  if (status === "done") return "\u5df2\u5b8c\u6210";
  return status;
}

const thStyle = {
  border: "1px solid var(--line)",
  padding: "10px 12px",
  textAlign: "left" as const,
  fontSize: 13
};

const tdStyle = {
  border: "1px solid var(--line)",
  padding: "10px 12px",
  verticalAlign: "top" as const
};
