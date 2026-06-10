export const WORKFLOW_STEPS = [
  {
    key: "idea",
    label: "\u4ea7\u54c1\u60f3\u6cd5",
    description: "\u8bb0\u5f55\u4ea7\u54c1\u540d\u79f0\u3001\u4e00\u53e5\u8bdd\u60f3\u6cd5\u3001\u4ea7\u54c1\u7c7b\u578b\u548c\u76ee\u6807\u7528\u6237\u3002"
  },
  {
    key: "clarification",
    label: "\u9700\u6c42\u6f84\u6e05",
    description: "\u751f\u6210\u5173\u952e\u95ee\u9898\uff0c\u8865\u9f50\u80cc\u666f\u3001\u7528\u6237\u3001\u8303\u56f4\u548c\u7ea6\u675f\u3002"
  },
  {
    key: "requirement_breakdown",
    label: "\u9700\u6c42\u62c6\u89e3",
    description: "\u62c6\u89e3\u573a\u666f\u3001\u95ee\u9898\u3001\u6a21\u5757\u3001\u4f18\u5148\u7ea7\u3001MVP \u8303\u56f4\u548c\u6682\u4e0d\u652f\u6301\u4e8b\u9879\u3002"
  },
  {
    key: "user_story",
    label: "\u7528\u6237\u6545\u4e8b",
    description: "\u751f\u6210\u7528\u6237\u6545\u4e8b\u3001\u4e3b\u6d41\u7a0b\u3001\u5f02\u5e38\u573a\u666f\u548c\u9a8c\u6536\u6807\u51c6\u3002"
  },
  {
    key: "wireframe",
    label: "\u4f4e\u4fdd\u771f\u539f\u578b",
    description: "\u751f\u6210\u9875\u9762\u6e05\u5355\u3001\u9875\u9762\u6d41\u548c\u4f4e\u4fdd\u771f\u7ebf\u6846\u9884\u89c8\u3002"
  },
  {
    key: "prd",
    label: "PRD \u521d\u7a3f",
    description: "\u57fa\u4e8e\u5df2\u786e\u8ba4\u7684\u4e0a\u6e38\u4ea7\u7269\u751f\u6210\u53ef\u9884\u89c8\u7684 PRD \u521d\u7a3f\u3002"
  },
  {
    key: "delivery",
    label: "\u4ea4\u4ed8\u62c6\u89e3",
    description: "\u4ece PM \u89c6\u89d2\u6574\u7406\u4ea4\u4ed8\u6e05\u5355\u3001\u4f18\u5148\u7ea7\u3001\u4f9d\u8d56\u548c\u534f\u4f5c\u5bf9\u8c61\u3002"
  },
  {
    key: "review",
    label: "\u8d28\u91cf\u8bc4\u5ba1",
    description: "\u68c0\u67e5\u9700\u6c42\u6210\u719f\u5ea6\u3001\u53ef\u6d4b\u8bd5\u6027\u3001\u5b8c\u6574\u6027\u548c\u534f\u4f5c\u98ce\u9669\u3002"
  }
] as const;

export type StepKey = (typeof WORKFLOW_STEPS)[number]["key"];

export const STEP_KEYS = WORKFLOW_STEPS.map((step) => step.key);

export const STEP_LABEL_MAP = Object.fromEntries(
  WORKFLOW_STEPS.map((step) => [step.key, step.label])
) as Record<StepKey, string>;

export function getStepLabel(stepKey: string) {
  return STEP_LABEL_MAP[stepKey as StepKey] ?? stepKey;
}
