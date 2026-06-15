import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
await loadEnv(path.join(root, ".env"));
const prisma = new PrismaClient();
const ragCases = JSON.parse(await fs.readFile(path.join(root, "evaluation/rag-cases.json"), "utf8"));
const generationCases = JSON.parse(await fs.readFile(path.join(root, "evaluation/generation-cases.json"), "utf8"));
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const generationModel = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

const startedAt = new Date();
let projectId;

try {
  const project = await prisma.project.create({
    data: {
      name: "ProductFlow AI 自动评测",
      ideaText: "用于评测项目级 RAG 检索和结构化生成稳定性",
      productType: "evaluation",
      targetUsers: ["测试脚本"],
      constraints: ["运行结束后自动清理"],
      status: "evaluation"
    }
  });
  projectId = project.id;

  const ragResult = await evaluateRag(project.id);
  const generationResult = await evaluateGeneration();
  const report = buildReport(ragResult, generationResult);
  const resultDir = path.join(root, "evaluation/results");
  await fs.mkdir(resultDir, { recursive: true });
  await fs.writeFile(path.join(resultDir, "latest.json"), JSON.stringify({
    generatedAt: new Date().toISOString(),
    rag: ragResult,
    generation: generationResult
  }, null, 2));
  await fs.writeFile(path.join(resultDir, "latest.md"), report);
  console.log(report);
} finally {
  if (projectId) await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
  await prisma.$disconnect();
}

async function evaluateRag(projectId) {
  const documents = [];
  let embeddingMode = "ollama";
  const ingestionTimes = [];

  for (const item of ragCases.documents) {
    const start = performance.now();
    const chunks = splitDocument(item.content);
    const vectors = [];
    for (const chunk of chunks) {
      const result = await embedText(chunk);
      vectors.push(result.vector);
      embeddingMode = result.mode === "fallback" ? "fallback" : embeddingMode;
    }
    const document = await prisma.knowledgeDocument.create({
      data: {
        projectId,
        fileName: item.fileName,
        content: item.content,
        chunks: {
          create: chunks.map((content, index) => ({
            projectId,
            chunkIndex: index,
            content,
            embedding: vectors[index]
          }))
        }
      }
    });
    documents.push(document);
    ingestionTimes.push(performance.now() - start);
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where: { projectId },
    include: { document: { select: { fileName: true } } }
  });
  const details = [];

  for (const testCase of ragCases.queries) {
    const start = performance.now();
    const query = await embedText(testCase.query);
    const ranked = chunks
      .map((chunk) => ({
        fileName: chunk.document.fileName,
        score: cosine(query.vector, toNumbers(chunk.embedding))
      }))
      .sort((left, right) => right.score - left.score);
    const elapsedMs = performance.now() - start;
    details.push({
      query: testCase.query,
      expected: testCase.expected,
      top1: ranked[0]?.fileName ?? null,
      top4: ranked.slice(0, 4).map((item) => item.fileName),
      top1Score: round(ranked[0]?.score ?? 0, 4),
      top1Hit: ranked[0]?.fileName === testCase.expected,
      top4Hit: ranked.slice(0, 4).some((item) => item.fileName === testCase.expected),
      elapsedMs: round(elapsedMs, 1)
    });
  }

  return {
    documentCount: documents.length,
    chunkCount: chunks.length,
    queryCount: details.length,
    topK: 4,
    embeddingModel: embeddingMode === "ollama" ? embeddingModel : "local-hash-embedding",
    embeddingMode,
    top1Accuracy: ratio(details.filter((item) => item.top1Hit).length, details.length),
    top4Recall: ratio(details.filter((item) => item.top4Hit).length, details.length),
    averageQueryMs: average(details.map((item) => item.elapsedMs)),
    p50QueryMs: percentile(details.map((item) => item.elapsedMs), 0.5),
    p95QueryMs: percentile(details.map((item) => item.elapsedMs), 0.95),
    averageIngestionMs: average(ingestionTimes),
    details
  };
}

