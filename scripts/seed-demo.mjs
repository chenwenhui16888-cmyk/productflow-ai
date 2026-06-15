import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

await loadEnv(path.join(process.cwd(), ".env"));
const prisma = new PrismaClient();
const demoName = "AI 面试复盘助手（演示案例）";

try {
  await prisma.project.deleteMany({ where: { name: demoName } });
  const project = await prisma.project.create({
    data: {
      name: demoName,
      ideaText: "帮助求职者整理面试记录，识别回答中的问题并生成可执行的改进建议。",
      productType: "Web 应用",
      targetUsers: ["应届毕业生", "转岗求职者"],
      constraints: ["MVP 仅支持文本记录", "AI 内容必须由用户确认"],
      currentStep: "review",
      stepStatuses: {
        create: ["idea", "clarification", "requirement_breakdown", "user_story", "wireframe", "prd", "delivery", "review"]
          .map((stepKey) => ({ stepKey, status: "confirmed", confirmedAt: new Date() }))
      },
      clarificationQuestions: {
        create: [
          ["target_user", "核心目标用户是谁？", "正在准备校招或转岗面试、缺乏系统复盘方法的求职者。"],
          ["problem", "用户最需要解决的问题是什么？", "面试结束后只能凭印象回忆，无法定位回答薄弱点。"],
          ["user_scenario", "典型使用场景是什么？", "用户在面试结束后粘贴问题和回答，生成复盘清单。"],
          ["value", "产品核心价值是什么？", "把模糊的面试感受转化为具体、可执行的改进动作。"],
          ["mvp_scope", "MVP 范围是什么？", "文本录入、问题分类、回答分析、改进建议和历史复盘。"],
          ["success", "怎样衡量成功？", "用户能在 10 分钟内完成一次复盘并获得至少三条可执行建议。"]
        ].map(([questionType, questionText, userAnswer], index) => ({
          questionType,
          questionText,
          userAnswer,
          answerStatus: "answered",
          isRequired: index < 5,
          status: "confirmed"
        }))
      },
      knowledgeDocuments: {
        create: [
          {
            fileName: "面试复盘评分规范.md",
            content: "回答评价分为结构完整性、事实证据、岗位匹配度和表达清晰度。AI 只能给出建议，不能声称用户一定能通过面试。",
            chunks: {
              create: [{
                projectId: "placeholder",
                chunkIndex: 0,
                content: "回答评价分为结构完整性、事实证据、岗位匹配度和表达清晰度。AI 只能给出建议，不能声称用户一定能通过面试。",
                embedding: [1, 0, 0, 0]
              }]
            }
          }
        ]
      }
    }
  });

  // Nested chunk creation needs the real project id for project-level isolation.
  await prisma.knowledgeChunk.updateMany({
    where: { document: { projectId: project.id } },
    data: { projectId: project.id }
  });

  const requirements = await Promise.all([
    ["复盘录入", "录入面试问题与个人回答", "P0", true],
    ["回答分析", "按评分维度识别回答问题", "P0", true],
    ["改进计划", "生成可执行的改进建议", "P0", true],
    ["历史管理", "查看历次面试复盘记录", "P1", true]
  ].map(([featureModule, subFeature, priority, isMvp]) =>
    prisma.requirementBreakdownItem.create({
      data: {
        projectId: project.id,
        featureModule,
        subFeature,
        priority,
        isMvp,
        userScenario: "用户完成一次面试后，希望快速形成结构化复盘。",
        userProblem: "依靠记忆复盘容易遗漏问题，也不知道如何改进。",
        userValue: "获得清晰的问题定位和下一步行动。",
        mvpReason: "属于从录入到改进建议的核心闭环。",
        assumptions: ["用户愿意提供文本形式的面试记录"],
        risks: ["AI 建议可能缺少岗位上下文"],
        status: "confirmed"
      }
    })
  ));

  await Promise.all(requirements.slice(0, 3).map((requirement, index) =>
    prisma.userStory.create({
      data: {
        projectId: project.id,
        role: "求职者",
        scenario: "面试结束后进行复盘",
        goal: ["记录面试内容", "定位回答问题", "制定改进计划"][index],
        benefit: "提高下一次面试准备的针对性。",
        storyText: `作为求职者，我希望${["记录面试问题和回答", "看到回答中的具体问题", "获得下一步练习建议"][index]}，以便持续提升面试表现。`,
        mainFlow: ["输入内容", "系统分析", "用户确认结果"],
        exceptionScenarios: ["信息不足时提示补充，不虚构事实"],
        acceptanceCriteria: ["结果明确标记为 AI 草稿", "用户可以查看具体改进动作"],
        relatedRequirementIds: [requirement.id],
        priority: "P0",
        isMvp: true,
        status: "confirmed"
      }
    })
  ));

  await Promise.all([
    ["项目首页", "查看复盘进度和历史记录"],
    ["复盘录入页", "录入问题、回答和岗位信息"],
    ["分析结果页", "查看评分、问题和改进建议"]
  ].map(([pageName, pageGoal], index) =>
    prisma.wireframePage.create({
      data: {
        projectId: project.id,
        pageName,
        pageGoal,
        pageType: ["home", "form", "result"][index],
        coreModules: ["标题区", "主要内容区", "操作区"],
        keyActions: ["查看", "确认", "进入下一步"],
        entryPoints: index ? ["上一页面"] : ["项目列表"],
        nextPages: index < 2 ? [["复盘录入页"], ["分析结果页"]][index] : [],
        relatedUserStoryIds: [],
        relatedRequirementIds: requirements.map((item) => item.id),
        states: ["默认", "加载", "空状态", "错误"],
        wireframeText: `[顶部导航]\n[${pageName}]\n[主要内容]\n[主操作按钮]`,
        status: "confirmed"
      }
    })
  ));

  const sections = [
    { sectionKey: "background", title: "产品背景", content: "求职者面试后缺少结构化复盘方法，难以把感受转化为改进行动。" },
    { sectionKey: "users", title: "目标用户", content: "应届毕业生和转岗求职者。" },
    { sectionKey: "scope", title: "MVP 范围", content: "文本录入、回答分析、改进建议和历史复盘。" },
    { sectionKey: "requirements", title: "功能需求", content: requirements.map((item) => `- ${item.featureModule}：${item.subFeature}`).join("\n") },
    { sectionKey: "acceptance", title: "验收标准", content: "- 用户可完成一次完整复盘\n- AI 内容标记为草稿\n- 信息不足时展示待确认事项" },
    { sectionKey: "sources", title: "知识库依据", content: "- 面试复盘评分规范.md：评价维度与 AI 输出边界。" }
  ];
  await prisma.pRDDocument.create({
    data: {
      projectId: project.id,
      title: `${demoName} PRD`,
      docVersion: "v1.0-demo",
      status: "confirmed",
      sections,
      contentMarkdown: [`# ${demoName} PRD`, ...sections.flatMap((item) => [`## ${item.title}`, item.content])].join("\n\n"),
      sourceArtifactIds: requirements.map((item) => item.id)
    }
  });

  await Promise.all(requirements.map((item) =>
    prisma.deliveryItem.create({
      data: {
        projectId: project.id,
        moduleName: item.featureModule,
        requirementName: item.subFeature,
        description: `完成${item.subFeature}的前端交互、后端数据和测试验收。`,
        acceptanceCriteria: ["正常流程可用", "异常状态有明确提示"],
        priority: item.priority,
        versionPlan: "MVP",
        collaborators: ["产品", "前端", "后端", "测试"]
      }
    })
  ));

  await prisma.reviewReport.create({
    data: {
      projectId: project.id,
      overallScore: 86,
      conclusion: "核心闭环完整，可用于 MVP 评审和面试演示。",
      readinessStatus: "ready_with_questions",
      dimensionScores: { clarification: 90, requirement: 88, story: 85, prototype: 82, prd: 86 },
      issues: ["真实语音转写不在 MVP 范围"],
      risks: ["AI 建议需要用户确认"],
      suggestions: ["后续加入岗位 JD 上下文"],
      nextActions: ["开展 5 名求职者可用性测试"],
      reviewedArtifactIds: requirements.map((item) => item.id)
    }
  });

  console.log(`Demo created: http://localhost:3000/workspace/${project.id}`);
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
