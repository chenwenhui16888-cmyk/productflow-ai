import { prisma } from "@/lib/db";
import { generatePrdWithLocalAi } from "@/lib/ai/prd-agent";
import { generateRequirementsWithLocalAi } from "@/lib/ai/requirement-agent";
import { generateUserStoriesWithLocalAi } from "@/lib/ai/user-story-agent";

export async function generateClarificationQuestions(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });

  await prisma.clarificationQuestion.deleteMany({ where: { projectId, status: "draft" } });

  const questions = [
    {
      questionText: "\u8fd9\u4e2a\u4ea7\u54c1\u7684\u6838\u5fc3\u76ee\u6807\u7528\u6237\u662f\u8c01\uff1f",
      questionType: "target_user",
      aiSuggestion: "\u5efa\u8bae\u7b2c\u4e00\u7248\u53ea\u670d\u52a1\u4e00\u4e2a\u8db3\u591f\u6e05\u6670\u7684\u7528\u6237\u7fa4\u4f53\u3002",
      isRequired: true,
      impactArea: ["prd", "user_story", "mvp_scope"]
    },
    {
      questionText: "\u7b2c\u4e00\u7248\u6700\u9700\u8981\u89e3\u51b3\u7684\u7528\u6237\u95ee\u9898\u662f\u4ec0\u4e48\uff1f",
      questionType: "problem",
      aiSuggestion: "\u8bf7\u4f18\u5148\u63cf\u8ff0\u6700\u9ad8\u9891\u3001\u6700\u75db\u3001\u6700\u5f71\u54cd\u7528\u6237\u5b8c\u6210\u76ee\u6807\u7684\u95ee\u9898\u3002",
      isRequired: true,
      impactArea: ["requirement_breakdown", "prd"]
    },
    {
      questionText: "\u7528\u6237\u5b8c\u6210\u6838\u5fc3\u4efb\u52a1\u7684\u5927\u81f4\u6d41\u7a0b\u662f\u4ec0\u4e48\uff1f",
      questionType: "user_scenario",
      aiSuggestion: "\u53ef\u4ee5\u6309\u8fdb\u5165\u4ea7\u54c1\u3001\u6d4f\u89c8\u5224\u65ad\u3001\u6267\u884c\u64cd\u4f5c\u3001\u83b7\u5f97\u7ed3\u679c\u6765\u63cf\u8ff0\u3002",
      isRequired: true,
      impactArea: ["wireframe", "user_story"]
    },
    {
      questionText: "MVP \u7b2c\u4e00\u7248\u5fc5\u987b\u5305\u542b\u54ea\u4e9b\u529f\u80fd\uff1f",
      questionType: "mvp_scope",
      aiSuggestion: "\u53ea\u4fdd\u7559\u9a8c\u8bc1\u6838\u5fc3\u4ef7\u503c\u5fc5\u9700\u7684\u529f\u80fd\uff0c\u907f\u514d\u7b2c\u4e00\u7248\u8303\u56f4\u8fc7\u5927\u3002",
      isRequired: true,
      impactArea: ["requirement_breakdown", "delivery"]
    },
    {
      questionText: "\u54ea\u4e9b\u529f\u80fd\u5e94\u660e\u786e\u653e\u5230 v0.1 \u8303\u56f4\u4e4b\u5916\uff1f",
      questionType: "function_scope",
      aiSuggestion: "\u4f8b\u5982\u591a\u4eba\u534f\u4f5c\u3001\u652f\u4ed8\u3001\u590d\u6742\u6743\u9650\u3001\u7b2c\u4e09\u65b9\u540c\u6b65\u7b49\u53ef\u4ee5\u5148\u5ef6\u540e\u3002",
      isRequired: false,
      impactArea: ["prd", "review"]
    },
    {
      questionText: "\u5f53\u524d\u662f\u5426\u5b58\u5728\u91cd\u8981\u9650\u5236\u3001\u98ce\u9669\u6216\u5916\u90e8\u4f9d\u8d56\uff1f",
      questionType: "risk",
      aiSuggestion: "\u4f8b\u5982\u6570\u636e\u6765\u6e90\u3001\u7b2c\u4e09\u65b9\u670d\u52a1\u3001\u5408\u89c4\u8981\u6c42\u3001\u65f6\u95f4\u9650\u5236\u6216\u6280\u672f\u4e0d\u786e\u5b9a\u6027\u3002",
      isRequired: false,
      impactArea: ["review", "delivery"]
    }
  ];

  const created = await prisma.clarificationQuestion.createMany({
    data: questions.map((question) => ({
      ...question,
      projectId,
      answerType: "text",
      answerStatus: "unanswered",
      status: "draft",
      generatedBy: "ai"
    }))
  });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "clarification" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "clarification", status: "draft" }
  });

  await prisma.generationLog.create({
    data: {
      projectId,
      stepKey: "clarification",
      artifactType: "clarification_questions",
      mode: "mock",
      inputSnapshot: { projectIdea: project.ideaText },
      outputSnapshot: { count: created.count },
      modelName: "local-mock",
      status: "completed",
      completedAt: new Date()
    }
  });

  return prisma.clarificationQuestion.findMany({
    where: { projectId, status: "draft" },
    orderBy: { createdAt: "asc" }
  });
}