async function evaluateGeneration() {
  const details = [];
  for (const item of generationCases) {
    const prompt = [
      "只输出 JSON，不要 Markdown 或解释。",
      "根据产品想法生成 3 条需求，格式：",
      '{"items":[{"module":"模块","requirement":"需求","priority":"P0","acceptance":["标准1","标准2"]}]}',
      JSON.stringify(item)
    ].join("\n");
    const start = performance.now();
    try {
      const raw = await ollamaGenerate(prompt);
      const strictParsed = tryJson(raw);
      const recoveredParsed = strictParsed || recoverJson(raw);
      const firstValid = validateGeneration(recoveredParsed);
      let repaired = null;
      let repairAttempted = false;
      if (!firstValid) {
        repairAttempted = true;
        const repairedRaw = await ollamaGenerate([
          prompt,
          "",
          "上一次输出未通过 Schema 校验，请修复后只输出完整 JSON。",
          raw
        ].join("\n"));
        repaired = recoverJson(repairedRaw);
      }
      const finalValid = firstValid || validateGeneration(repaired);
      details.push({
        name: item.name,
        requestSucceeded: true,
        strictJsonParsed: Boolean(strictParsed),
        recoveredJsonParsed: Boolean(recoveredParsed),
        schemaValid: firstValid,
        repairAttempted,
        repairSucceeded: !firstValid && finalValid,
        finalSchemaValid: finalValid,
        finalSucceededWithFallback: true,
        elapsedMs: round(performance.now() - start, 1)
      });
    } catch (error) {
      details.push({
        name: item.name,
        requestSucceeded: false,
        strictJsonParsed: false,
        recoveredJsonParsed: false,
        schemaValid: false,
        repairAttempted: false,
        repairSucceeded: false,
        finalSchemaValid: false,
        finalSucceededWithFallback: true,
        elapsedMs: round(performance.now() - start, 1),
        error: String(error)
      });
    }
  }
  return {
    caseCount: details.length,
    model: generationModel,
    requestSuccessRate: ratio(details.filter((item) => item.requestSucceeded).length, details.length),
    strictJsonParseRate: ratio(details.filter((item) => item.strictJsonParsed).length, details.length),
    recoveredJsonParseRate: ratio(details.filter((item) => item.recoveredJsonParsed).length, details.length),
    schemaValidationRate: ratio(details.filter((item) => item.schemaValid).length, details.length),
    repairedSchemaValidationRate: ratio(details.filter((item) => item.finalSchemaValid).length, details.length),
    repairSuccessRate: ratio(
      details.filter((item) => item.repairSucceeded).length,
      details.filter((item) => item.repairAttempted).length
    ),
    finalSuccessRateWithFallback: ratio(details.filter((item) => item.finalSucceededWithFallback).length, details.length),
    fallbackRate: ratio(details.filter((item) => !item.schemaValid).length, details.length),
    averageMs: average(details.map((item) => item.elapsedMs)),
    p50Ms: percentile(details.map((item) => item.elapsedMs), 0.5),
    p95Ms: percentile(details.map((item) => item.elapsedMs), 0.95),
    details
  };
}

async function ollamaGenerate(prompt) {
  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: generationModel, prompt, stream: false, format: "json", options: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  return String(data.response || "");
}

