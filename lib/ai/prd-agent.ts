import { generateWithOllama, getOllamaModel } from "./ollama";

export type PrdSection = {
  sectionKey: string;
  title: string;
  content: string;
};

type GeneratePrdInput = {
  projectName: string;
  ideaText: string;
  productType: string | null;
  targetUsers: unknown;
  constraints: unknown;
  clarificationQuestions: Array<{
    questionText: string;
    questionType: string;
    userAnswer: string | null;
  }>;
  requirementBreakdownItems: Array<{
    featureModule: string;
    subFeature: string;
    priority: string;
    isMvp: boolean;
    outOfScope: boolean;
    userScenario: string;
    userProblem: string;
    userValue: string | null;
    mvpReason: string | null;
  }>;
  userStories: Array<{
    goal: string;
    storyText: string;
    priority: string;
    isMvp: boolean;
    acceptanceCriteria: unknown;
  }>;
  wireframePages: Array<{
    pageName: string;
    pageType: string | null;
    pageGoal: string;
    keyActions: unknown;
    nextPages: unknown;
  }>;
};

type AiPrdOutput = {
  sections: PrdSection[];
  contentMarkdown: string;
};

export async function generatePrdWithLocalAi(input: GeneratePrdInput): Promise<AiPrdOutput | null> {
  try {
    const raw = await generateWithOllama({
      model: getOllamaModel(),
      temperature: 0.2,
      system: [
        "\u4f60\u662f\u4e00\u540d\u8d44\u6df1 AI \u4ea7\u54c1\u7ecf\u7406\uff0c\u64c5\u957f\u5c06\u4ea7\u54c1\u60f3\u6cd5\u3001\u9700\u6c42\u6f84\u6e05\u3001\u7528\u6237\u6545\u4e8b\u548c\u539f\u578b\u4fe1\u606f\u6574\u7406\u6210\u4e13\u4e1a PRD\u3002",
        "\u8bf7\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981\u8f93\u51fa Markdown \u4ee3\u7801\u5757\uff0c\u4e0d\u8981\u8f93\u51fa\u89e3\u91ca\u3002"
      ].join("\n"),
      prompt: buildPrdPrompt(input)
    });

    const parsed = parseJsonObject(raw);
    if (!parsed || !Array.isArray(parsed.sections)) return null;

    const sections = parsed.sections
      .map((item: unknown, index: number) => normalizeSection(item, index))
      .filter((item): item is PrdSection => Boolean(item));

    if (sections.length < 5) return null;

    return {
      sections,
      contentMarkdown: buildMarkdownFromSections(input.projectName, sections)
    };
  } catch (error) {
    console.warn("Ollama PRD generation failed, fallback to mock.", error);
    return null;
  }
}

function buildPrdPrompt(input: GeneratePrdInput) {
  return [
    "\u8bf7\u57fa\u4e8e\u4ee5\u4e0b\u9879\u76ee\u4fe1\u606f\uff0c\u751f\u6210\u4e00\u4efd\u4e2d\u6587 PRD \u521d\u7a3f\u3002",
    "\u8981\u6c42\uff1a",
    "1. \u5185\u5bb9\u5fc5\u987b\u7d27\u6263\u7528\u6237\u8f93\u5165\uff0c\u4e0d\u8981\u5199\u7a7a\u6cdb\u5957\u8bdd\u3002",
    "2. \u9762\u5411\u521d\u7ea7 PM \u4f5c\u54c1\u96c6\uff0c\u65e2\u8981\u4e13\u4e1a\uff0c\u4e5f\u8981\u5bb9\u6613\u8bb2\u7ed9\u9762\u8bd5\u5b98\u542c\u3002",
    "3. sections \u751f\u6210 8 \u4e2a\u7ae0\u8282\uff1a\u4ea7\u54c1\u80cc\u666f\u3001\u76ee\u6807\u7528\u6237\u3001\u6838\u5fc3\u95ee\u9898\u3001MVP \u8303\u56f4\u3001\u6838\u5fc3\u6d41\u7a0b\u3001\u529f\u80fd\u9700\u6c42\u3001\u9a8c\u6536\u6807\u51c6\u3001\u98ce\u9669\u4e0e\u5f85\u786e\u8ba4\u3002",
    "4. \u6bcf\u4e2a section.content \u7528\u6362\u884c\u5206\u9694\u6bb5\u843d\uff0c\u53ef\u7528 '- ' \u8868\u793a\u5217\u8868\uff0c\u53ef\u7528 '### ' \u8868\u793a\u5c0f\u6807\u9898\u3002",
    "5. \u8f93\u51fa JSON \u683c\u5f0f\uff1a{\"sections\":[{\"sectionKey\":\"background\",\"title\":\"...\",\"content\":\"...\"}]}",
    "",
    "\u9879\u76ee\u4fe1\u606f\uff1a",
    JSON.stringify(toPromptContext(input), null, 2)
  ].join("\n");
}

function toPromptContext(input: GeneratePrdInput) {
  return {
    projectName: input.projectName,
    ideaText: input.ideaText,
    productType: input.productType,
    targetUsers: input.targetUsers,
    constraints: input.constraints,
    clarificationAnswers: input.clarificationQuestions.map((item) => ({
      question: item.questionText,
      type: item.questionType,
      answer: item.userAnswer || "\u672a\u56de\u7b54"
    })),
    requirements: input.requirementBreakdownItems.slice(0, 6).map((item) => ({
      module: item.featureModule,
      requirement: item.subFeature,
      priority: item.priority,
      isMvp: item.isMvp,
      outOfScope: item.outOfScope,
      scenario: item.userScenario,
      problem: item.userProblem,
      value: item.userValue,
      mvpReason: item.mvpReason
    })),
    userStories: input.userStories.slice(0, 6).map((item) => ({
      goal: item.goal,
      storyText: item.storyText,
      priority: item.priority,
      isMvp: item.isMvp,
      acceptanceCriteria: item.acceptanceCriteria
    })),
    wireframes: input.wireframePages.slice(0, 4).map((item) => ({
      pageName: item.pageName,
      pageType: item.pageType,
      pageGoal: item.pageGoal,
      keyActions: item.keyActions,
      nextPages: item.nextPages
    }))
  };
}

function parseJsonObject(raw: string) {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    }
    return null;
  }
}

function normalizeSection(value: unknown, index: number) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const title = String(record.title || "").trim();
  const content = String(record.content || "").trim();
  if (!title || !content) return null;

  return {
    sectionKey: String(record.sectionKey || `section_${index}`).replace(/[^a-zA-Z0-9_-]/g, "_"),
    title,
    content
  };
}

function buildMarkdownFromSections(projectName: string, sections: PrdSection[]) {
  return [
    `# ${projectName} PRD \u521d\u7a3f`,
    "",
    `> \u751f\u6210\u6765\u6e90\uff1aProductFlow AI / Ollama qwen2.5:3b`,
    "",
    ...sections.flatMap((section) => [`## ${section.title}`, section.content, ""])
  ].join("\n");
}