export async function generateRequirementBreakdown(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { clarificationQuestions: true }
  });

  await prisma.requirementBreakdownItem.deleteMany({ where: { projectId, status: "draft" } });

  const coreProblem =
    project.clarificationQuestions.find((item) => item.questionType === "problem")?.userAnswer ||
    project.ideaText;
  const targetUser =
    project.clarificationQuestions.find((item) => item.questionType === "target_user")?.userAnswer ||
    formatJsonList(project.targetUsers) ||
    "\u76ee\u6807\u7528\u6237";
  const userScenario =
    project.clarificationQuestions.find((item) => item.questionType === "user_scenario")?.userAnswer ||
    `\u7528\u6237\u8fdb\u5165 ${project.name}\uff0c\u56f4\u7ed5\u6838\u5fc3\u9700\u6c42\u5b8c\u6210\u4fe1\u606f\u8f93\u5165\u3001\u7ed3\u679c\u83b7\u53d6\u548c\u540e\u7eed\u5904\u7406\u3002`;
  const mvpScope =
    project.clarificationQuestions.find((item) => item.questionType === "mvp_scope")?.userAnswer ||
    "\u5148\u5b9e\u73b0\u6700\u80fd\u9a8c\u8bc1\u6838\u5fc3\u4ef7\u503c\u7684\u4e3b\u6d41\u7a0b";

  const mockItems = [
    {
      userScenario: `${targetUser} \u7b2c\u4e00\u6b21\u8fdb\u5165 ${project.name}\uff0c\u9700\u8981\u5feb\u901f\u7406\u89e3\u4ea7\u54c1\u80fd\u5426\u89e3\u51b3\u81ea\u5df1\u7684\u95ee\u9898\u3002`,
      userProblem: coreProblem,
      userValue: `\u7528\u6237\u53ef\u4ee5\u5224\u65ad ${project.name} \u7684\u6838\u5fc3\u4ef7\u503c\uff0c\u5e76\u660e\u786e\u4e0b\u4e00\u6b65\u8be5\u505a\u4ec0\u4e48\u3002`,
      featureModule: "\u4ea7\u54c1\u5165\u53e3\u4e0e\u9879\u76ee\u6982\u89c8",
      subFeature: `\u5c55\u793a ${project.name} \u7684\u6838\u5fc3\u60f3\u6cd5\u3001\u76ee\u6807\u7528\u6237\u548c\u5f53\u524d\u72b6\u6001`,
      priority: "P0",
      isMvp: true,
      mvpReason: `MVP \u9700\u8981\u5148\u8ba9\u7528\u6237\u7406\u89e3 ${project.name} \u8981\u89e3\u51b3\u7684\u95ee\u9898\uff0c\u5426\u5219\u540e\u7eed\u6d41\u7a0b\u4f1a\u7f3a\u5c11\u5171\u8bc6\u8d77\u70b9\u3002`,
      outOfScope: false,
      assumptions: ["\u7528\u6237\u81f3\u5c11\u6709\u4e00\u4e2a\u660e\u786e\u7684\u4ea7\u54c1\u60f3\u6cd5\u3002"],
      risks: ["\u4ea7\u54c1\u60f3\u6cd5\u53ef\u80fd\u8fc7\u4e8e\u5bbd\u6cdb\uff0c\u9700\u8981\u5148\u5b8c\u6210\u9700\u6c42\u6f84\u6e05\u3002"]
    },
    {
      userScenario,
      userProblem: `${targetUser} \u5728\u4f7f\u7528 ${project.name} \u524d\uff0c\u9700\u8981\u628a\u6838\u5fc3\u95ee\u9898\u3001\u573a\u666f\u548c\u8303\u56f4\u8868\u8fbe\u6e05\u695a\u3002`,
      userValue: "\u7528\u6237\u53ef\u4ee5\u5728\u7cfb\u7edf\u7ed9\u51fa\u7ed3\u679c\u524d\u8865\u9f50\u5173\u952e\u4e0a\u4e0b\u6587\uff0c\u51cf\u5c11\u540e\u7eed\u4ea7\u7269\u7a7a\u6cdb\u3002",
      featureModule: "\u4e0a\u4e0b\u6587\u8865\u5145",
      subFeature: `\u56f4\u7ed5 ${project.name} \u751f\u6210\u5173\u952e\u6f84\u6e05\u95ee\u9898\u5e76\u4fdd\u5b58\u56de\u7b54`,
      priority: "P0",
      isMvp: true,
      mvpReason: `\u6f84\u6e05\u56de\u7b54\u662f ${project.name} \u540e\u7eed\u751f\u6210\u5185\u5bb9\u7684\u4e3b\u8981\u8f93\u5165\uff0c\u5c5e\u4e8e\u5fc5\u8981\u94fe\u8def\u3002`,
      outOfScope: false,
      assumptions: ["\u6f84\u6e05\u95ee\u9898\u53ef\u4ee5\u57fa\u4e8e\u4ea7\u54c1\u60f3\u6cd5\u548c\u4ea7\u54c1\u7c7b\u578b\u751f\u6210\u3002"],
      risks: ["\u95ee\u9898\u8fc7\u591a\u53ef\u80fd\u589e\u52a0\u7528\u6237\u8d1f\u62c5\uff0c\u9700\u8981\u63a7\u5236\u5728 6 \u5230 10 \u4e2a\u3002"]
    },
    {
      userScenario: `${targetUser} \u9700\u8981\u628a\u201c${project.ideaText}\u201d\u62c6\u6210\u53ef\u8bc4\u5ba1\u3001\u53ef\u6392\u671f\u7684\u4ea7\u54c1\u8303\u56f4\u3002`,
      userProblem: `\u5f53\u524d MVP \u8303\u56f4\u662f\uff1a${mvpScope}\u3002\u5982\u679c\u4e0d\u62c6\u89e3\uff0c\u5bb9\u6613\u6df7\u5165\u975e\u5fc5\u8981\u529f\u80fd\u3002`,
      userValue: "\u7528\u6237\u53ef\u4ee5\u770b\u5230\u6a21\u5757\u3001\u4f18\u5148\u7ea7\u3001MVP \u7406\u7531\u548c\u6682\u4e0d\u652f\u6301\u4e8b\u9879\u3002",
      featureModule: "\u8303\u56f4\u4e0e\u4f18\u5148\u7ea7\u7ba1\u7406",
      subFeature: `\u751f\u6210 ${project.name} \u7684 MVP \u9700\u6c42\u62c6\u89e3\u8868`,
      priority: "P0",
      isMvp: true,
      mvpReason: `\u9700\u8981\u5148\u628a ${project.name} \u7684 MVP \u8fb9\u754c\u62c6\u6e05\u695a\uff0c\u624d\u80fd\u7ee7\u7eed\u751f\u6210\u7528\u6237\u6545\u4e8b\u548c PRD\u3002`,
      outOfScope: false,
      assumptions: ["P0 \u9700\u6c42\u540e\u7eed\u90fd\u5e94\u8be5\u6620\u5c04\u5230\u7528\u6237\u6545\u4e8b\u3002"],
      risks: ["\u4f18\u5148\u7ea7\u9700\u8981 PM \u6839\u636e\u771f\u5b9e\u4e1a\u52a1\u76ee\u6807\u624b\u52a8\u6821\u6b63\u3002"]
    },
    {
      userScenario: "\u7528\u6237\u5e0c\u671b\u9879\u76ee\u770b\u8d77\u6765\u5b8c\u6574\uff0c\u4f46\u7b2c\u4e00\u7248\u5f00\u53d1\u8d44\u6e90\u6709\u9650\u3002",
      userProblem: "\u7b2c\u4e00\u7248\u5f88\u5bb9\u6613\u56e0\u4e3a\u529f\u80fd\u8fc7\u591a\u800c\u505a\u4e0d\u5b8c\u3002",
      userValue: "\u7528\u6237\u53ef\u4ee5\u660e\u786e\u5ef6\u540e\u975e\u6838\u5fc3\u80fd\u529b\u3002",
      featureModule: "\u9ad8\u7ea7\u534f\u4f5c\u80fd\u529b",
      subFeature: "\u591a\u4eba\u6743\u9650\u548c\u5916\u90e8\u5de5\u5177\u540c\u6b65",
      priority: "P2",
      isMvp: false,
      mvpReason: "\u8fd9\u7c7b\u80fd\u529b\u6709\u4ef7\u503c\uff0c\u4f46\u4e0d\u5f71\u54cd\u9a8c\u8bc1\u6838\u5fc3\u4ea7\u54c1\u6d41\u7a0b\u3002",
      outOfScope: true,
      assumptions: ["\u7b2c\u4e00\u7248\u6309\u5355\u7528\u6237\u5de5\u4f5c\u53f0\u5b9e\u73b0\u3002"],
      risks: ["\u8fc7\u65e9\u52a0\u5165\u4f1a\u62d6\u6162 MVP \u4ea4\u4ed8\u3002"]
    }
  ];
  const aiItems = await generateRequirementsWithLocalAi({
    projectName: project.name,
    ideaText: project.ideaText,
    productType: project.productType,
    targetUsers: project.targetUsers,
    constraints: project.constraints,
    clarificationQuestions: project.clarificationQuestions
  });
  const items = aiItems ?? mockItems;
  const generationMode = aiItems ? "ollama" : "mock";
  const modelName = aiItems ? "qwen2.5:3b" : "local-mock";

  await prisma.requirementBreakdownItem.createMany({
    data: items.map((item) => ({
      ...item,
      projectId,
      relatedClarificationIds: project.clarificationQuestions.map((question) => question.id),
      status: "draft",
      generatedBy: "ai"
    }))
  });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "requirement_breakdown" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "requirement_breakdown", status: "draft" }
  });

  await writeGenerationLog(
    projectId,
    "requirement_breakdown",
    "requirement_breakdown_items",
    { count: items.length },
    { mode: generationMode, modelName }
  );

  return prisma.requirementBreakdownItem.findMany({
    where: { projectId, status: "draft" },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });
}

