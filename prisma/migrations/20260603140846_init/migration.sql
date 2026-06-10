-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ideaText" TEXT NOT NULL,
    "productType" TEXT,
    "targetUsers" JSONB,
    "constraints" JSONB,
    "summary" TEXT,
    "currentStep" TEXT NOT NULL DEFAULT 'idea',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepStatus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClarificationQuestion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "answerType" TEXT NOT NULL DEFAULT 'text',
    "aiSuggestion" TEXT,
    "userAnswer" TEXT,
    "answerStatus" TEXT NOT NULL DEFAULT 'unanswered',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "impactArea" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClarificationQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementBreakdownItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userScenario" TEXT NOT NULL,
    "userProblem" TEXT NOT NULL,
    "userValue" TEXT,
    "featureModule" TEXT NOT NULL,
    "subFeature" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "isMvp" BOOLEAN NOT NULL DEFAULT false,
    "mvpReason" TEXT,
    "outOfScope" BOOLEAN NOT NULL DEFAULT false,
    "assumptions" JSONB,
    "risks" JSONB,
    "relatedClarificationIds" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementBreakdownItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "storyText" TEXT NOT NULL,
    "mainFlow" JSONB NOT NULL,
    "exceptionScenarios" JSONB,
    "acceptanceCriteria" JSONB NOT NULL,
    "relatedRequirementIds" JSONB NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "isMvp" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WireframePage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageType" TEXT,
    "pageGoal" TEXT NOT NULL,
    "coreModules" JSONB NOT NULL,
    "keyActions" JSONB NOT NULL,
    "entryPoints" JSONB,
    "nextPages" JSONB,
    "relatedUserStoryIds" JSONB NOT NULL,
    "relatedRequirementIds" JSONB NOT NULL,
    "states" JSONB NOT NULL,
    "wireframeText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WireframePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PRDDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docVersion" TEXT NOT NULL DEFAULT 'v0.1',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contentMarkdown" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "sourceArtifactIds" JSONB NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PRDDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "requirementName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedPageIds" JSONB,
    "relatedUserStoryIds" JSONB,
    "acceptanceCriteria" JSONB NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "versionPlan" TEXT NOT NULL DEFAULT 'MVP',
    "dependencies" JSONB,
    "collaborators" JSONB,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'todo',
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "conclusion" TEXT NOT NULL,
    "readinessStatus" TEXT NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "risks" JSONB,
    "suggestions" JSONB NOT NULL,
    "nextActions" JSONB NOT NULL,
    "reviewedArtifactIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "inputSnapshot" JSONB,
    "outputSnapshot" JSONB,
    "modelName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "Project"("updatedAt");

-- CreateIndex
CREATE INDEX "StepStatus_projectId_idx" ON "StepStatus"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "StepStatus_projectId_stepKey_key" ON "StepStatus"("projectId", "stepKey");

-- CreateIndex
CREATE INDEX "ClarificationQuestion_projectId_idx" ON "ClarificationQuestion"("projectId");

-- CreateIndex
CREATE INDEX "ClarificationQuestion_status_idx" ON "ClarificationQuestion"("status");

-- CreateIndex
CREATE INDEX "RequirementBreakdownItem_projectId_idx" ON "RequirementBreakdownItem"("projectId");

-- CreateIndex
CREATE INDEX "RequirementBreakdownItem_priority_idx" ON "RequirementBreakdownItem"("priority");

-- CreateIndex
CREATE INDEX "RequirementBreakdownItem_status_idx" ON "RequirementBreakdownItem"("status");

-- CreateIndex
CREATE INDEX "UserStory_projectId_idx" ON "UserStory"("projectId");

-- CreateIndex
CREATE INDEX "UserStory_priority_idx" ON "UserStory"("priority");

-- CreateIndex
CREATE INDEX "UserStory_status_idx" ON "UserStory"("status");

-- CreateIndex
CREATE INDEX "WireframePage_projectId_idx" ON "WireframePage"("projectId");

-- CreateIndex
CREATE INDEX "WireframePage_status_idx" ON "WireframePage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PRDDocument_projectId_key" ON "PRDDocument"("projectId");

-- CreateIndex
CREATE INDEX "PRDDocument_status_idx" ON "PRDDocument"("status");

-- CreateIndex
CREATE INDEX "DeliveryItem_projectId_idx" ON "DeliveryItem"("projectId");

-- CreateIndex
CREATE INDEX "DeliveryItem_priority_idx" ON "DeliveryItem"("priority");

-- CreateIndex
CREATE INDEX "DeliveryItem_deliveryStatus_idx" ON "DeliveryItem"("deliveryStatus");

-- CreateIndex
CREATE INDEX "ReviewReport_projectId_idx" ON "ReviewReport"("projectId");

-- CreateIndex
CREATE INDEX "ReviewReport_readinessStatus_idx" ON "ReviewReport"("readinessStatus");

-- CreateIndex
CREATE INDEX "ReviewReport_createdAt_idx" ON "ReviewReport"("createdAt");

-- CreateIndex
CREATE INDEX "GenerationLog_projectId_idx" ON "GenerationLog"("projectId");

-- CreateIndex
CREATE INDEX "GenerationLog_stepKey_idx" ON "GenerationLog"("stepKey");

-- CreateIndex
CREATE INDEX "GenerationLog_status_idx" ON "GenerationLog"("status");

-- CreateIndex
CREATE INDEX "GenerationLog_createdAt_idx" ON "GenerationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StepStatus" ADD CONSTRAINT "StepStatus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClarificationQuestion" ADD CONSTRAINT "ClarificationQuestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementBreakdownItem" ADD CONSTRAINT "RequirementBreakdownItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStory" ADD CONSTRAINT "UserStory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WireframePage" ADD CONSTRAINT "WireframePage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRDDocument" ADD CONSTRAINT "PRDDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationLog" ADD CONSTRAINT "GenerationLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
