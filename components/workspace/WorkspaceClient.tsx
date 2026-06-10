"use client";

import { useMemo, useState } from "react";
import { AiActionPanel } from "./AiActionPanel";
import { StepSidebar } from "./StepSidebar";
import { WorkspaceMain } from "./WorkspaceMain";
import { WORKFLOW_STEPS, getStepLabel, type StepKey } from "@/lib/workflow/steps";

export type WorkspaceProject = {
  id: string;
  name: string;
  ideaText: string;
  productType: string | null;
  targetUsers: unknown;
  constraints: unknown;
  currentStep: string;
  updatedAt: Date;
  stepStatuses: Array<{ stepKey: string; status: string }>;
  clarificationQuestions?: Array<{
    id: string;
    questionText: string;
    questionType: string;
    aiSuggestion: string | null;
    userAnswer: string | null;
    answerStatus: string;
    isRequired: boolean;
  }>;
  requirementBreakdownItems?: Array<{
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
    risks: unknown;
    assumptions: unknown;
  }>;
  userStories?: Array<{
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
  }>;
  wireframePages?: Array<{
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
  }>;
  prdDocument?: {
    id: string;
    title: string;
    docVersion: string;
    status: string;
    contentMarkdown: string;
    sections: unknown;
  } | null;
  deliveryItems?: Array<{
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
  }>;
  reviewReports?: Array<{
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
  }>;
};

type WorkspaceClientProps = {
  project: WorkspaceProject;
};

export function WorkspaceClient({ project }: WorkspaceClientProps) {
  const initialStep = useMemo(() => {
    const exists = WORKFLOW_STEPS.some((step) => step.key === project.currentStep);
    return (exists ? project.currentStep : "idea") as StepKey;
  }, [project.currentStep]);
  const [selectedStep, setSelectedStep] = useState<StepKey>(initialStep);

  return (
    <div style={{ display: "grid", gridTemplateRows: "64px 1fr", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          borderBottom: "1px solid var(--line)",
          background: "#fff",
          padding: "0 18px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a className="button" href="/projects">
            {"\u9879\u76ee\u5217\u8868"}
          </a>
          <div>
            <strong style={{ display: "block" }}>{project.name}</strong>
            <span className="muted" style={{ fontSize: 13 }}>
              {"\u5f53\u524d\u67e5\u770b\uff1a"}{getStepLabel(selectedStep)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {"\u6700\u540e\u66f4\u65b0\uff1a"}{project.updatedAt.toLocaleString("zh-CN")}
          </span>
          <a className="button" href={`/api/projects/${project.id}/export`}>
            {"\u5bfc\u51fa Word"}
          </a>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0, 1fr) 320px",
          minHeight: 0
        }}
      >
        <StepSidebar
          selectedStep={selectedStep}
          stepStatuses={project.stepStatuses}
          onSelectStep={setSelectedStep}
        />
        <WorkspaceMain
          project={project}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
        />
        <AiActionPanel currentStep={selectedStep} />
      </div>
    </div>
  );
}