export async function generateUserStories(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { requirementBreakdownItems: true }
  });

  await prisma.userStory.deleteMany({ where: { projectId, status: "draft" } });

  const p0Items = project.requirementBreakdownItems.filter((item) => item.priority === "P0");
  const sourceItems = p0Items.length ? p0Items : project.requirementBreakdownItems.slice(0, 3);

  const aiStories = await generateUserStoriesWithLocalAi({
    projectName: project.name,
    ideaText: project.ideaText,
    requirementBreakdownItems: project.requirementBreakdownItems
  });
  const generationMode = aiStories ? "ollama" : "mock";
  const modelName = aiStories ? "qwen2.5:3b" : "local-mock";

  const stories = aiStories ? aiStories.map((story) => ({
    projectId,
    role: story.role,
    scenario: story.scenario,
    goal: story.goal,
    benefit: story.benefit,
    storyText: story.storyText,
    mainFlow: story.mainFlow.length ? story.mainFlow : ["\u7528\u6237\u8fdb\u5165\u529f\u80fd", "\u5b8c\u6210\u5173\u952e\u64cd\u4f5c", "\u67e5\u770b\u7ed3\u679c"],
    exceptionScenarios: story.exceptionScenarios.length ? story.exceptionScenarios : ["\u4fe1\u606f\u4e0d\u5b8c\u6574\u65f6\u7ed9\u51fa\u63d0\u793a"],
    acceptanceCriteria: story.acceptanceCriteria.length ? story.acceptanceCriteria : ["\u7528\u6237\u80fd\u5b8c\u6210\u8be5\u6545\u4e8b\u5bf9\u5e94\u7684\u4e3b\u6d41\u7a0b"],
    priority: story.priority,
    isMvp: story.isMvp,
    relatedRequirementIds: story.relatedRequirementIds,
    status: "draft",
    version: 1,
    generatedBy: "ai"
  })) : sourceItems.map((item, index) => ({
    projectId,
    role: "\u521d\u7ea7\u4ea7\u54c1\u7ecf\u7406",
    scenario: item.userScenario,
    goal: item.subFeature,
    benefit: item.userValue || "\u66f4\u6e05\u695a\u5730\u63a8\u8fdb\u4ea7\u54c1\u9700\u6c42\u3002",
    storyText: `\u4f5c\u4e3a\u521d\u7ea7\u4ea7\u54c1\u7ecf\u7406\uff0c\u6211\u5e0c\u671b${item.subFeature}\uff0c\u4ee5\u4fbf${item.userValue || "\u66f4\u9ad8\u6548\u5730\u5b8c\u6210\u9700\u6c42\u68b3\u7406\u3002"}`,
    mainFlow: [
      "\u8fdb\u5165\u5bf9\u5e94\u5de5\u4f5c\u6d41\u6b65\u9aa4",
      "\u67e5\u770b AI \u751f\u6210\u7684\u7ed3\u6784\u5316\u5185\u5bb9",
      "\u6839\u636e\u5b9e\u9645\u60c5\u51b5\u4fee\u6539\u6216\u786e\u8ba4",
      "\u8fdb\u5165\u4e0b\u4e00\u4e2a\u4ea7\u54c1\u4ea4\u4ed8\u6b65\u9aa4"
    ],
    exceptionScenarios: [
      "\u4fe1\u606f\u4e0d\u8db3\u65f6\u63d0\u793a\u9700\u8981\u8865\u5145\u6f84\u6e05\u95ee\u9898",
      "\u5185\u5bb9\u4e0d\u51c6\u786e\u65f6\u5141\u8bb8\u91cd\u65b0\u751f\u6210"
    ],
    acceptanceCriteria: [
      "\u7528\u6237\u80fd\u770b\u5230\u6e05\u6670\u7684\u7528\u6237\u6545\u4e8b\u6587\u672c",
      "\u7528\u6237\u80fd\u770b\u5230\u4e3b\u6d41\u7a0b\u548c\u5f02\u5e38\u573a\u666f",
      "\u6bcf\u4e2a\u6545\u4e8b\u90fd\u5305\u542b\u53ef\u9a8c\u6536\u6807\u51c6",
      "\u6545\u4e8b\u80fd\u5173\u8054\u5230\u9700\u6c42\u62c6\u89e3\u9879"
    ],
    priority: item.priority,
    isMvp: item.isMvp,
    relatedRequirementIds: [item.id],
    status: "draft",
    version: 1,
    generatedBy: index === 0 ? "ai" : "ai"
  }));

  if (stories.length === 0) {
    stories.push({
      projectId,
      role: "\u521d\u7ea7\u4ea7\u54c1\u7ecf\u7406",
      scenario: "\u7528\u6237\u9700\u8981\u4ece\u4ea7\u54c1\u60f3\u6cd5\u63a8\u8fdb\u5230\u53ef\u4ea4\u4ed8\u6587\u6863\u3002",
      goal: "\u751f\u6210\u57fa\u7840\u7528\u6237\u6545\u4e8b",
      benefit: "\u5feb\u901f\u5f62\u6210\u53ef\u8bc4\u5ba1\u7684\u9700\u6c42\u8868\u8fbe\u3002",
      storyText: "\u4f5c\u4e3a\u521d\u7ea7\u4ea7\u54c1\u7ecf\u7406\uff0c\u6211\u5e0c\u671b\u751f\u6210\u7528\u6237\u6545\u4e8b\uff0c\u4ee5\u4fbf\u628a\u9700\u6c42\u8f6c\u5316\u4e3a\u7814\u53d1\u548c\u6d4b\u8bd5\u66f4\u5bb9\u6613\u7406\u89e3\u7684\u8868\u8fbe\u3002",
      mainFlow: ["\u70b9\u51fb\u751f\u6210\u7528\u6237\u6545\u4e8b", "\u67e5\u770b\u6545\u4e8b\u5361\u7247", "\u68c0\u67e5\u9a8c\u6536\u6807\u51c6"],
      exceptionScenarios: ["\u7f3a\u5c11\u9700\u6c42\u62c6\u89e3\u65f6\u63d0\u793a\u5148\u5b8c\u6210\u4e0a\u4e00\u6b65"],
      acceptanceCriteria: ["\u81f3\u5c11\u751f\u6210\u4e00\u6761\u7528\u6237\u6545\u4e8b"],
      priority: "P0",
      isMvp: true,
      relatedRequirementIds: [],
      status: "draft",
      version: 1,
      generatedBy: "ai"
    });
  }

  await prisma.userStory.createMany({ data: stories });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "user_story" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "user_story", status: "draft" }
  });

  await writeGenerationLog(
    projectId,
    "user_story",
    "user_stories",
    { count: stories.length },
    { mode: generationMode, modelName }
  );

  return prisma.userStory.findMany({
    where: { projectId, status: "draft" },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });
}

