import { asStringArray, generateJsonWithLocalAi, isRecord } from "./structured-agent";

export type AiUserStory = {
  role: string;
  scenario: string;
  goal: string;
  benefit: string;
  storyText: string;
  mainFlow: string[];
  exceptionScenarios: string[];
  acceptanceCriteria: string[];
  priority: string;
  isMvp: boolean;
  relatedRequirementIds: string[];
};

type StoryInput = {
  projectName: string;
  ideaText: string;
  requirementBreakdownItems: Array<{
    id: string;
    featureModule: string;
    subFeature: string;
    priority: string;
    isMvp: boolean;
    userScenario: string;
    userProblem: string;
    userValue: string | null;
  }>;
};

export async function generateUserStoriesWithLocalAi(input: StoryInput) {
  return generateJsonWithLocalAi(
    [
      "\u4f60\u662f\u8d44\u6df1 AI \u4ea7\u54c1\u7ecf\u7406\uff0c\u8bf7\u57fa\u4e8e\u9700\u6c42\u62c6\u89e3\u5199\u7528\u6237\u6545\u4e8b\u3002",
      "\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981 Markdown\uff0c\u4e0d\u8981\u89e3\u91ca\u3002"
    ].join("\n"),
    buildPrompt(input),
    (value) => validateStories(value, input.requirementBreakdownItems.map((item) => item.id))
  );
}

function buildPrompt(input: StoryInput) {
  return [
    "\u8bf7\u4e3a P0/MVP \u9700\u6c42\u751f\u6210 3-5 \u6761\u7528\u6237\u6545\u4e8b\u3002",
    "\u8981\u6c42\uff1a",
    "1. \u4e0d\u8981\u5199\u6cdb\u6cdb\u7684\u201c\u67e5\u770b AI \u5185\u5bb9\u201d\uff0c\u8981\u5199\u5177\u4f53\u4e1a\u52a1\u573a\u666f\u3001\u4e3b\u6d41\u7a0b\u3001\u5f02\u5e38\u573a\u666f\u548c\u53ef\u6d4b\u8bd5\u9a8c\u6536\u70b9\u3002",
    "2. relatedRequirementIds \u5fc5\u987b\u4f7f\u7528\u8f93\u5165\u4e2d\u7684 requirement id\u3002",
    "3. \u8f93\u51fa JSON\uff1a{\"stories\":[{\"role\":\"...\",\"scenario\":\"...\",\"goal\":\"...\",\"benefit\":\"...\",\"storyText\":\"...\"," +
      "\"mainFlow\":[\"...\"],\"exceptionScenarios\":[\"...\"],\"acceptanceCriteria\":[\"...\"],\"priority\":\"P0\",\"isMvp\":true,\"relatedRequirementIds\":[\"...\"]}]}",
    "",
    JSON.stringify({
      projectName: input.projectName,
      ideaText: input.ideaText,
      requirements: input.requirementBreakdownItems
        .filter((item) => item.isMvp || item.priority === "P0")
        .slice(0, 6)
        .map((item) => ({
          id: item.id,
          module: item.featureModule,
          requirement: item.subFeature,
          priority: item.priority,
          isMvp: item.isMvp,
          scenario: item.userScenario,
          problem: item.userProblem,
          value: item.userValue
        }))
    }, null, 2)
  ].join("\n");
}

function validateStories(value: unknown, validIds: string[]) {
  if (!isRecord(value) || !Array.isArray(value.stories)) return null;
  const validIdSet = new Set(validIds);
  const stories = value.stories
    .map((item) => normalizeStory(item, validIdSet))
    .filter((item): item is AiUserStory => Boolean(item));
  return stories.length >= 2 ? stories.slice(0, 5) : null;
}

function normalizeStory(value: unknown, validIds: Set<string>) {
  if (!isRecord(value)) return null;
  const storyText = String(value.storyText || "").trim();
  const goal = String(value.goal || "").trim();
  if (!storyText || !goal) return null;
  const relatedRequirementIds = asStringArray(value.relatedRequirementIds).filter((id) => validIds.has(id));
  if (relatedRequirementIds.length === 0) return null;

  return {
    role: String(value.role || "\u7528\u6237"),
    scenario: String(value.scenario || ""),
    goal,
    benefit: String(value.benefit || ""),
    storyText,
    mainFlow: asStringArray(value.mainFlow),
    exceptionScenarios: asStringArray(value.exceptionScenarios),
    acceptanceCriteria: asStringArray(value.acceptanceCriteria),
    priority: normalizePriority(value.priority),
    isMvp: Boolean(value.isMvp),
    relatedRequirementIds
  };
}

function normalizePriority(value: unknown) {
  const priority = String(value || "P1").toUpperCase();
  return ["P0", "P1", "P2"].includes(priority) ? priority : "P1";
}
