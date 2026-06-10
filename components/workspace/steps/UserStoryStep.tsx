"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserStory = {
  id: string;
  role: string;
  scenario: string;
  goal: string;
  benefit: string;
  storyText: string;
  mainFlow: unknown;
  exceptionScenarios: unknown;
  acceptanceCriteria: unknown;
  priority: string;
  isMvp: boolean;
};

type UserStoryStepProps = {
  projectId: string;
  stories: UserStory[];
  onGoWireframe: () => void;
};

export function UserStoryStep({ projectId, stories, onGoWireframe }: UserStoryStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generateStories() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/user-stories/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 4 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u7528\u6237\u6545\u4e8b"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateStories} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : stories.length ? "\u91cd\u65b0\u751f\u6210\u6545\u4e8b" : "\u751f\u6210\u7528\u6237\u6545\u4e8b"}
        </button>
      </div>

      {stories.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
          <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
            {"\u5148\u5b8c\u6210\u9700\u6c42\u62c6\u89e3\uff0c\u518d\u751f\u6210\u7528\u6237\u6545\u4e8b\u3001\u4e3b\u6d41\u7a0b\u548c\u9a8c\u6536\u6807\u51c6\u3002"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {stories.map((story) => (
            <article key={story.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <strong>{story.storyText}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{story.priority} / {story.isMvp ? "MVP" : "\u975e MVP"}</span>
              </div>
              <div style={{ display: "grid", gap: 8, lineHeight: 1.7 }}>
                <Detail label={"\u89d2\u8272"} value={story.role} />
                <Detail label={"\u573a\u666f"} value={story.scenario} />
                <Detail label={"\u76ee\u6807"} value={story.goal} />
                <Detail label={"\u6536\u76ca"} value={story.benefit} />
                <Detail label={"\u4e3b\u6d41\u7a0b"} value={formatList(story.mainFlow)} />
                <Detail label={"\u5f02\u5e38\u573a\u666f"} value={formatList(story.exceptionScenarios)} />
                <Detail label={"\u9a8c\u6536\u6807\u51c6"} value={formatList(story.acceptanceCriteria)} />
              </div>
            </article>
          ))}
          <div className="card" style={{ padding: 16, background: "var(--panel-soft)", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {"\u7528\u6237\u6545\u4e8b\u5b8c\u6210\u540e\uff0c\u4e0b\u4e00\u6b65\u53ef\u4ee5\u751f\u6210\u9875\u9762\u6d41\u7a0b\u548c\u4f4e\u4fdd\u771f\u539f\u578b\u3002"}
            </p>
            <button className="button primary" type="button" onClick={onGoWireframe}>
              {"\u8fdb\u5165\u4f4e\u4fdd\u771f\u539f\u578b"}
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