export async function generateWireframePages(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      userStories: true,
      requirementBreakdownItems: true
    }
  });

  await prisma.wireframePage.deleteMany({ where: { projectId, status: "draft" } });

  const storyIds = project.userStories.map((story) => story.id);
  const requirementIds = project.requirementBreakdownItems.map((item) => item.id);
  const productName = project.name || "\u4ea7\u54c1";
  const firstStory = project.userStories[0];

  const pages = [
    {
      projectId,
      pageName: "\u5de5\u4f5c\u53f0\u9996\u9875",
      pageType: "home",
      pageGoal: `\u8ba9\u7528\u6237\u5feb\u901f\u7406\u89e3 ${productName} \u7684\u5f53\u524d\u9879\u76ee\u72b6\u6001\u548c\u4e0b\u4e00\u6b65\u4efb\u52a1\u3002`,
      coreModules: [
        { moduleName: "\u9879\u76ee\u6458\u8981", moduleGoal: "\u5c55\u793a\u4ea7\u54c1\u60f3\u6cd5\u548c\u6838\u5fc3\u76ee\u6807", contentItems: ["\u9879\u76ee\u540d\u79f0", "\u4e00\u53e5\u8bdd\u60f3\u6cd5", "\u76ee\u6807\u7528\u6237"], priority: "P0" },
        { moduleName: "\u5de5\u4f5c\u6d41\u8fdb\u5ea6", moduleGoal: "\u5448\u73b0 8 \u4e2a\u6b65\u9aa4\u7684\u5b8c\u6210\u72b6\u6001", contentItems: ["\u5f53\u524d\u6b65\u9aa4", "\u8349\u7a3f\u72b6\u6001", "\u9700\u66f4\u65b0\u63d0\u793a"], priority: "P0" }
      ],
      keyActions: ["\u8fdb\u5165\u9700\u6c42\u6f84\u6e05", "\u67e5\u770b\u5df2\u751f\u6210\u4ea7\u7269"],
      entryPoints: ["\u9879\u76ee\u5217\u8868"],
      nextPages: ["\u9700\u6c42\u6f84\u6e05\u9875", "\u9700\u6c42\u62c6\u89e3\u9875"],
      relatedUserStoryIds: storyIds,
      relatedRequirementIds: requirementIds,
      states: {
        normal: "\u5c55\u793a\u9879\u76ee\u57fa\u672c\u4fe1\u606f\u548c\u5de5\u4f5c\u6d41\u8fdb\u5ea6",
        empty: "\u5c1a\u672a\u751f\u6210\u4efb\u4f55\u4ea7\u7269\u65f6\u63d0\u793a\u5148\u8fdb\u5165\u9700\u6c42\u6f84\u6e05",
        error: "\u9879\u76ee\u52a0\u8f7d\u5931\u8d25\u65f6\u63d0\u793a\u91cd\u8bd5"
      },
      wireframeText: [
        `${productName} \u5de5\u4f5c\u53f0`,
        "+--------------------------------------+",
        "|\u9879\u76ee\u6458\u8981                              |",
        "|\u4ea7\u54c1\u60f3\u6cd5 / \u76ee\u6807\u7528\u6237 / \u5f53\u524d\u6b65\u9aa4       |",
        "+--------------------------------------+",
        "|\u5de5\u4f5c\u6d41\u8fdb\u5ea6                            |",
        "|\u60f3\u6cd5 -> \u6f84\u6e05 -> \u62c6\u89e3 -> \u6545\u4e8b -> \u539f\u578b |",
        "+--------------------------------------+",
        "|[\u8fdb\u5165\u9700\u6c42\u6f84\u6e05] [\u67e5\u770b\u4ea7\u7269]              |",
        "+--------------------------------------+"
      ].join("\n"),
      status: "draft",
      version: 1,
      generatedBy: "ai"
    },
    {
      projectId,
      pageName: "\u9700\u6c42\u6f84\u6e05\u9875",
      pageType: "form",
      pageGoal: "\u5e2e\u52a9\u7528\u6237\u56de\u7b54\u5173\u952e\u95ee\u9898\uff0c\u8865\u9f50\u9700\u6c42\u80cc\u666f\u3001\u7528\u6237\u548c MVP \u8303\u56f4\u3002",
      coreModules: [
        { moduleName: "\u95ee\u9898\u5361\u7247", moduleGoal: "\u9010\u6761\u5c55\u793a\u6f84\u6e05\u95ee\u9898", contentItems: ["\u95ee\u9898\u6587\u672c", "\u95ee\u9898\u7c7b\u578b", "AI \u5efa\u8bae", "\u7528\u6237\u56de\u7b54"], priority: "P0" },
        { moduleName: "\u4e0b\u4e00\u6b65\u5165\u53e3", moduleGoal: "\u5f15\u5bfc\u7528\u6237\u8fdb\u5165\u9700\u6c42\u62c6\u89e3", contentItems: ["\u8fdb\u5165\u9700\u6c42\u62c6\u89e3\u6309\u94ae"], priority: "P0" }
      ],
      keyActions: ["\u751f\u6210\u6f84\u6e05\u95ee\u9898", "\u4fdd\u5b58\u56de\u7b54", "\u8fdb\u5165\u9700\u6c42\u62c6\u89e3"],
      entryPoints: ["\u5de5\u4f5c\u53f0\u9996\u9875"],
      nextPages: ["\u9700\u6c42\u62c6\u89e3\u9875"],
      relatedUserStoryIds: storyIds,
      relatedRequirementIds: requirementIds,
      states: {
        normal: "\u663e\u793a\u5df2\u751f\u6210\u7684\u95ee\u9898\u5361\u7247",
        empty: "\u672a\u751f\u6210\u95ee\u9898\u65f6\u663e\u793a\u751f\u6210\u6309\u94ae",
        loading: "\u751f\u6210\u95ee\u9898\u6216\u4fdd\u5b58\u56de\u7b54\u65f6\u663e\u793a\u8fdb\u884c\u4e2d"
      },
      wireframeText: [
        "\u9700\u6c42\u6f84\u6e05\u9875",
        "+--------------------------------------+",
        "|\u6807\u9898\uff1a\u9700\u6c42\u6f84\u6e05        [\u751f\u6210\u95ee\u9898] |",
        "+--------------------------------------+",
        "|\u95ee\u9898 1\uff1a\u76ee\u6807\u7528\u6237\u662f\u8c01\uff1f             |",
        "|AI \u5efa\u8bae / \u56de\u7b54\u8f93\u5165\u6846 / [\u4fdd\u5b58]        |",
        "+--------------------------------------+",
        "|\u95ee\u9898 2\uff1a\u6838\u5fc3\u95ee\u9898\u662f\u4ec0\u4e48\uff1f           |",
        "|AI \u5efa\u8bae / \u56de\u7b54\u8f93\u5165\u6846 / [\u4fdd\u5b58]        |",
        "+--------------------------------------+",
        "|[\u8fdb\u5165\u9700\u6c42\u62c6\u89e3]                         |",
        "+--------------------------------------+"
      ].join("\n"),
      status: "draft",
      version: 1,
      generatedBy: "ai"
    },
    {
      projectId,
      pageName: "\u7528\u6237\u6545\u4e8b\u9875",
      pageType: "list",
      pageGoal: `\u5c06\u9700\u6c42\u62c6\u89e3\u7ed3\u679c\u8f6c\u5316\u4e3a\u7528\u6237\u89c6\u89d2\u7684\u6545\u4e8b\u548c\u9a8c\u6536\u6807\u51c6\uff0c\u4f8b\u5982\uff1a${firstStory?.storyText || "\u751f\u6210\u7528\u6237\u6545\u4e8b"}\u3002`,
      coreModules: [
        { moduleName: "\u6545\u4e8b\u5361\u7247", moduleGoal: "\u5c55\u793a\u7528\u6237\u6545\u4e8b\u548c\u9a8c\u6536\u6807\u51c6", contentItems: ["\u89d2\u8272", "\u573a\u666f", "\u76ee\u6807", "\u9a8c\u6536\u6807\u51c6"], priority: "P0" },
        { moduleName: "\u8986\u76d6\u63d0\u793a", moduleGoal: "\u63d0\u793a MVP \u9700\u6c42\u662f\u5426\u5df2\u8986\u76d6", contentItems: ["P0 \u8986\u76d6\u6570", "\u672a\u8986\u76d6\u9700\u6c42"], priority: "P1" }
      ],
      keyActions: ["\u751f\u6210\u7528\u6237\u6545\u4e8b", "\u67e5\u770b\u9a8c\u6536\u6807\u51c6", "\u8fdb\u5165\u4f4e\u4fdd\u771f\u539f\u578b"],
      entryPoints: ["\u9700\u6c42\u62c6\u89e3\u9875"],
      nextPages: ["\u4f4e\u4fdd\u771f\u539f\u578b\u9875", "PRD \u521d\u7a3f\u9875"],
      relatedUserStoryIds: storyIds,
      relatedRequirementIds: requirementIds,
      states: {
        normal: "\u663e\u793a\u7528\u6237\u6545\u4e8b\u5361\u7247",
        empty: "\u672a\u751f\u6210\u6545\u4e8b\u65f6\u63d0\u793a\u5148\u751f\u6210",
        error: "\u751f\u6210\u5931\u8d25\u65f6\u5141\u8bb8\u91cd\u8bd5"
      },
      wireframeText: [
        "\u7528\u6237\u6545\u4e8b\u9875",
        "+--------------------------------------+",
        "|\u6807\u9898\uff1a\u7528\u6237\u6545\u4e8b      [\u751f\u6210\u6545\u4e8b] |",
        "+--------------------------------------+",
        "|\u6545\u4e8b\u5361\u7247                              |",
        "|\u4f5c\u4e3a... \u6211\u5e0c\u671b... \u4ee5\u4fbf...          |",
        "|\u4e3b\u6d41\u7a0b / \u5f02\u5e38\u573a\u666f / \u9a8c\u6536\u6807\u51c6     |",
        "+--------------------------------------+",
        "|[\u8fdb\u5165\u4f4e\u4fdd\u771f\u539f\u578b]                    |",
        "+--------------------------------------+"
      ].join("\n"),
      status: "draft",
      version: 1,
      generatedBy: "ai"
    }
  ];

  await prisma.wireframePage.createMany({ data: pages });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "wireframe" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "wireframe", status: "draft" }
  });

  await writeGenerationLog(projectId, "wireframe", "wireframe_pages", { count: pages.length });

  return prisma.wireframePage.findMany({
    where: { projectId, status: "draft" },
    orderBy: { createdAt: "asc" }
  });
}

