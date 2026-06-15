import { WORKFLOW_STEPS, getStepLabel, type StepKey } from "@/lib/workflow/steps";
import { KnowledgePanel } from "./KnowledgePanel";
import { AiObservabilityPanel } from "./AiObservabilityPanel";

type AiActionPanelProps = {
  currentStep: StepKey;
  projectId: string;
};

export function AiActionPanel({ currentStep, projectId }: AiActionPanelProps) {
  const step = WORKFLOW_STEPS.find((item) => item.key === currentStep);

  return (
    <aside
      style={{
        borderLeft: "1px solid var(--line)",
        background: "#fff",
        padding: 18,
        overflowY: "auto"
      }}
    >
      <p className="muted" style={{ margin: "0 0 6px", fontSize: 13 }}>
        {"AI \u64cd\u4f5c\u9762\u677f"}
      </p>
      <h2 style={{ margin: "0 0 10px", fontSize: 20 }}>
        {getStepLabel(currentStep)}
      </h2>
      <p className="muted" style={{ margin: "0 0 18px", lineHeight: 1.7 }}>
        {step?.description ?? "\u5f53\u524d\u6b65\u9aa4"}
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <button className="button primary" type="button" disabled>
          {"\u751f\u6210\u5f53\u524d\u5185\u5bb9"}
        </button>
        <button className="button" type="button" disabled>
          {"\u91cd\u65b0\u751f\u6210"}
        </button>
        <button className="button" type="button" disabled>
          {"\u786e\u8ba4\u5e76\u8fdb\u5165\u4e0b\u4e00\u6b65"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 18, padding: 14, background: "var(--panel-soft)" }}>
        <strong style={{ display: "block", marginBottom: 8 }}>{"\u9636\u6bb5\u8bf4\u660e"}</strong>
        <p className="muted" style={{ margin: 0, lineHeight: 1.7, fontSize: 14 }}>
          {"\u5f53\u524d\u7248\u672c\u652f\u6301\u5de6\u4fa7\u9009\u62e9\u6b65\u9aa4\uff0c\u4e2d\u95f4\u5c55\u793a\u5bf9\u5e94\u6b65\u9aa4\u5185\u5bb9\u3002\u771f\u5b9e\u751f\u6210\u64cd\u4f5c\u653e\u5728\u4e2d\u95f4\u5185\u5bb9\u533a\uff0c\u65b9\u4fbf\u548c\u7ed3\u679c\u4e00\u8d77\u67e5\u770b\u3002"}
        </p>
      </div>
      <AiObservabilityPanel projectId={projectId} />
      <KnowledgePanel projectId={projectId} />
    </aside>
  );
}
