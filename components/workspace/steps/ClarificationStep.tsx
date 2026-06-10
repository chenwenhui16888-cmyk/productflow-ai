"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Question = {
  id: string;
  questionText: string;
  questionType: string;
  aiSuggestion: string | null;
  userAnswer: string | null;
  answerStatus: string;
  isRequired: boolean;
};

type ClarificationStepProps = {
  projectId: string;
  questions: Question[];
  onGoRequirement: () => void;
};

const answerStatusLabels: Record<string, string> = {
  unanswered: "\u672a\u56de\u7b54",
  answered: "\u5df2\u56de\u7b54",
  unsure: "\u6682\u4e0d\u786e\u5b9a",
  skipped: "\u5df2\u8df3\u8fc7"
};

export function ClarificationStep({ projectId, questions, onGoRequirement }: ClarificationStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(questions.map((question) => [question.id, question.userAnswer ?? ""]))
  );

  async function generateQuestions() {
    setLoading(true);
    await fetch(`/api/projects/${projectId}/clarification/generate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function saveAnswer(questionId: string, answerStatus = "answered") {
    setSavingId(questionId);
    await fetch(`/api/clarification-questions/${questionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAnswer: answers[questionId] ?? "", answerStatus })
    });
    setSavingId(null);
    router.refresh();
  }

  async function goRequirementBreakdown() {
    setNextLoading(true);
    await fetch(`/api/projects/${projectId}/requirements/generate`, { method: "POST" });
    setNextLoading(false);
    router.refresh();
    onGoRequirement();
  }

  return (
    <section className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div>
          <p className="muted" style={{ margin: "0 0 8px", fontWeight: 700 }}>{"\u7b2c 2 \u6b65"}</p>
          <h2 style={{ margin: 0, fontSize: 24 }}>{"\u9700\u6c42\u6f84\u6e05"}</h2>
        </div>
        <button className="button primary" type="button" onClick={generateQuestions} disabled={loading}>
          {loading ? "\u751f\u6210\u4e2d..." : questions.length ? "\u91cd\u65b0\u751f\u6210\u95ee\u9898" : "\u751f\u6210\u6f84\u6e05\u95ee\u9898"}
        </button>
      </div>

      {questions.length === 0 ? (
        <EmptyState text={"\u5728\u751f\u6210\u540e\u7eed\u4ea7\u7269\u524d\uff0c\u5148\u8ba9 AI \u57fa\u4e8e\u4ea7\u54c1\u60f3\u6cd5\u751f\u6210 6 \u4e2a\u5173\u952e\u6f84\u6e05\u95ee\u9898\u3002"} />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {questions.map((question, index) => (
            <article key={question.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 14, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <strong>{index + 1}. {question.questionText}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {question.isRequired ? "\u5fc5\u586b" : "\u53ef\u9009"} / {answerStatusLabels[question.answerStatus] ?? question.answerStatus}
                </span>
              </div>
              <p className="muted" style={{ margin: "0 0 10px", lineHeight: 1.6 }}>
                {"\u7c7b\u578b\uff1a"}{question.questionType}
                {question.aiSuggestion ? ` | AI \u5efa\u8bae\uff1a${question.aiSuggestion}` : ""}
              </p>
              <textarea
                value={answers[question.id] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                placeholder={"\u5728\u8fd9\u91cc\u586b\u5199\u4f60\u7684\u56de\u7b54\u3002"}
                rows={3}
                style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", resize: "vertical", lineHeight: 1.6 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button className="button" type="button" onClick={() => saveAnswer(question.id, "unsure")}>{"\u6807\u8bb0\u6682\u4e0d\u786e\u5b9a"}</button>
                <button className="button primary" type="button" onClick={() => saveAnswer(question.id)}>
                  {savingId === question.id ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u56de\u7b54"}
                </button>
              </div>
            </article>
          ))}
          <div className="card" style={{ padding: 16, background: "var(--panel-soft)", display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
              {"\u6f84\u6e05\u95ee\u9898\u5b8c\u6210\u540e\uff0c\u53ef\u4ee5\u8fdb\u5165\u4e0b\u4e00\u6b65\uff0c\u751f\u6210 PM \u89c6\u89d2\u7684\u9700\u6c42\u62c6\u89e3\u8868\u3002"}
            </p>
            <button className="button primary" type="button" onClick={goRequirementBreakdown} disabled={nextLoading}>
              {nextLoading ? "\u751f\u6210\u4e2d..." : "\u8fdb\u5165\u9700\u6c42\u62c6\u89e3"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 18, background: "var(--panel-soft)" }}>
      <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}