export async function generatePrdDocument(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      clarificationQuestions: true,
      requirementBreakdownItems: true,
      userStories: true,
      wireframePages: true
    }
  });

  const answeredQuestions = project.clarificationQuestions.filter((question) => question.userAnswer);
  const mvpItems = project.requirementBreakdownItems.filter((item) => item.isMvp && !item.outOfScope);
  const outOfScopeItems = project.requirementBreakdownItems.filter((item) => item.outOfScope);
  const targetUsers = formatJsonList(project.targetUsers) || "\u6682\u672a\u660e\u786e\u76ee\u6807\u7528\u6237";
  const constraints = formatJsonList(project.constraints) || "\u6682\u65e0\u660e\u786e\u9650\u5236";
  const mainProblem =
    project.clarificationQuestions.find((item) => item.questionType === "problem")?.userAnswer ||
    mvpItems[0]?.userProblem ||
    "\u76ee\u524d\u7528\u6237\u6709\u4ea7\u54c1\u60f3\u6cd5\uff0c\u4f46\u7f3a\u5c11\u7ed3\u6784\u5316\u65b9\u6cd5\u5c06\u5176\u8f6c\u5316\u4e3a\u53ef\u8bc4\u5ba1\u3001\u53ef\u534f\u4f5c\u7684\u9700\u6c42\u6587\u6863\u3002";
  const coreFlow =
    project.clarificationQuestions.find((item) => item.questionType === "user_scenario")?.userAnswer ||
    "\u7528\u6237\u5148\u8f93\u5165\u4ea7\u54c1\u60f3\u6cd5\uff0c\u518d\u9010\u6b65\u5b8c\u6210\u9700\u6c42\u6f84\u6e05\u3001\u9700\u6c42\u62c6\u89e3\u3001\u7528\u6237\u6545\u4e8b\u3001\u4f4e\u4fdd\u771f\u539f\u578b\u548c PRD \u521d\u7a3f\u3002";
  const successMetrics = [
    "\u7528\u6237\u80fd\u5728\u4e00\u4e2a\u5de5\u4f5c\u53f0\u5185\u8dd1\u901a\u4ece\u60f3\u6cd5\u5230 PRD \u7684\u5b8c\u6574\u94fe\u8def",
    "\u9700\u6c42\u62c6\u89e3\u4e2d\u6240\u6709 P0/MVP \u9879\u90fd\u80fd\u6620\u5c04\u5230\u7528\u6237\u6545\u4e8b",
    "\u7528\u6237\u6545\u4e8b\u90fd\u5177\u5907\u53ef\u9a8c\u6536\u6807\u51c6",
    "\u751f\u6210\u7684 PRD \u80fd\u7528\u4e8e\u521d\u6b65\u8bc4\u5ba1\u548c\u4f5c\u54c1\u96c6\u5c55\u793a"
  ];

  const sections = [
    {
      sectionKey: "background",
      title: "\u4ea7\u54c1\u80cc\u666f",
      content: [
        `${project.name} \u7684\u8d77\u70b9\u662f\uff1a${project.ideaText}`,
        `\u5f53\u524d\u6838\u5fc3\u95ee\u9898\u662f\uff1a${mainProblem}`,
        "\u5bf9\u521d\u7ea7\u4ea7\u54c1\u7ecf\u7406\u6765\u8bf4\uff0c\u4ece\u6a21\u7cca\u60f3\u6cd5\u5230\u53ef\u4ea4\u4ed8\u9700\u6c42\u6587\u6863\u4e4b\u95f4\u5b58\u5728\u660e\u663e\u65ad\u70b9\uff1a\u4e0d\u77e5\u9053\u8be5\u95ee\u4ec0\u4e48\u3001\u4e0d\u77e5\u9053\u5982\u4f55\u62c6\u89e3\u8303\u56f4\u3001\u4e0d\u77e5\u9053\u9a8c\u6536\u6807\u51c6\u600e\u4e48\u5199\u3002",
        "\u56e0\u6b64\uff0c\u672c\u4ea7\u54c1\u4e0d\u76f4\u63a5\u751f\u6210\u4e00\u7bc7\u7a7a\u6cdb PRD\uff0c\u800c\u662f\u901a\u8fc7\u591a\u6b65\u5de5\u4f5c\u6d41\u5f15\u5bfc\u7528\u6237\u9010\u6b65\u5b8c\u6210\u9700\u6c42\u6210\u719f\u5316\u3002"
      ].join("\n")
    },
    {
      sectionKey: "goals",
      title: "\u4ea7\u54c1\u76ee\u6807",
      content: [
        "- \u7528\u6237\u76ee\u6807\uff1a\u5e2e\u52a9\u521d\u7ea7 PM \u628a\u4e00\u53e5\u4ea7\u54c1\u60f3\u6cd5\u8f6c\u5316\u4e3a\u53ef\u8bc4\u5ba1\u7684\u9700\u6c42\u65b9\u6848\u3002",
        "- \u4ea7\u54c1\u76ee\u6807\uff1a\u7528\u7ed3\u6784\u5316\u5de5\u4f5c\u6d41\u964d\u4f4e\u5199 PRD\u3001\u62c6\u9700\u6c42\u3001\u5199\u9a8c\u6536\u6807\u51c6\u7684\u95e8\u69db\u3002",
        "- MVP \u76ee\u6807\uff1a\u8dd1\u901a\u4ece\u4ea7\u54c1\u60f3\u6cd5\u5230 PRD \u521d\u7a3f\u7684\u4e3b\u94fe\u8def\uff0c\u4fdd\u8bc1\u6bcf\u4e2a\u9636\u6bb5\u6709\u660e\u786e\u8f93\u5165\u548c\u8f93\u51fa\u3002",
        ...successMetrics.map((metric) => `- \u6210\u529f\u6307\u6807\uff1a${metric}`)
      ].join("\n")
    },
    {
      sectionKey: "users",
      title: "\u76ee\u6807\u7528\u6237",
      content: [
        `- \u6838\u5fc3\u7528\u6237\uff1a${targetUsers}`,
        "- \u7528\u6237\u7279\u5f81\uff1a\u521a\u5165\u95e8\u6216\u6b63\u5728\u8f6c\u5c97\u7684\u4ea7\u54c1\u7ecf\u7406\uff0c\u5df2\u6709\u4ea7\u54c1\u60f3\u6cd5\uff0c\u4f46\u5bf9\u6807\u51c6\u9700\u6c42\u6587\u6863\u548c\u7814\u53d1\u534f\u4f5c\u8868\u8fbe\u4e0d\u591f\u719f\u6089\u3002",
        "- \u4f7f\u7528\u573a\u666f\uff1a\u5199\u4f5c\u54c1\u96c6\u9879\u76ee\u3001\u51c6\u5907\u9762\u8bd5\u5c55\u793a\u3001\u521b\u4e1a\u56e2\u961f\u68b3\u7406\u4ea7\u54c1\u96cf\u5f62\u3001\u628a\u4e1a\u52a1\u60f3\u6cd5\u8f6c\u6362\u6210\u4ea7\u54c1\u6587\u6863\u3002",
        "- \u4f7f\u7528\u7ea6\u675f\uff1a\u7b2c\u4e00\u7248\u5047\u8bbe\u4e3a\u5355\u7528\u6237\u5de5\u4f5c\u53f0\uff0c\u6682\u4e0d\u5904\u7406\u591a\u4eba\u534f\u4f5c\u3001\u590d\u6742\u6743\u9650\u548c\u7b2c\u4e09\u65b9\u5e73\u53f0\u540c\u6b65\u3002",
        `- \u5df2\u77e5\u9650\u5236\uff1a${constraints}`
      ].join("\n")
    },
    {
      sectionKey: "core_flow",
      title: "\u6838\u5fc3\u4f7f\u7528\u6d41\u7a0b",
      content: [
        `- \u7528\u6237\u63cf\u8ff0\u7684\u6838\u5fc3\u6d41\u7a0b\uff1a${coreFlow}`,
        "- \u7cfb\u7edf\u5de5\u4f5c\u6d41\uff1a\u4ea7\u54c1\u60f3\u6cd5 -> \u9700\u6c42\u6f84\u6e05 -> \u9700\u6c42\u62c6\u89e3 -> \u7528\u6237\u6545\u4e8b -> \u4f4e\u4fdd\u771f\u539f\u578b -> PRD \u521d\u7a3f\u3002",
        "- \u6d41\u7a0b\u8bbe\u8ba1\u539f\u5219\uff1a\u4e0a\u4e00\u6b65\u4ea7\u7269\u4f5c\u4e3a\u4e0b\u4e00\u6b65\u8f93\u5165\uff0c\u7528\u6237\u53ef\u5728\u6bcf\u4e00\u6b65\u91cd\u65b0\u751f\u6210\u6216\u8865\u5145\u4fe1\u606f\u3002",
        "- \u9632\u8303\u98ce\u9669\uff1a\u907f\u514d\u4ece\u4e00\u53e5\u8bdd\u76f4\u63a5\u751f\u6210 PRD\uff0c\u964d\u4f4e\u9700\u6c42\u7a7a\u6cdb\u3001\u8303\u56f4\u8fc7\u5927\u548c\u9a8c\u6536\u4e0d\u6e05\u7684\u95ee\u9898\u3002"
      ].join("\n")
    },
    {
      sectionKey: "mvp_scope",
      title: "MVP \u8303\u56f4",
      content: [
        "- \u672c\u671f\u5fc5\u987b\u652f\u6301\u4ece\u9879\u76ee\u521b\u5efa\u5230 PRD \u521d\u7a3f\u7684\u95ed\u73af\u6d41\u7a0b\u3002",
        "- \u672c\u671f\u4f18\u5148\u4fdd\u8bc1\u6bcf\u4e2a\u9636\u6bb5\u7684\u4ea7\u7269\u80fd\u88ab\u67e5\u770b\u3001\u7406\u89e3\u548c\u7ee7\u7eed\u63a8\u8fdb\u3002",
        ...mvpItems.map((item) => `- ${item.featureModule}\uff1a${item.subFeature}\uff08${item.priority}\uff09\u3002\u539f\u56e0\uff1a${item.mvpReason || "\u8be5\u529f\u80fd\u5bf9 MVP \u6838\u5fc3\u94fe\u8def\u5fc5\u8981\u3002"}`)
      ].join("\n") || "- \u6682\u672a\u751f\u6210 MVP \u9700\u6c42"
    },
    {
      sectionKey: "user_stories",
      title: "\u7528\u6237\u6545\u4e8b",
      content: project.userStories
        .map((story) => [
          `### ${story.goal}`,
          `- \u7528\u6237\u6545\u4e8b\uff1a${story.storyText}`,
          `- \u4f7f\u7528\u573a\u666f\uff1a${story.scenario}`,
          `- \u7528\u6237\u6536\u76ca\uff1a${story.benefit}`,
          `- \u4f18\u5148\u7ea7\uff1a${story.priority}`,
          `- \u662f\u5426 MVP\uff1a${story.isMvp ? "\u662f" : "\u5426"}`
        ].join("\n"))
        .join("\n\n") || "- \u6682\u672a\u751f\u6210\u7528\u6237\u6545\u4e8b"
    },
    {
      sectionKey: "page_flow",
      title: "\u9875\u9762\u6d41\u7a0b\u4e0e\u4f4e\u4fdd\u771f\u539f\u578b",
      content: project.wireframePages
        .map((page) => [
          `### ${page.pageName}`,
          `- \u9875\u9762\u76ee\u6807\uff1a${page.pageGoal}`,
          `- \u9875\u9762\u7c7b\u578b\uff1a${page.pageType || "\u901a\u7528\u9875\u9762"}`,
          `- \u5173\u952e\u64cd\u4f5c\uff1a${formatJsonList(page.keyActions) || "\u672a\u586b\u5199"}`,
          `- \u5165\u53e3\u9875\u9762\uff1a${formatJsonList(page.entryPoints) || "\u672a\u586b\u5199"}`,
          `- \u53ef\u8df3\u8f6c\u9875\u9762\uff1a${formatJsonList(page.nextPages) || "\u672a\u586b\u5199"}`
        ].join("\n"))
        .join("\n\n") || "- \u6682\u672a\u751f\u6210\u9875\u9762\u6d41\u7a0b"
    },
    {
      sectionKey: "requirements",
      title: "\u529f\u80fd\u9700\u6c42",
      content: project.requirementBreakdownItems
        .filter((item) => !item.outOfScope)
        .map((item) => [
          `### ${item.featureModule} - ${item.subFeature}`,
          `- \u7528\u6237\u573a\u666f\uff1a${item.userScenario}`,
          `- \u7528\u6237\u95ee\u9898\uff1a${item.userProblem}`,
          `- \u7528\u6237\u4ef7\u503c\uff1a${item.userValue || "\u672a\u586b\u5199"}`,
          `- \u4e1a\u52a1\u89c4\u5219\uff1a\u7528\u6237\u9700\u5148\u5b8c\u6210\u4e0a\u4e00\u6b65\u4fe1\u606f\u8865\u5145\uff0c\u518d\u8fdb\u5165\u672c\u6b65\u9aa4\u751f\u6210\uff1b\u5df2\u751f\u6210\u5185\u5bb9\u53ef\u91cd\u65b0\u751f\u6210\u3002`,
          `- \u5f02\u5e38\u60c5\u51b5\uff1a\u5982\u679c\u4e0a\u6e38\u4fe1\u606f\u4e0d\u8db3\uff0c\u7cfb\u7edf\u5e94\u63d0\u793a\u7528\u6237\u8fd4\u56de\u8865\u5145\u6f84\u6e05\u95ee\u9898\u6216\u9700\u6c42\u62c6\u89e3\u3002`,
          `- \u4f18\u5148\u7ea7\uff1a${item.priority}`,
          `- MVP\uff1a${item.isMvp ? "\u662f" : "\u5426"}`
        ].join("\n"))
        .join("\n\n") || "\u6682\u672a\u751f\u6210\u529f\u80fd\u9700\u6c42\u3002"
    },
    {
      sectionKey: "acceptance",
      title: "\u9a8c\u6536\u6807\u51c6",
      content: project.userStories
        .map((story) => [
          `### ${story.goal}`,
          formatJsonList(story.acceptanceCriteria, "- "),
          "- \u6b63\u5e38\u6d41\u7a0b\uff1a\u7528\u6237\u80fd\u6309\u987a\u5e8f\u5b8c\u6210\u5bf9\u5e94\u64cd\u4f5c\u5e76\u770b\u5230\u7ed3\u679c\u3002",
          "- \u7a7a\u72b6\u6001\uff1a\u5c1a\u672a\u751f\u6210\u5185\u5bb9\u65f6\uff0c\u9875\u9762\u5e94\u7ed9\u51fa\u660e\u786e\u7684\u751f\u6210\u5165\u53e3\u3002",
          "- \u91cd\u65b0\u751f\u6210\uff1a\u7528\u6237\u53ef\u4ee5\u5bf9\u5df2\u6709\u5185\u5bb9\u6267\u884c\u91cd\u65b0\u751f\u6210\u64cd\u4f5c\u3002"
        ].join("\n"))
        .join("\n\n") || "\u6682\u672a\u751f\u6210\u9a8c\u6536\u6807\u51c6\u3002"
    },
    {
      sectionKey: "out_of_scope",
      title: "\u6682\u4e0d\u652f\u6301\u4e8b\u9879",
      content: outOfScopeItems.map((item) => `- ${item.featureModule}\uff1a${item.subFeature}\uff0c\u539f\u56e0\uff1a${item.mvpReason || "\u4e0d\u5f71\u54cd MVP \u9a8c\u8bc1"}`).join("\n") || "- \u6682\u65e0"
    },
    {
      sectionKey: "open_questions",
      title: "\u5f85\u786e\u8ba4\u95ee\u9898",
      content: answeredQuestions.length
        ? answeredQuestions.map((question) => `- ${question.questionText}\n  - \u5f53\u524d\u56de\u7b54\uff1a${question.userAnswer}`).join("\n")
        : "- \u9700\u8865\u5145\u9700\u6c42\u6f84\u6e05\u56de\u7b54"
    }
  ];

  const contentMarkdown = [
    `# ${project.name} PRD \u521d\u7a3f`,
    "",
    `> \u6587\u6863\u7248\u672c\uff1av0.1`,
    `> \u751f\u6210\u6765\u6e90\uff1aProductFlow AI`,
    "",
    ...sections.flatMap((section) => [`## ${section.title}`, section.content, ""])
  ].join("\n");

  const aiPrd = await generatePrdWithLocalAi({
    projectName: project.name,
    ideaText: project.ideaText,
    productType: project.productType,
    targetUsers: project.targetUsers,
    constraints: project.constraints,
    clarificationQuestions: project.clarificationQuestions,
    requirementBreakdownItems: project.requirementBreakdownItems,
    userStories: project.userStories,
    wireframePages: project.wireframePages
  });
  const finalSections = aiPrd?.sections ?? sections;
  const finalContentMarkdown = aiPrd?.contentMarkdown ?? contentMarkdown;
  const generationMode = aiPrd ? "ollama" : "mock";
  const modelName = aiPrd ? "qwen2.5:3b" : "local-mock";

  const prdDocument = await prisma.pRDDocument.upsert({
    where: { projectId },
    update: {
      title: `${project.name} PRD \u521d\u7a3f`,
      docVersion: "v0.1",
      status: "draft",
      contentMarkdown: finalContentMarkdown,
      sections: finalSections,
      sourceArtifactIds: {
        clarificationQuestionIds: project.clarificationQuestions.map((item) => item.id),
        requirementIds: project.requirementBreakdownItems.map((item) => item.id),
        userStoryIds: project.userStories.map((item) => item.id),
        wireframePageIds: project.wireframePages.map((item) => item.id)
      },
      generatedBy: "ai"
    },
    create: {
      projectId,
      title: `${project.name} PRD \u521d\u7a3f`,
      docVersion: "v0.1",
      status: "draft",
      contentMarkdown: finalContentMarkdown,
      sections: finalSections,
      sourceArtifactIds: {
        clarificationQuestionIds: project.clarificationQuestions.map((item) => item.id),
        requirementIds: project.requirementBreakdownItems.map((item) => item.id),
        userStoryIds: project.userStories.map((item) => item.id),
        wireframePageIds: project.wireframePages.map((item) => item.id)
      },
      generatedBy: "ai"
    }
  });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "prd" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "prd", status: "draft" }
  });

  await writeGenerationLog(
    projectId,
    "prd",
    "prd_document",
    { prdDocumentId: prdDocument.id },
    { mode: generationMode, modelName }
  );

  return prdDocument;
}

