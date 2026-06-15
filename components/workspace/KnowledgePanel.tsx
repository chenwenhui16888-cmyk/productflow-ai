"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";

type KnowledgeDocument = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
};

export function KnowledgePanel({ projectId }: { projectId: string }) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/knowledge`);
    if (response.ok) setDocuments((await response.json()).documents);
  }, [projectId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setMessage("当前仅支持 .txt 和 .md 文件。");
      return;
    }
    setFileName(file.name);
    setContent(await file.text());
    setMessage("");
  }

  async function upload() {
    setLoading(true);
    setMessage("正在切片并建立索引...");
    const response = await fetch(`/api/projects/${projectId}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: fileName || "项目资料.md", content })
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error ?? "上传失败。");
      return;
    }
    setContent("");
    setFileName("");
    setMessage(`索引完成：${payload.embeddingModel}`);
    await loadDocuments();
  }

  async function reindex(documentId: string) {
    setBusyId(documentId);
    setMessage("正在重新建立索引...");
    const response = await fetch(`/api/projects/${projectId}/knowledge/${documentId}/reindex`, { method: "POST" });
    const payload = await response.json();
    setBusyId(null);
    setMessage(response.ok ? `重新索引完成，共 ${payload.chunkCount} 个文本块。` : payload.error);
    await loadDocuments();
  }

  async function remove(documentId: string) {
    if (!window.confirm("确认删除该资料及其全部向量索引吗？")) return;
    setBusyId(documentId);
    await fetch(`/api/projects/${projectId}/knowledge/${documentId}`, { method: "DELETE" });
    setBusyId(null);
    await loadDocuments();
  }

  return (
    <div className="card" style={{ marginTop: 18, padding: 14 }}>
      <strong style={{ display: "block", marginBottom: 6 }}>项目知识库</strong>
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.6 }}>
        资料按项目隔离，并用于需求拆解和 PRD 的 Top-4 检索。
      </p>
      <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={readFile} style={{ width: "100%" }} />
      <input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="资料名称" style={{ width: "100%", marginTop: 10, padding: 8 }} />
      <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="也可以直接粘贴业务规则、访谈摘要或历史需求..." rows={4} style={{ width: "100%", marginTop: 8, padding: 8, resize: "vertical" }} />
      <button className="button primary" type="button" onClick={upload} disabled={loading || content.trim().length < 20} style={{ width: "100%", marginTop: 8 }}>
        {loading ? "处理中..." : "加入知识库"}
      </button>
      {message ? <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{message}</p> : null}

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {documents.map((document) => (
          <div key={document.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, overflowWrap: "anywhere" }}>{document.fileName}</span>
              <span className="muted" style={{ fontSize: 11 }}>{statusLabel(document.status)}</span>
            </div>
            <div className="muted" style={{ marginTop: 4, fontSize: 11 }}>
              {document._count.chunks} 个文本块 · 更新于 {new Date(document.updatedAt).toLocaleString("zh-CN")}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
              <button className="button" type="button" onClick={() => reindex(document.id)} disabled={busyId === document.id}>
                重新索引
              </button>
              <button className="button" type="button" onClick={() => remove(document.id)} disabled={busyId === document.id}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "processing") return "处理中";
  if (status === "failed") return "失败";
  return "已就绪";
}
