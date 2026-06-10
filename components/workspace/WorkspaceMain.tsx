import { WORKFLOW_STEPS, type StepKey } from "@/lib/workflow/steps";
import { ClarificationStep } from "./steps/ClarificationStep";
import { RequirementStep } from "./steps/RequirementStep";
import { UserStoryStep } from "./steps/UserStoryStep";
import { WireframeStep } from "./steps/WireframeStep";
import { PrdStep } from "./steps/PrdStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { WorkspaceProject } from "./WorkspaceClient";

type WorkspaceMainProps = {
  selectedStep: StepKey;
  onSelectStep: (stepKey: StepKey) => void;
  project: WorkspaceProject;
};

export function WorkspaceMain({ project, selectedStep, onSelectStep }: WorkspaceMainProps) {
  return (
    <main style={{ padding: 22, overflowY: "auto" }}>
      {selectedStep === "idea" ? <IdeaStep project={project} /> : null}
      {selectedStep === "clarification" ? (
        <ClarificationStep
          projectId={project.id}
          questions={project.clarificationQuestions ?? []}
          onGoRequirement={() => onSelectStep("requirement_breakdown")}
        />
      ) : null}
      {selectedStep === "requirement_breakdown" ? (
        <RequirementStep
          projectId={project.id}
          items={project.requirementBreakdownItems ?? []}
          onGoUserStory={() => onSelectStep("user_story")}
        />
      ) : null}
      {selectedStep === "user_story" ? (
        <UserStoryStep
          projectId={project.id}
          stories={project.userStories ?? []}
          onGoWireframe={() => onSelectStep("wireframe")}
        />
      ) : null}
      {selectedStep === "wireframe" ? (
        <WireframeStep
          projectId={project.id}
          pages={project.wireframePages ?? []}
          onGoPrd={() => onSelectStep("prd")}
        />
      ) : null}
      {selectedStep === "prd" ? (
        <PrdStep
          projectId={project.id}
          prdDocument={project.prdDocument ?? null}
          onGoDelivery={() => onSelectStep("delivery")}
        />
      ) : null}
      {selectedStep === "delivery" ? (
        <DeliveryStep
          projectId={project.id}
          items={project.deliveryItems ?? []}
          onGoReview={() => onSelectStep("review")}
        />
      ) : null}
      {selectedStep === "review" ? (
        <ReviewStep
          projectId={project.id}
          report={project.reviewReports?.[0] ?? null}
        />
      ) : null}
      {selectedStep !== "idea" &&
      selectedStep !== "clarification" &&
      selectedStep !== "requirement_breakdown" &&
      selectedStep !== "user_story" &&
      selectedStep !== "wireframe" &&
      selectedStep !== "prd" &&
      selectedStep !== "delivery" &&
      selectedStep !== "review" ? (
        <PlaceholderStep selectedStep={selectedStep} />
      ) : null}
    </main>
  );
}

function IdeaStep({ project }: { project: WorkspaceProject }) {
  return (
    <section className="card" style={{ padding: 22 }}>
      <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>
        {"\u7b2c 1 \u6b65"}
      </p>
      <h2 style={{ margin: "0 0 16px", fontSize: 24 }}>{"\u4ea7\u54c1\u60f3\u6cd5"}</h2>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label={"\u9879\u76ee\u540d\u79f0"} value={project.name} />
        <Field label={"\u4e00\u53e5\u4ea7\u54c1\u60f3\u6cd5"} value={project.ideaText} multiline />
        <Field label={"\u4ea7\u54c1\u7c7b\u578b"} value={project.productType || "\u672a\u586b\u5199"} />
        <Field label={"\u76ee\u6807\u7528\u6237"} value={formatJsonList(project.targetUsers)} />
        <Field label={"\u9650\u5236\u6761\u4ef6"} value={formatJsonList(project.constraints)} />
      </div>
    </section>
  );
}

function PlaceholderStep({ selectedStep }: { selectedStep: StepKey }) {
  const step = WORKFLOW_STEPS.find((item) => item.key === selectedStep);

  return (
    <section className="card" style={{ padding: 22, display: "grid", gap: 14 }}>
      <p className="muted" style={{ margin: 0, fontWeight: 700 }}>
        {"\u540e\u7eed\u9636\u6bb5"}
      </p>
      <h2 style={{ margin: 0, fontSize: 24 }}>{step?.label ?? selectedStep}</h2>
      <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
        {step?.description}
      </p>
      <div
        style={{
          border: "1px dashed var(--line)",
          borderRadius: 8,
          background: "var(--panel-soft)",
          padding: 18
        }}
      >
        <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
          {"\u8fd9\u4e2a\u6b65\u9aa4\u4f1a\u5728\u540e\u7eed\u9636\u6bb5\u63a5\u5165\u3002\u73b0\u5728\u5148\u4fdd\u7559\u5165\u53e3\uff0c\u65b9\u4fbf\u4f60\u770b\u5230\u5b8c\u6574 8 \u6b65\u5de5\u4f5c\u6d41\u7ed3\u6784\u3002"}
        </p>
      </div>
    </section>
  );
}

function Field({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="muted" style={{ marginBottom: 6, fontSize: 13 }}>
        {label}
      </div>
      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--panel-soft)",
          minHeight: multiline ? 96 : 42,
          padding: "10px 12px",
          lineHeight: 1.7,
          whiteSpace: multiline ? "pre-wrap" : "normal"
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatJsonList(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    return value.join("\u3001");
  }
  return "\u672a\u586b\u5199";
}