export async function generateDeliveryItems(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      requirementBreakdownItems: true,
      userStories: true,
      wireframePages: true,
      prdDocument: true
    }
  });

  await prisma.deliveryItem.deleteMany({ where: { projectId } });

  const sourceRequirements = project.requirementBreakdownItems
    .filter((item) => !item.outOfScope)
    .sort((a, b) => a.priority.localeCompare(b.priority));

  const deliveryItems = sourceRequirements.map((item) => {
    const relatedStories = project.userStories.filter((story) =>
      Array.isArray(story.relatedRequirementIds) && story.relatedRequirementIds.includes(item.id)
    );
    const relatedPages = project.wireframePages.filter((page) =>
      Array.isArray(page.relatedRequirementIds) && page.relatedRequirementIds.includes(item.id)
    );
    const storyAcceptance = relatedStories.flatMap((story) =>
      Array.isArray(story.acceptanceCriteria) ? story.acceptanceCriteria.map(String) : []
    );

    return {
      projectId,
      moduleName: item.featureModule,
      requirementName: item.subFeature,
      description: [
        `\u9700\u6c42\u76ee\u6807\uff1a${item.userValue || item.userProblem}`,
        `\u4e1a\u52a1\u573a\u666f\uff1a${item.userScenario}`,
        `PM \u534f\u4f5c\u91cd\u70b9\uff1a\u786e\u8ba4 ${item.featureModule} \u7684\u8fb9\u754c\u3001\u5f02\u5e38\u72b6\u6001\u548c\u9a8c\u6536\u53e3\u5f84\u3002`
      ].join("\n"),
      relatedPageIds: relatedPages.map((page) => page.id),
      relatedUserStoryIds: relatedStories.map((story) => story.id),
      acceptanceCriteria: storyAcceptance.length
        ? storyAcceptance
        : [
            "\u7528\u6237\u80fd\u5b8c\u6210\u8be5\u9700\u6c42\u5bf9\u5e94\u7684\u4e3b\u6d41\u7a0b",
            "\u4fe1\u606f\u4e0d\u5b8c\u6574\u65f6\u9875\u9762\u7ed9\u51fa\u660e\u786e\u63d0\u793a",
            "\u751f\u6210\u7ed3\u679c\u80fd\u88ab\u67e5\u770b\u5e76\u7528\u4e8e\u4e0b\u4e00\u6b65"
          ],
      priority: item.priority,
      versionPlan: item.isMvp ? "MVP" : "v0.2",
      dependencies: buildDependencies(item.priority),
      collaborators: buildCollaborators(item.featureModule),
      deliveryStatus: "todo",
      generatedBy: "ai"
    };
  });

  if (deliveryItems.length === 0) {
    deliveryItems.push({
      projectId,
      moduleName: "\u4ea7\u54c1\u5de5\u4f5c\u6d41",
      requirementName: "\u57fa\u7840\u4ea4\u4ed8\u62c6\u89e3",
      description: "\u5c06\u5df2\u6709 PRD \u521d\u7a3f\u68b3\u7406\u4e3a\u53ef\u8ba8\u8bba\u7684\u7814\u53d1\u534f\u4f5c\u6e05\u5355\u3002",
      relatedPageIds: project.wireframePages.map((page) => page.id),
      relatedUserStoryIds: project.userStories.map((story) => story.id),
      acceptanceCriteria: ["\u81f3\u5c11\u751f\u6210\u4e00\u6761\u4ea4\u4ed8\u62c6\u89e3\u9879"],
      priority: "P0",
      versionPlan: "MVP",
      dependencies: ["\u9700\u8981\u5148\u5b8c\u6210 PRD \u521d\u7a3f"],
      collaborators: ["PM", "\u524d\u7aef", "\u540e\u7aef", "\u6d4b\u8bd5"],
      deliveryStatus: "todo",
      generatedBy: "ai"
    });
  }

  await prisma.deliveryItem.createMany({ data: deliveryItems });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "delivery" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "delivery", status: "draft" }
  });

  await writeGenerationLog(projectId, "delivery", "delivery_items", { count: deliveryItems.length });

  return prisma.deliveryItem.findMany({
    where: { projectId },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });
}