async function embedText(text) {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: embeddingModel, input: text }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Embedding HTTP ${response.status}`);
    const data = await response.json();
    const vector = data.embeddings?.[0] || data.embedding;
    if (!Array.isArray(vector) || !vector.length) throw new Error("Empty embedding");
    return { vector, mode: "ollama" };
  } catch {
    return { vector: hashEmbedding(text), mode: "fallback" };
  }
}

function splitDocument(content, maxLength = 700, overlap = 100) {
  const paragraphs = content.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (`${current}\n\n${paragraph}`.length <= maxLength) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    } else {
      if (current) chunks.push(current);
      current = `${current.slice(-overlap)}\n${paragraph}`.trim().slice(0, maxLength);
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [content.slice(0, maxLength)];
}

function hashEmbedding(text, dimensions = 256) {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/\s+/g, " ");
  for (let index = 0; index < normalized.length; index += 1) {
    const token = normalized.slice(index, index + 3);
    let hash = 2166136261;
    for (const char of token) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function cosine(left, right) {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return dot / ((Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) || 1);
}

function tryJson(raw) {
  try { return JSON.parse(raw.trim()); } catch { return null; }
}

function recoverJson(raw) {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const direct = tryJson(cleaned);
  if (direct) return direct;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return start >= 0 && end > start ? tryJson(cleaned.slice(start, end + 1)) : null;
}

function validateGeneration(value) {
  return Boolean(
    value &&
    Array.isArray(value.items) &&
    value.items.length === 3 &&
    value.items.every((item) =>
      typeof item.module === "string" &&
      typeof item.requirement === "string" &&
      ["P0", "P1", "P2"].includes(item.priority) &&
      Array.isArray(item.acceptance) &&
      item.acceptance.length >= 2
    )
  );
}

function buildReport(rag, generation) {
  return `# ProductFlow AI 自动化评测报告

生成时间：${new Date().toLocaleString("zh-CN")}

## 测试规模

- 产品生成用例：${generation.caseCount} 组
- RAG 测试文档：${rag.documentCount} 份
- RAG 标注查询：${rag.queryCount} 条
- 向量模式：${rag.embeddingMode}（${rag.embeddingModel}）

## 结构化生成

| 指标 | 结果 |
| --- | ---: |
| 模型请求成功率 | ${percent(generation.requestSuccessRate)} |
| JSON 首次严格解析成功率 | ${percent(generation.strictJsonParseRate)} |
| 清洗恢复后解析成功率 | ${percent(generation.recoveredJsonParseRate)} |
| Schema 校验通过率 | ${percent(generation.schemaValidationRate)} |
| 自动修复后 Schema 通过率 | ${percent(generation.repairedSchemaValidationRate)} |
| 修复尝试成功率 | ${percent(generation.repairSuccessRate)} |
| 加入降级后的最终成功率 | ${percent(generation.finalSuccessRateWithFallback)} |
| 降级触发率 | ${percent(generation.fallbackRate)} |
| 平均响应时间 | ${generation.averageMs} ms |
| P50 / P95 | ${generation.p50Ms} / ${generation.p95Ms} ms |

## RAG 检索

| 指标 | 结果 |
| --- | ---: |
| Top-1 来源命中率 | ${percent(rag.top1Accuracy)} |
| Top-4 来源召回率 | ${percent(rag.top4Recall)} |
| 平均检索耗时 | ${rag.averageQueryMs} ms |
| P50 / P95 | ${rag.p50QueryMs} / ${rag.p95QueryMs} ms |
| 平均文档入库耗时 | ${rag.averageIngestionMs} ms |

## 说明

- 生成测试使用固定的 10 类产品想法，要求模型输出三条符合 Schema 的结构化需求。
- RAG 使用 10 份模拟业务资料和 20 条人工标注查询。
- “最终成功率”包含规则模板降级，因此应与模型原始成功率分开表述。
- 本报告反映当前电脑、本地模型及本次测试集结果，不代表生产环境 SLA。
`;
}

async function loadEnv(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}

function toNumbers(value) {
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
}

function average(values) {
  return round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1), 1);
}

function percentile(values, point) {
  const sorted = [...values].sort((a, b) => a - b);
  return round(sorted[Math.min(Math.ceil(sorted.length * point) - 1, sorted.length - 1)] || 0, 1);
}

function ratio(value, total) {
  return round(value / Math.max(total, 1), 4);
}

function percent(value) {
  return `${round(value * 100, 1)}%`;
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
