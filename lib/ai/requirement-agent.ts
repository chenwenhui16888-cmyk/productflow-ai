import { asStringArray, generateJsonWithLocalAi, isRecord } from "./structured-agent";

export type AiRequirementItem = {
  userScenario: string;
  userProblem: string;
  userValue: string;
  featureModule: string;
  subFeature: string;
  priority: string;
  isMvp: boolean;
  mvpReason: string;
  outOfScope: boolean;
  assumptions: string[];
  risks: string[];
};

type RequirementInput = {
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
  knowledgeContext?: string;
};

export async function generateRequirementsWithLocalAi(input: RequirementInput) {
  return generateJsonWithLocalAi(
    [
      "\u4f60\u662f\u8d44\u6df1 AI \u4ea7\u54c1\u7ecf\u7406\uff0c\u8bf7\u4ece PM \u89c6\u89d2\u505a\u9700\u6c42\u62c6\u89e3\u3002",
      "\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981 Markdown\uff0c\u4e0d\u8981\u89e3\u91ca\u3002"
    ].join("\n"),
    buildPrompt(input),
    validateRequirements
  );
}

function buildPrompt(input: RequirementInput) {
  return [
    "\u8bf7\u57fa\u4e8e\u9879\u76ee\u4fe1\u606f\u751f\u6210 4-6 \u6761\u9700\u6c42\u62c6\u89e3\u9879\u3002",
    "\u8981\u6c42\uff1a",
    "1. \u4e0d\u8981\u53ea\u6539\u5199\u8f93\u5165\uff0c\u8981\u63a8\u7406\u771f\u5b9e\u4e1a\u52a1\u6a21\u5757\u3001\u7528\u6237\u573a\u666f\u3001\u4f18\u5148\u7ea7\u548c\u98ce\u9669\u3002",
    "2. P0 \u53ea\u653e MVP \u4e3b\u94fe\u8def\uff0cP1/P2 \u653e\u8f85\u52a9\u6216\u53ef\u5ef6\u540e\u529f\u80fd\u3002",
    "3. \u81f3\u5c11 3 \u6761 isMvp=true\uff0c\u81f3\u5c11 1 \u6761 outOfScope=true\u3002",
    "4. \u8f93\u51fa JSON\uff1a{\"items\":[{\"userScenario\":\"...\",\"userProblem\":\"...\",\"userValue\":\"...\",\"featureModule\":\"...\",\"subFeature\":\"...\",\"priority\":\"P0\",\"isMvp\":true,\"mvpReason\":\"...\",\"outOfScope\":false,\"assumptions\":[\"...\"],\"risks\":[\"...\"]}]}",
    "5. 如果提供了项目知识库，请优先遵守其中的业务规则；资料未覆盖的内容必须作为假设或风险，不得伪造事实。",
    "",
    JSON.stringify({
      projectName: input.projectName,
      ideaText: input.ideaText,
      productType: input.productType,
      targetUsers: input.targetUsers,
      constraints: input.constraints,
      answers: input.clarificationQuestions.map((item) => ({
        question: item.questionText,
        type: item.questionType,
        answer: item.userAnswer || "\u672a\u56de\u7b54"
      }))
    }, null, 2),
    "",
    "项目知识库检索结果：",
    input.knowledgeContext || "未提供知识库资料。"
  ].join("\n");
}

function validateRequirements(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items = value.items.map(normalizeRequirement).filter((item): item is AiRequirementItem => Boolean(item));
  return items.length >= 3 ? items.slice(0, 6) : null;
}

function normalizeRequirement(value: unknown) {
  if (!isRecord(value)) return null;
  const featureModule = String(value.featureModule || "").trim();
  const subFeature = String(value.subFeature || "").trim();
  const userScenario = String(value.userScenario || "").trim();
  const userProblem = String(value.userProblem || "").trim();
  const userValue = String(value.userValue || "").trim();
  if (!featureModule || !subFeature || !userScenario || !userProblem || !userValue) return null;

  return {
    userScenario,
    userProblem,
    userValue,
    featureModule,
    subFeature,
    priority: normalizePriority(value.priority),
    isMvp: Boolean(value.isMvp),
    mvpReason: String(value.mvpReason || "\u8be5\u9700\u6c42\u5bf9\u9a8c\u8bc1\u6838\u5fc3\u4ef7\u503c\u5fc5\u8981\u3002"),
    outOfScope: Boolean(value.outOfScope),
    assumptions: asStringArray(value.assumptions),
    risks: asStringArray(value.risks)
  };
}

function normalizePriority(value: unknown) {
  const priority = String(value || "P1").toUpperCase();
  return ["P0", "P1", "P2"].includes(priority) ? priority : "P1";
}