export async function generateReviewReport(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      clarificationQuestions: true,
      requirementBreakdownItems: true,
      userStories: true,
      wireframePages: true,
      prdDocument: true,
      deliveryItems: true
    }
  });

  const requiredQuestions = project.clarificationQuestions.filter((question) => question.isRequired);
  const answeredRequiredQuestions = requiredQuestions.filter((question) => question.userAnswer);
  const mvpRequirements = project.requirementBreakdownItems.filter((item) => item.isMvp && !item.outOfScope);
  const p0Requirements = project.requirementBreakdownItems.filter((item) => item.priority === "P0" && !item.outOfScope);
  const mappedRequirementIds = new Set(
    project.userStories.flatMap((story) =>
      Array.isArray(story.relatedRequirementIds) ? story.relatedRequirementIds.map(String) : []
    )
  );
  const deliveryRequirementNames = new Set(project.deliveryItems.map((item) => item.requirementName));

  const clarificationScore = scoreRatio(answeredRequiredQuestions.length, Math.max(requiredQuestions.length, 1), 20);
  const requirementScore = scoreRatio(mvpRequirements.length, Math.max(p0Requirements.length, 1), 20);
  const storyScore = scoreRatio(mappedRequirementIds.size, Math.max(mvpRequirements.length, 1), 20);
  const prototypeScore = project.wireframePages.length >= 3 ? 15 : project.wireframePages.length >= 1 ? 10 : 0;
  const deliveryScore = scoreRatio(deliveryRequirementNames.size, Math.max(mvpRequirements.length, 1), 15);
  const prdScore = project.prdDocument ? 10 : 0;
  const overallScore = Math.min(
    100,
    clarificationScore + requirementScore + storyScore + prototypeScore + deliveryScore + prdScore
  );

  const issues = [
    ...(answeredRequiredQuestions.length < requiredQuestions.length
      ? [{
          level: "high",
          title: "\u5fc5\u586b\u6f84\u6e05\u95ee\u9898\u672a\u5b8c\u5168\u56de\u7b54",
          detail: "\u76ee\u6807\u7528\u6237\u3001\u6838\u5fc3\u95ee\u9898\u3001MVP \u8303\u56f4\u7b49\u4fe1\u606f\u4e0d\u5b8c\u6574\u65f6\uff0c\u540e\u7eed PRD \u548c\u9a8c\u6536\u6807\u51c6\u5bb9\u6613\u53d8\u7a7a\u3002",
          suggestion: "\u5148\u8fd4\u56de\u9700\u6c42\u6f84\u6e05\u6b65\u9aa4\uff0c\u8865\u9f50\u6240\u6709\u5fc5\u586b\u95ee\u9898\u3002"
        }]
      : []),
    ...(mvpRequirements.length === 0
      ? [{
          level: "high",
          title: "MVP \u8303\u56f4\u4e0d\u6e05\u6670",
          detail: "\u5f53\u524d\u6ca1\u6709\u660e\u786e\u7684 MVP \u9700\u6c42\u9879\uff0c\u5bb9\u6613\u5bfc\u81f4\u5f00\u53d1\u8303\u56f4\u5931\u63a7\u3002",
          suggestion: "\u5728\u9700\u6c42\u62c6\u89e3\u4e2d\u6807\u51fa P0/MVP \u9700\u6c42\u548c\u6682\u4e0d\u652f\u6301\u4e8b\u9879\u3002"
        }]
      : []),
    ...(mappedRequirementIds.size < mvpRequirements.length
      ? [{
          level: "medium",
          title: "\u90e8\u5206 MVP \u9700\u6c42\u672a\u8986\u76d6\u5230\u7528\u6237\u6545\u4e8b",
          detail: "\u9700\u6c42\u62c6\u89e3\u548c\u7528\u6237\u6545\u4e8b\u4e4b\u95f4\u8fd8\u6709\u7f3a\u53e3\uff0c\u7814\u53d1\u548c\u6d4b\u8bd5\u53ef\u80fd\u65e0\u6cd5\u6309\u6545\u4e8b\u7406\u89e3\u9700\u6c42\u4ef7\u503c\u3002",
          suggestion: "\u91cd\u65b0\u751f\u6210\u6216\u8865\u5145\u7528\u6237\u6545\u4e8b\uff0c\u786e\u4fdd\u6bcf\u4e2a MVP \u9700\u6c42\u90fd\u6709\u6545\u4e8b\u548c\u9a8c\u6536\u6807\u51c6\u3002"
        }]
      : []),
    ...(project.wireframePages.length === 0
      ? [{
          level: "medium",
          title: "\u7f3a\u5c11\u4f4e\u4fdd\u771f\u539f\u578b",
          detail: "\u6ca1\u6709\u9875\u9762\u6e05\u5355\u548c\u8df3\u8f6c\u5173\u7cfb\u65f6\uff0c\u9700\u6c42\u5f88\u96be\u8f6c\u5316\u4e3a\u5177\u4f53\u754c\u9762\u548c\u4ea4\u4e92\u3002",
          suggestion: "\u751f\u6210\u4f4e\u4fdd\u771f\u539f\u578b\uff0c\u68b3\u7406\u9875\u9762\u6e05\u5355\u3001\u6a21\u5757\u548c\u8df3\u8f6c\u5173\u7cfb\u3002"
        }]
      : []),
    ...(project.deliveryItems.length === 0
      ? [{
          level: "low",
          title: "\u5c1a\u672a\u5f62\u6210\u4ea4\u4ed8\u62c6\u89e3",
          detail: "\u7f3a\u5c11\u9762\u5411\u7814\u53d1\u548c\u6d4b\u8bd5\u7684\u534f\u4f5c\u6e05\u5355\uff0c\u4e0d\u5229\u4e8e\u5c55\u793a PM \u7684\u63a8\u8fdb\u80fd\u529b\u3002",
          suggestion: "\u751f\u6210\u4ea4\u4ed8\u62c6\u89e3\uff0c\u8865\u5145\u4f9d\u8d56\u3001\u534f\u4f5c\u89d2\u8272\u548c\u6d4b\u8bd5\u9a8c\u6536\u70b9\u3002"
        }]
      : [])
  ];

  const risks = [
    "\u5f53\u524d\u4ea7\u7269\u4ecd\u7136\u662f AI \u751f\u6210\u521d\u7a3f\uff0c\u9700\u8981 PM \u57fa\u4e8e\u771f\u5b9e\u4e1a\u52a1\u80cc\u666f\u6821\u6b63\u3002",
    "\u5982\u679c\u76ee\u6807\u7528\u6237\u548c\u6838\u5fc3\u95ee\u9898\u4e0d\u591f\u805a\u7126\uff0c\u540e\u7eed\u4efb\u52a1\u62c6\u89e3\u4f1a\u51fa\u73b0\u8303\u56f4\u8fc7\u5927\u7684\u98ce\u9669\u3002",
    "\u5982\u679c\u9a8c\u6536\u6807\u51c6\u53ea\u505c\u7559\u5728\u6587\u5b57\u63cf\u8ff0\uff0c\u6d4b\u8bd5\u9636\u6bb5\u8fd8\u9700\u8981\u8fdb\u4e00\u6b65\u8f6c\u6210\u5177\u4f53\u7528\u4f8b\u3002"
  ];
  const suggestions = [
    "\u5148\u5b8c\u6210\u6240\u6709\u5fc5\u586b\u9700\u6c42\u6f84\u6e05\u95ee\u9898\uff0c\u518d\u751f\u6210\u4e0b\u6e38\u4ea7\u7269\u3002",
    "\u5bf9 P0/MVP \u9700\u6c42\u9010\u6761\u68c0\u67e5\uff1a\u662f\u5426\u6709\u7528\u6237\u6545\u4e8b\u3001\u9875\u9762\u627f\u8f7d\u3001\u9a8c\u6536\u6807\u51c6\u548c\u4ea4\u4ed8\u9879\u3002",
    "\u5728\u4f5c\u54c1\u96c6\u4e2d\u5c55\u793a\u8fd9\u4e2a\u8bc4\u5ba1\u62a5\u544a\uff0c\u53ef\u4ee5\u4f53\u73b0\u4f60\u5bf9\u9700\u6c42\u5b8c\u6574\u6027\u548c\u7814\u53d1\u534f\u4f5c\u98ce\u9669\u7684\u7406\u89e3\u3002"
  ];
  const nextActions = [
    "\u8865\u5145\u672a\u56de\u7b54\u7684\u9700\u6c42\u6f84\u6e05\u95ee\u9898",
    "\u91cd\u65b0\u751f\u6210\u9700\u6c42\u62c6\u89e3\u548c\u7528\u6237\u6545\u4e8b\uff0c\u4fdd\u6301\u4e0a\u4e0b\u6e38\u4e00\u81f4",
    "\u6839\u636e\u8bc4\u5ba1\u95ee\u9898\u4fee\u8ba2 PRD \u521d\u7a3f",
    "\u5c06\u4ea4\u4ed8\u62c6\u89e3\u8f6c\u6362\u4e3a\u5f00\u53d1\u4efb\u52a1\u6216\u9762\u8bd5\u5c55\u793a\u6750\u6599"
  ];

  const report = await prisma.reviewReport.create({
    data: {
      projectId,
      overallScore,
      conclusion: buildReviewConclusion(overallScore),
      readinessStatus: overallScore >= 85 ? "ready" : overallScore >= 65 ? "needs_revision" : "not_ready",
      dimensionScores: {
        clarification: clarificationScore,
        requirement: requirementScore,
        userStory: storyScore,
        wireframe: prototypeScore,
        delivery: deliveryScore,
        prd: prdScore
      },
      issues,
      risks,
      suggestions,
      nextActions,
      reviewedArtifactIds: {
        clarificationQuestionIds: project.clarificationQuestions.map((item) => item.id),
        requirementIds: project.requirementBreakdownItems.map((item) => item.id),
        userStoryIds: project.userStories.map((item) => item.id),
        wireframePageIds: project.wireframePages.map((item) => item.id),
        deliveryItemIds: project.deliveryItems.map((item) => item.id),
        prdDocumentId: project.prdDocument?.id ?? null
      }
    }
  });

  await prisma.stepStatus.upsert({
    where: { projectId_stepKey: { projectId, stepKey: "review" } },
    update: { status: "draft" },
    create: { projectId, stepKey: "review", status: "draft" }
  });

  await writeGenerationLog(projectId, "review", "review_report", { reviewReportId: report.id, overallScore });

  return report;
}

