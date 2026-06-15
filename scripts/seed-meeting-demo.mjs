import "./seed-demo.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

await new Promise((resolve) => setTimeout(resolve, 500));
await loadEnv(path.join(process.cwd(), ".env"));
const prisma = new PrismaClient();

try {
  const project = await prisma.project.findFirstOrThrow({
    where: { name: "AI 面试复盘助手（演示案例）" },
    include: {
      clarificationQuestions: true,
      requirementBreakdownItems: true,
      userStories: true,
      wireframePages: true,
      knowledgeDocuments: true,
      prdDocument: true,
      reviewReports: true
    }
  });

  await prisma.project.update({
    where: { id: project.id },
    data: {
      name: "智能会议行动项助手（演示案例）",
      ideaText: "帮助项目团队从会议纪要中识别决策、负责人、截止时间和行动项，并持续跟踪任务状态。",
      targetUsers: ["项目经理", "产品经理", "研发团队"],
      constraints: ["MVP 仅支持文本会议纪要", "AI 提取结果必须由参与者确认"]
    }
  });

  const answers = [
    "需要频繁组织项目会议并跟踪执行结果的产品经理和项目经理。",
    "会后任务散落在纪要和聊天记录中，责任人及截止时间不清晰。",
    "会议结束后粘贴纪要，系统提取行动项并由参与者确认。",
    "把非结构化会议内容转化为可分派、可追踪的协作任务。",
    "纪要录入、行动项提取、责任人确认、截止时间和状态跟踪。",
    "用户能在 5 分钟内完成确认，且关键任务均有负责人和截止时间。"
  ];
  await Promise.all(project.clarificationQuestions.map((item, index) =>
    prisma.clarificationQuestion.update({
      where: { id: item.id },
      data: { userAnswer: answers[index] ?? item.userAnswer }
    })
  ));

  const requirements = [
    ["会议纪要", "录入或粘贴会议纪要"],
    ["行动项提取", "识别任务、负责人和截止时间"],
    ["人工确认", "确认并修正 AI 提取结果"],
    ["任务跟踪", "查看行动项状态和逾期提醒"]
  ];
  await Promise.all(project.requirementBreakdownItems.map((item, index) =>
    prisma.requirementBreakdownItem.update({
      where: { id: item.id },
      data: {
        featureModule: requirements[index]?.[0] ?? item.featureModule,
        subFeature: requirements[index]?.[1] ?? item.subFeature,
        userScenario: "团队完成项目会议后，需要快速确认并跟踪后续任务。",
        userProblem: "行动项散落在纪要中，容易遗漏责任人、截止时间和依赖关系。",
        userValue: "将会议结论快速转化为可执行、可追踪的协作任务。",
        risks: ["纪要表述模糊可能导致负责人或时间识别不准确"]
      }
    })
  ));

  await Promise.all(project.userStories.map((item, index) =>
    prisma.userStory.update({
      where: { id: item.id },
      data: {
        role: "项目成员",
        scenario: "会议结束后整理和跟踪行动项",
        goal: ["录入会议纪要", "提取行动项", "确认任务信息"][index] ?? item.goal,
        benefit: "减少会后遗漏并提高团队执行透明度。",
        storyText: `作为项目成员，我希望${["快速录入会议纪要", "自动识别任务与负责人", "确认和修正行动项"][index] ?? "跟踪任务"}，以便团队按时推进会议决策。`,
        exceptionScenarios: ["负责人或截止时间缺失时标记待确认"]
      }
    })
  ));

  const pages = [
    ["项目首页", "查看会议和行动项总体状态"],
    ["纪要录入页", "录入会议内容和参会人员"],
    ["行动项确认页", "确认任务、负责人、截止时间和状态"]
  ];
  await Promise.all(project.wireframePages.map((item, index) =>
    prisma.wireframePage.update({
      where: { id: item.id },
      data: {
        pageName: pages[index]?.[0] ?? item.pageName,
        pageGoal: pages[index]?.[1] ?? item.pageGoal
      }
    })
  ));

  for (const document of project.knowledgeDocuments) {
    await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: {
        fileName: "会议行动项提取规范.md",
        content: "行动项必须包含任务内容、负责人、截止时间和状态。AI 不得自行指定未在纪要中出现的负责人；信息不足时应标记为待确认。"
      }
    });
    await prisma.knowledgeChunk.updateMany({
      where: { documentId: document.id },
      data: {
        content: "行动项必须包含任务内容、负责人、截止时间和状态。AI 不得自行指定未在纪要中出现的负责人；信息不足时应标记为待确认。"
      }
    });
  }

  if (project.prdDocument) {
    const sections = [
      { sectionKey: "background", title: "产品背景", content: "会议产生大量非结构化信息，行动项容易因责任和时间边界不清而遗漏。" },
      { sectionKey: "users", title: "目标用户", content: "产品经理、项目经理和研发团队成员。" },
      { sectionKey: "scope", title: "MVP 范围", content: "纪要录入、行动项提取、人工确认和任务状态跟踪。" },
      { sectionKey: "requirements", title: "核心需求", content: requirements.map((item) => `- ${item[0]}：${item[1]}`).join("\n") },
      { sectionKey: "acceptance", title: "验收标准", content: "- AI 结果标记为草稿\n- 已确认任务包含负责人和状态\n- 信息缺失时标记待确认" },
      { sectionKey: "sources", title: "知识库依据", content: "- 会议行动项提取规范.md：任务字段要求与 AI 输出边界。" }
    ];
    await prisma.pRDDocument.update({
      where: { id: project.prdDocument.id },
      data: {
        title: "智能会议行动项助手 PRD",
        sections,
        contentMarkdown: ["# 智能会议行动项助手 PRD", ...sections.flatMap((item) => [`## ${item.title}`, item.content])].join("\n\n")
      }
    });
  }

  if (project.reviewReports[0]) {
    await prisma.reviewReport.update({
      where: { id: project.reviewReports[0].id },
      data: {
        conclusion: "从会议纪要到行动项跟踪的核心闭环完整，可用于 MVP 评审和技术面试演示。",
        issues: ["实时语音转写不在 MVP 范围"],
        risks: ["AI 提取的负责人和截止时间需要人工确认"],
        suggestions: ["后续接入企业通讯录和日历"],
        nextActions: ["开展 5 个项目团队的可用性测试"]
      }
    });
  }

  console.log(`Meeting demo created: http://localhost:3000/workspace/${project.id}`);
} finally {
  await prisma.$disconnect();
}

async function loadEnv(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
