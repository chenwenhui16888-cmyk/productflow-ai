import { prisma } from "@/lib/db";
import { STEP_KEYS } from "@/lib/workflow/steps";
import { CreateProjectInput, splitLines } from "./schema";

export async function listProjects() {
  return prisma.project.findMany({
    where: {
      status: {
        not: "archived"
      }
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      stepStatuses: true
    }
  });
}

export async function createProject(input: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: input.name,
      ideaText: input.ideaText,
      productType: input.productType || null,
      targetUsers: splitLines(input.targetUsers),
      constraints: splitLines(input.constraints),
      currentStep: "idea",
      stepStatuses: {
        create: STEP_KEYS.map((stepKey) => ({
          stepKey,
          status: stepKey === "idea" ? "draft" : "not_started"
        }))
      }
    },
    include: {
      stepStatuses: true
    }
  });
}

export async function getProjectWorkspace(projectId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId
    },
    include: {
      stepStatuses: {
        orderBy: {
          createdAt: "asc"
        }
      },
      clarificationQuestions: true,
      requirementBreakdownItems: true,
      userStories: true,
      wireframePages: true,
      prdDocument: true,
      deliveryItems: true,
      reviewReports: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });
}
