"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";

type RequirementItem = {
  id: string;
  userScenario: string;
  userProblem: string;
  userValue: string | null;
  featureModule: string;
  subFeature: string;
  priority: string;
  isMvp: boolean;
  mvpReason: string | null;
  outOfScope: boolean;
  assumptions: unknown;
  risks: unknown;
};

type RequirementStepProps = {
  projectId: string;
  items: RequirementItem[];
  onGoUserStory: () => void;
};

export function RequirementStep({ projectId, items, onGoUserStory }: RequirementStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [storyLoading, setStoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id ?? null);

  async function generateRequirements() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/requirements/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function goUserStories() {
    setStoryLoading(true);
    await fetch(`/api/projects/${projectId}/user-stories/generate`, { method: "POST" });
    setStoryLoading(false);
    router.refresh();
    onGoUserStory();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 3 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u9700\u6c42\u62c6\u89e3"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateRequirements} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : items.length ? "\u91cd\u65b0\u751f\u6210\u62c6\u89e3" : "\u751f\u6210\u9700\u6c42\u62c6\u89e3"}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u5b8c\u6210\u9700\u6c42\u6f84\u6e05\u540e\uff0c\u751f\u6210 PM \u89c6\u89d2\u7684\u9700\u6c42\u62c6\u89e3\u8868\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
              <thead>
                <tr style={{ background: "var(--panel-soft)" }}>
                  {["\u6a21\u5757", "\u5b50\u9700\u6c42", "\u4f18\u5148\u7ea7", "\u662f\u5426 MVP", "\u6682\u4e0d\u652f\u6301", "\u8be6\u60c5"].map((head) => (
                    <th key={head} style={thStyle}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr>
                      <td style={tdStyle}>{item.featureModule}</td>
                      <td style={tdStyle}>{item.subFeature}</td>
                      <td style={tdStyle}>{item.priority}</td>
                      <td style={tdStyle}>{item.isMvp ? "\u662f" : "\u5426"}</td>
                      <td style={tdStyle}>{item.outOfScope ? "\u662f" : "\u5426"}</td>
                      <td style={tdStyle}>
                        <button className="button" type="button" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                          {expandedId === item.id ? "\u6536\u8d77" : "\u67e5\u770b"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === item.id ? (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, background: "#fff" }}>
                          <div style={{ display: "grid", gap: 8, lineHeight: 1.7 }}>
                            <Detail label={"\u7528\u6237\u573a\u666f"} value={item.userScenario} />
                            <Detail label={"\u7528\u6237\u95ee\u9898"} value={item.userProblem} />
                            <Detail label={"\u7528\u6237\u4ef7\u503c"} value={item.userValue ?? "\u672a\u586b\u5199"} />
                            <Detail label={"MVP \u7406\u7531"} value={item.mvpReason ?? "\u672a\u586b\u5199"} />
                            <Detail label={"\u5f53\u524d\u5047\u8bbe"} value={formatList(item.assumptions)} />
                            <Detail label={"\u6f5c\u5728\u98ce\u9669"} value={formatList(item.risks)} />
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
              {"\u9700\u6c42\u62c6\u89e3\u540e\uff0c\u53ef\u4ee5\u628a P0/MVP \u9700\u6c42\u8f6c\u6362\u4e3a\u7528\u6237\u6545\u4e8b\u548c\u9a8c\u6536\u6807\u51c6\u3002"}
            </p>
            <button className="button primary" type="button" onClick={goUserStories} disabled={storyLoading}>
              {storyLoading ? "\u751f\u6210\u4e2d..." : "\u8fdb\u5165\u7528\u6237\u6545\u4e8b"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{label}{"\uff1a"}</strong>
      <span className="muted">{value}</span>
    </div>
  );
}

function formatList(value: unknown) {
  if (Array.isArray(value)) return value.join("\u3001");
  return "\u672a\u586b\u5199";
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
