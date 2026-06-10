"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WireframePage = {
  id: string;
  pageName: string;
  pageType: string | null;
  pageGoal: string;
  coreModules: unknown;
  keyActions: unknown;
  entryPoints: unknown;
  nextPages: unknown;
  states: unknown;
  wireframeText: string | null;
};

type WireframeStepProps = {
  projectId: string;
  pages: WireframePage[];
  onGoPrd: () => void;
};

export function WireframeStep({ projectId, pages, onGoPrd }: WireframeStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prdLoading, setPrdLoading] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id ?? null);
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null;

  async function generateWireframes() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/wireframes/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function goPrd() {
    setPrdLoading(true);
    await fetch(`/api/projects/${projectId}/prd/generate`, { method: "POST" });
    setPrdLoading(false);
    router.refresh();
    onGoPrd();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 5 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u4f4e\u4fdd\u771f\u539f\u578b"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateWireframes} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : pages.length ? "\u91cd\u65b0\u751f\u6210\u539f\u578b" : "\u751f\u6210\u4f4e\u4fdd\u771f\u539f\u578b"}
        </button>
      </div>

      {pages.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u5148\u5b8c\u6210\u7528\u6237\u6545\u4e8b\uff0c\u518d\u6839\u636e\u6838\u5fc3\u6d41\u7a0b\u751f\u6210\u9875\u9762\u6e05\u5355\u548c\u4f4e\u4fdd\u771f\u7ebf\u6846\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr) 260px", gap: 14, minHeight: 560 }}>
          <aside className="card" style={{ padding: 12, overflowY: "auto" }}>
            <p className="muted" style={{ margin: "0 0 10px", fontWeight: 700 }}>{"\u9875\u9762\u6e05\u5355"}</p>
            <div style={{ display: "grid", gap: 8 }}>
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  style={{
                    border: `1px solid ${selectedPage?.id === page.id ? "var(--accent)" : "var(--line)"}`,
                    borderRadius: 8,
                    background: selectedPage?.id === page.id ? "var(--accent-soft)" : "#fff",
                    color: "var(--text)",
                    cursor: "pointer",
                    padding: 10,
                    textAlign: "left"
                  }}
                >
                  <strong>{page.pageName}</strong>
                  <span className="muted" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                    {page.pageType || "\u901a\u7528\u9875\u9762"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="card" style={{ padding: 18, background: "#fff", overflow: "auto" }}>
            <p className="muted" style={{ margin: "0 0 10px", fontWeight: 700 }}>{"\u7ebf\u6846\u9884\u89c8"}</p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                lineHeight: 1.55,
                fontFamily: "Consolas, monospace",
                color: "var(--text)",
                background: "var(--panel-soft)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 16,
                minHeight: 420
              }}
            >
              {selectedPage?.wireframeText || "\u6682\u65e0\u7ebf\u6846\u5185\u5bb9"}
            </pre>
          </div>

          <aside className="card" style={{ padding: 14, overflowY: "auto" }}>
            <p className="muted" style={{ margin: "0 0 10px", fontWeight: 700 }}>{"\u9875\u9762\u8bf4\u660e"}</p>
            {selectedPage ? (
              <div style={{ display: "grid", gap: 10, lineHeight: 1.7 }}>
                <Detail label={"\u9875\u9762\u76ee\u6807"} value={selectedPage.pageGoal} />
                <Detail label={"\u6838\u5fc3\u6a21\u5757"} value={formatList(selectedPage.coreModules, "moduleName")} />
                <Detail label={"\u5173\u952e\u64cd\u4f5c"} value={formatList(selectedPage.keyActions)} />
                <Detail label={"\u5165\u53e3\u9875\u9762"} value={formatList(selectedPage.entryPoints)} />
                <Detail label={"\u53ef\u8df3\u8f6c\u9875\u9762"} value={formatList(selectedPage.nextPages)} />
                <Detail label={"\u9875\u9762\u72b6\u6001"} value={formatStates(selectedPage.states)} />
              </div>
            ) : null}
          </aside>

          <div className="card" style={{ gridColumn: "1 / -1", padding: 16, background: "var(--panel-soft)", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {"\u4f4e\u4fdd\u771f\u539f\u578b\u5b8c\u6210\u540e\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u751f\u6210 PRD \u521d\u7a3f\u3002"}
            </p>
            <button className="button primary" type="button" onClick={goPrd} disabled={prdLoading}>
              {prdLoading ? "\u751f\u6210\u4e2d..." : "\u8fdb\u5165 PRD \u521d\u7a3f"}
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

function formatList(value: unknown, objectKey?: string) {
  if (!Array.isArray(value)) return "\u672a\u586b\u5199";
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (objectKey && item && typeof item === "object" && objectKey in item) {
        return String((item as Record<string, unknown>)[objectKey]);
      }
      return JSON.stringify(item);
    })
    .join("\u3001");
}

function formatStates(value: unknown) {
  if (!value || typeof value !== "object") return "\u672a\u586b\u5199";
  return Object.entries(value as Record<string, string>)
    .map(([key, text]) => `${key}: ${text}`)
    .join("\u3001");
}