async function writeGenerationLog(
  projectId: string,
  stepKey: string,
  artifactType: string,
  outputSnapshot: object,
  options: { mode?: string; modelName?: string } = {}
) {
  await prisma.generationLog.create({
    data: {
      projectId,
      stepKey,
      artifactType,
      mode: options.mode ?? "mock",
      outputSnapshot,
      modelName: options.modelName ?? "local-mock",
      status: "completed",
      completedAt: new Date()
    }
  });
}

function formatJsonList(value: unknown, prefix = "") {
  if (Array.isArray(value)) {
    return value.map((item) => `${prefix}${String(item)}`).join("\n");
  }
  if (typeof value === "string") return value;
  return "";
}

function buildDependencies(priority: string) {
  if (priority === "P0") {
    return [
      "\u9700\u5148\u786e\u8ba4\u9700\u6c42\u8303\u56f4\u548c\u9a8c\u6536\u6807\u51c6",
      "\u9700\u524d\u7aef\u786e\u8ba4\u9875\u9762\u72b6\u6001\u548c\u4ea4\u4e92",
      "\u9700\u540e\u7aef\u786e\u8ba4\u6570\u636e\u7ed3\u6784\u548c\u63a5\u53e3\u8fb9\u754c"
    ];
  }

  return [
    "\u4f9d\u8d56 P0 \u6838\u5fc3\u6d41\u7a0b\u7a33\u5b9a\u540e\u518d\u8fdb\u884c",
    "\u9700 PM \u6839\u636e\u5f00\u53d1\u8d44\u6e90\u786e\u8ba4\u662f\u5426\u7eb3\u5165\u5f53\u671f"
  ];
}

function buildCollaborators(moduleName: string) {
  const base = ["PM", "\u524d\u7aef", "\u540e\u7aef", "\u6d4b\u8bd5"];
  if (moduleName.includes("\u539f\u578b") || moduleName.includes("\u9875\u9762")) {
    return [...base, "UI/UX"];
  }
  if (moduleName.includes("\u8fd0\u8425") || moduleName.includes("\u5185\u5bb9")) {
    return [...base, "\u4ea7\u54c1/\u8fd0\u8425"];
  }
  return base;
}

function scoreRatio(done: number, total: number, maxScore: number) {
  if (total <= 0) return 0;
  return Math.round(Math.min(done / total, 1) * maxScore);
}

function buildReviewConclusion(score: number) {
  if (score >= 85) {
    return "\u9700\u6c42\u4ea7\u7269\u5df2\u8f83\u5b8c\u6574\uff0c\u53ef\u4ee5\u7528\u4e8e\u521d\u6b65\u8bc4\u5ba1\u3001\u4f5c\u54c1\u96c6\u5c55\u793a\u6216\u8fdb\u4e00\u6b65\u8f6c\u5165\u5f00\u53d1\u4efb\u52a1\u3002";
  }
  if (score >= 65) {
    return "\u9700\u6c42\u94fe\u8def\u5df2\u57fa\u672c\u5f62\u6210\uff0c\u4f46\u4ecd\u9700\u8865\u5145\u90e8\u5206\u5173\u952e\u4fe1\u606f\u548c\u4e0a\u4e0b\u6e38\u6620\u5c04\u5173\u7cfb\u3002";
  }
  return "\u5f53\u524d\u4ea7\u7269\u8fd8\u4e0d\u9002\u5408\u76f4\u63a5\u8fdb\u5165\u8bc4\u5ba1\uff0c\u5efa\u8bae\u5148\u8865\u9f50\u9700\u6c42\u6f84\u6e05\u3001MVP \u8303\u56f4\u548c\u9a8c\u6536\u6807\u51c6\u3002";
}
