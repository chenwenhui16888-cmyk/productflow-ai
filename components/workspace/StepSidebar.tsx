import { WORKFLOW_STEPS, type StepKey } from "@/lib/workflow/steps";

type StepStatus = {
  stepKey: string;
  status: string;
};

type StepSidebarProps = {
  selectedStep: StepKey;
  stepStatuses: StepStatus[];
  onSelectStep: (stepKey: StepKey) => void;
};

const statusLabels: Record<string, string> = {
  not_started: "未开始",
  draft: "草稿",
  confirmed: "已确认",
  needs_update: "需更新",
  skipped: "已跳过"
};

export function StepSidebar({ selectedStep, stepStatuses, onSelectStep }: StepSidebarProps) {
  const statusMap = new Map(
    stepStatuses.map((stepStatus) => [stepStatus.stepKey, stepStatus.status])
  );

  return (
    <aside
      style={{
        borderRight: "1px solid var(--line)",
        background: "#fff",
        padding: 16,
        overflowY: "auto"
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: "0 0 6px", fontSize: 13 }}>
          工作流导航
        </p>
        <h2 style={{ margin: 0, fontSize: 18 }}>8 个产品步骤</h2>
      </div>
      <nav style={{ display: "grid", gap: 8 }}>
        {WORKFLOW_STEPS.map((step, index) => {
          const status = statusMap.get(step.key) ?? "not_started";
          const isCurrent = selectedStep === step.key;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelectStep(step.key)}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 1fr",
                gap: 10,
                width: "100%",
                border: `1px solid ${isCurrent ? "var(--accent)" : "var(--line)"}`,
                borderRadius: 8,
                background: isCurrent ? "var(--accent-soft)" : "#fff",
                color: "var(--text)",
                padding: 10,
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: isCurrent ? "var(--accent)" : "var(--panel-soft)",
                  color: isCurrent ? "#fff" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {index + 1}
              </span>
              <span style={{ display: "grid", gap: 5 }}>
                <strong style={{ fontSize: 14 }}>{step.label}</strong>
                <span className="muted" style={{ fontSize: 12 }}>
                  {statusLabels[status] ?? status}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
