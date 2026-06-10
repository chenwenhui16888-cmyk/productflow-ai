"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PrdSection = {
  sectionKey: string;
  title: string;
  content: string;
};

type PrdDocument = {
  id: string;
  title: string;
  docVersion: string;
  status: string;
  contentMarkdown: string;
  sections: unknown;
};

type PrdStepProps = {
  projectId: string;
  prdDocument: PrdDocument | null;
  onGoDelivery: () => void;
};

export function PrdStep({ projectId, prdDocument, onGoDelivery }: PrdStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "markdown">("preview");

  const sections = useMemo(() => normalizeSections(prdDocument?.sections), [prdDocument]);

  async function generatePrd() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/prd/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 6 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"PRD \u521d\u7a3f"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generatePrd} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : prdDocument ? "\u91cd\u65b0\u751f\u6210 PRD" : "\u751f\u6210 PRD \u521d\u7a3f"}
        </button>
      </div>

      {!prdDocument ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u5148\u5b8c\u6210\u4f4e\u4fdd\u771f\u539f\u578b\uff0c\u518d\u57fa\u4e8e\u5df2\u751f\u6210\u4ea7\u7269\u751f\u6210\u66f4\u5b8c\u6574\u7684 PRD \u521d\u7a3f\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <strong>{prdDocument.title}</strong>
              <span className="muted" style={{ marginLeft: 10, fontSize: 13 }}>
                {prdDocument.docVersion} / {prdDocument.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={viewMode === "preview" ? "button primary" : "button"}
                onClick={() => setViewMode("preview")}
              >
                {"\u9884\u89c8"}
              </button>
              <button
                type="button"
                className={viewMode === "markdown" ? "button primary" : "button"}
                onClick={() => setViewMode("markdown")}
              >
                {"Markdown"}
              </button>
            </div>
          </div>

          {viewMode === "preview" ? (
            <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
              <aside className="card" style={{ padding: 14, position: "sticky", top: 0 }}>
                <p className="muted" style={{ margin: "0 0 10px", fontWeight: 700 }}>{"\u76ee\u5f55"}</p>
                <nav style={{ display: "grid", gap: 8 }}>
                  {sections.map((section, index) => (
                    <a
                      key={section.sectionKey}
                      href={`#prd-${section.sectionKey}`}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        padding: "8px 10px",
                        background: "#fff",
                        fontSize: 13
                      }}
                    >
                      {index + 1}. {section.title}
                    </a>
                  ))}
                </nav>
              </aside>

              <div style={{ display: "grid", gap: 12 }}>
                {sections.map((section) => (
                  <article key={section.sectionKey} id={`prd-${section.sectionKey}`} className="card" style={{ padding: 18 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>{section.title}</h3>
                    <RichText content={section.content} />
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={prdDocument.contentMarkdown}
              style={{
                width: "100%",
                minHeight: 620,
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "#fff",
                color: "var(--text)",
                padding: 16,
                lineHeight: 1.7,
                resize: "vertical",
                fontFamily: "Consolas, 'Microsoft YaHei', monospace"
              }}
            />
          )}

          <div className="card" style={{ padding: 16, background: "var(--panel-soft)", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {"PRD \u521d\u7a3f\u5b8c\u6210\u540e\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u751f\u6210 PM \u89c6\u89d2\u7684\u4ea4\u4ed8\u62c6\u89e3\u6e05\u5355\u3002"}
            </p>
            <button className="button primary" type="button" onClick={onGoDelivery}>
              {"\u8fdb\u5165\u4ea4\u4ed8\u62c6\u89e3"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RichText({ content }: { content: string }) {
  const blocks = content.split("\n").filter((line) => line.trim().length > 0);

  return (
    <div style={{ display: "grid", gap: 8, lineHeight: 1.75 }}>
      {blocks.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### ")) {
          return <h4 key={index} style={{ margin: "10px 0 2px", fontSize: 16 }}>{trimmed.replace(/^###\s+/, "")}</h4>;
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 6 }}>
              <span className="muted">{"\u2022"}</span>
              <span>{trimmed.slice(2)}</span>
            </div>
          );
        }

        return <p key={index} style={{ margin: 0 }}>{trimmed}</p>;
      })}
    </div>
  );
}

function normalizeSections(value: unknown): PrdSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        sectionKey: String(record.sectionKey || `section_${index}`),
        title: String(record.title || "\u672a\u547d\u540d\u7ae0\u8282"),
        content: String(record.content || "")
      };
    })
    .filter((item): item is PrdSection => Boolean(item));
}
