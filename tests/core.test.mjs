import test from "node:test";
import assert from "node:assert/strict";
import { parseJsonObject } from "../lib/shared/json-utils.mjs";
import { cosineSimilarity, splitText } from "../lib/shared/rag-utils.mjs";

test("parseJsonObject parses strict JSON", () => {
  assert.deepEqual(parseJsonObject('{"items":[1,2]}'), { items: [1, 2] });
});

test("parseJsonObject recovers fenced JSON", () => {
  assert.deepEqual(parseJsonObject('```json\n{"ok":true}\n```'), { ok: true });
});

test("parseJsonObject extracts JSON from explanation", () => {
  assert.deepEqual(parseJsonObject('result: {"ok":true} done'), { ok: true });
});

test("parseJsonObject returns null for invalid output", () => {
  assert.equal(parseJsonObject("not-json"), null);
});

test("splitText preserves short document", () => {
  assert.deepEqual(splitText("第一段\n\n第二段", 100, 10), ["第一段\n\n第二段"]);
});

test("splitText creates bounded chunks", () => {
  const chunks = splitText("A".repeat(40) + "\n\n" + "B".repeat(40), 50, 8);
  assert.equal(chunks.length, 2);
  assert.ok(chunks.every((chunk) => chunk.length <= 50));
});

test("cosineSimilarity returns one for identical vectors", () => {
  assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
});

test("cosineSimilarity returns zero for orthogonal vectors", () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test("cosineSimilarity rejects mismatched dimensions", () => {
  assert.equal(cosineSimilarity([1], [1, 2]), 0);
});
