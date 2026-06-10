import type { getProjectWorkspace } from "./service";

type Workspace = NonNullable<Awaited<ReturnType<typeof getProjectWorkspace>>>;

export function buildProjectMarkdown(project: Workspace) {
  const lines = [
    `# ${project.name}`,
    "",
    `> \u5bfc\u51fa\u6765\u6e90\uff1aProductFlow AI`,
    `> \u6700\u540e\u66f4\u65b0\uff1a${formatDate(project.updatedAt)}`,
    "",
    "## \u4ea7\u54c1\u60f3\u6cd5",
    "",
    `- \u4ea7\u54c1\u7c7b\u578b\uff1a${project.productType || "\u672a\u586b\u5199"}`,
    `- \u76ee\u6807\u7528\u6237\uff1a${formatList(project.targetUsers)}`,
    `- \u9650\u5236\u6761\u4ef6\uff1a${formatList(project.constraints)}`,
    "",
    project.ideaText,
    "",
    "## \u9700\u6c42\u6f84\u6e05",
    "",
    ...project.clarificationQuestions.flatMap((question, index) => [
      `### ${index + 1}. ${question.questionText}`,
      "",
      `- \u95ee\u9898\u7c7b\u578b\uff1a${question.questionType}`,
      `- AI \u5efa\u8bae\uff1a${question.aiSuggestion || "\u65e0"}`,
      `- \u7528\u6237\u56de\u7b54\uff1a${question.userAnswer || "\u672a\u56de\u7b54"}`,
      ""
    ]),
    "## \u9700\u6c42\u62c6\u89e3",
    "",
    ...project.requirementBreakdownItems.flatMap((item, index) => [
      `### ${index + 1}. ${item.featureModule} - ${item.subFeature}`,
      "",
      `- \u4f18\u5148\u7ea7\uff1a${item.priority}`,
      `- \u662f\u5426 MVP\uff1a${item.isMvp ? "\u662f" : "\u5426"}`,
      `- \u6682\u4e0d\u652f\u6301\uff1a${item.outOfScope ? "\u662f" : "\u5426"}`,
      `- \u7528\u6237\u573a\u666f\uff1a${item.userScenario}`,
      `- \u7528\u6237\u95ee\u9898\uff1a${item.userProblem}`,
      `- \u7528\u6237\u4ef7\u503c\uff1a${item.userValue || "\u672a\u586b\u5199"}`,
      `- MVP \u7406\u7531\uff1a${item.mvpReason || "\u672a\u586b\u5199"}`,
      ""
    ]),
    "## \u7528\u6237\u6545\u4e8b",
    "",
    ...project.userStories.flatMap((story, index) => [
      `### ${index + 1}. ${story.goal}`,
      "",
      story.storyText,
      "",
      `- \u4f18\u5148\u7ea7\uff1a${story.priority}`,
      `- \u662f\u5426 MVP\uff1a${story.isMvp ? "\u662f" : "\u5426"}`,
      "- \u4e3b\u6d41\u7a0b\uff1a",
      formatMarkdownList(story.mainFlow),
      "- \u9a8c\u6536\u6807\u51c6\uff1a",
      formatMarkdownList(story.acceptanceCriteria),
      ""
    ]),
    "## \u4f4e\u4fdd\u771f\u539f\u578b",
    "",
    ...project.wireframePages.flatMap((page, index) => [
      `### ${index + 1}. ${page.pageName}`,
      "",
      `- \u9875\u9762\u7c7b\u578b\uff1a${page.pageType || "\u672a\u586b\u5199"}`,
      `- \u9875\u9762\u76ee\u6807\uff1a${page.pageGoal}`,
      `- \u5173\u952e\u64cd\u4f5c\uff1a${formatList(page.keyActions)}`,
      `- \u8df3\u8f6c\u9875\u9762\uff1a${formatList(page.nextPages)}`,
      "",
      page.wireframeText ? ["```text", page.wireframeText, "```"].join("\n") : "\u6682\u65e0\u7ebf\u6846\u6587\u672c",
      ""
    ]),
    "## PRD \u521d\u7a3f",
    "",
    project.prdDocument?.contentMarkdown || "\u6682\u672a\u751f\u6210 PRD",
    "",
    "## \u4ea4\u4ed8\u62c6\u89e3",
    "",
    ...project.deliveryItems.flatMap((item, index) => [
      `### ${index + 1}. ${item.moduleName} - ${item.requirementName}`,
      "",
      `- \u4f18\u5148\u7ea7\uff1a${item.priority}`,
      `- \u7248\u672c\u8ba1\u5212\uff1a${item.versionPlan}`,
      `- \u72b6\u6001\uff1a${formatDeliveryStatus(item.deliveryStatus)}`,
      "",
      item.description,
      "",
      "- \u6d4b\u8bd5\u9a8c\u6536\u70b9\uff1a",
      formatMarkdownList(item.acceptanceCriteria),
      "- \u4f9d\u8d56\uff1a",
      formatMarkdownList(item.dependencies),
      "- \u534f\u4f5c\u89d2\u8272\uff1a",
      formatMarkdownList(item.collaborators),
      ""
    ]),
    "## \u8d28\u91cf\u8bc4\u5ba1",
    "",
    ...formatReview(project.reviewReports[0])
  ];

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function buildExportFileName(projectName: string) {
  const safeName = projectName.replace(/[\\/:*?"<>|]/g, "-").trim() || "ProductFlow-AI";
  return `${safeName}-ProductFlow-AI.doc`;
}

export function buildProjectWordHtml(project: Workspace) {
  const markdown = buildProjectMarkdown(project);
  const body = markdownToWordHtml(markdown);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(project.name)} - ProductFlow AI</title>
  <style>
    body {
      font-family: "Microsoft YaHei", Arial, sans-serif;
      color: #111827;
      line-height: 1.65;
      max-width: 860px;
      margin: 36px auto;
      padding: 0 36px;
    }
    h1 {
      font-size: 28px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin: 0 0 22px;
    }
    h2 {
      font-size: 21px;
      margin: 30px 0 12px;
      padding-left: 10px;
      border-left: 5px solid #2563eb;
    }
    h3 {
      font-size: 16px;
      margin: 22px 0 8px;
      color: #1f2937;
    }
    p {
      margin: 8px 0;
    }
    ul {
      margin: 8px 0 12px 22px;
      padding: 0;
    }
    li {
      margin: 4px 0;
    }
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      background: #f3f4f6;
      border-left: 4px solid #9ca3af;
      color: #4b5563;
    }
    pre {
      white-space: pre-wrap;
      font-family: Consolas, "Microsoft YaHei", monospace;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 12px;
      border-radius: 6px;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function formatReview(report: Workspace["reviewReports"][number] | undefined) {
  if (!report) return ["\u6682\u672a\u751f\u6210\u8d28\u91cf\u8bc4\u5ba1"];

  return [
    `- \u603b\u5206\uff1a${report.overallScore}`,
    `- \u72b6\u6001\uff1a${formatReadiness(report.readinessStatus)}`,
    `- \u7ed3\u8bba\uff1a${report.conclusion}`,
    "",
    "### \u4e3b\u8981\u95ee\u9898",
    formatIssueList(report.issues),
    "### \u98ce\u9669\u63d0\u793a",
    formatMarkdownList(report.risks),
    "### \u4fee\u6539\u5efa\u8bae",
    formatMarkdownList(report.suggestions),
    "### \u4e0b\u4e00\u6b65\u884c\u52a8",
    formatMarkdownList(report.nextActions)
  ];
}

function formatIssueList(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "- \u6682\u65e0";

  return value
    .map((item) => {
      if (!isRecord(item)) return `- ${String(item)}`;
      return `- ${String(item.title || "\u672a\u547d\u540d\u95ee\u9898")}\n  - \u8bf4\u660e\uff1a${String(item.detail || "\u6682\u65e0")}\n  - \u5efa\u8bae\uff1a${String(item.suggestion || "\u6682\u65e0")}`;
    })
    .join("\n");
}

function formatMarkdownList(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "- \u6682\u65e0";
  return value.map((item) => `- ${String(item)}`).join("\n");
}

function formatList(value: unknown) {
  if (Array.isArray(value) && value.length > 0) return value.map(String).join("\u3001");
  if (typeof value === "string" && value.trim()) return value;
  return "\u672a\u586b\u5199";
}

function formatDeliveryStatus(status: string) {
  if (status === "todo") return "\u5f85\u5904\u7406";
  if (status === "doing") return "\u8fdb\u884c\u4e2d";
  if (status === "done") return "\u5df2\u5b8c\u6210";
  return status;
}

function formatReadiness(status: string) {
  if (status === "ready") return "\u53ef\u8fdb\u5165\u521d\u6b65\u8bc4\u5ba1";
  if (status === "needs_revision") return "\u9700\u4fee\u8ba2\u540e\u8bc4\u5ba1";
  return "\u6682\u4e0d\u5efa\u8bae\u8bc4\u5ba1";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function markdownToWordHtml(markdown: string) {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inList = false;
  let inPre = false;
  let preLines: string[] = [];

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inPre) {
        html.push(`<pre>${escapeHtml(preLines.join("\n"))}</pre>`);
        preLines = [];
        inPre = false;
      } else {
        closeList();
        inPre = true;
      }
      continue;
    }

    if (inPre) {
      preLines.push(line);
      continue;
    }

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeList();
      html.push(`<blockquote>${escapeHtml(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(trimmed)}</p>`);
  }

  closeList();
  if (inPre) {
    html.push(`<pre>${escapeHtml(preLines.join("\n"))}</pre>`);
  }

  return html.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
