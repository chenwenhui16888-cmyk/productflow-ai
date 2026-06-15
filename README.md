# ProductFlow AI

面向初级产品经理的 AI 产品研发助手。系统将模糊产品想法拆分为连续的结构化工作流，并生成需求澄清、需求拆解、用户故事、低保真原型、PRD、研发协作清单和评审报告。

## 核心能力

1. 产品想法录入：保存产品类型、目标用户、限制条件和原始想法。
2. 需求澄清：围绕用户、场景、痛点、价值、边界和成功标准生成问题。
3. 需求拆解：分析功能模块、优先级、MVP 范围、假设和风险。
4. 用户故事：生成角色、场景、目标、主流程、异常情况和验收标准。
5. 低保真原型：输出页面清单、页面模块、状态和跳转关系。
6. PRD：聚合前序产物，生成结构化产品需求文档。
7. 研发协作：整理研发、测试及产品运营协作事项。
8. 评审准备：检查需求完整度、映射关系、风险和待确认事项。
9. 项目级 RAG：支持 Markdown/TXT 文档上传、文本切片、向量检索和来源引用。
10. 生成稳定性：支持 JSON 解析、Schema 校验、一次自动修复和规则模板降级。
11. AI 可观测性：记录任务状态、模型、耗时、尝试次数、修复结果和降级信息。
12. PRD 导出：仅导出最终 PRD Word 文件，不包含内部工作流和生成日志。

## 工作流

```mermaid
flowchart LR
    A[产品想法] --> B[需求澄清]
    B --> C[需求拆解]
    C --> D[用户故事]
    D --> E[低保真原型]
    E --> F[PRD]
    F --> G[研发协作]
    G --> H[评审准备]
```

每一步读取项目基础信息和前序结构化产物，并将结果持久化到 PostgreSQL。AI 只负责生成草稿，范围、优先级和验收标准仍需产品经理确认。

## 技术架构

```mermaid
flowchart TB
    UI[Next.js App Router 工作台] --> API[Route Handlers]
    API --> WF[工作流与专项 Agent]
    WF --> LLM[Ollama / Qwen2.5]
    WF --> RAG[RAG 检索]
    WF --> REPAIR[JSON 校验与自动修复]
    WF --> FALLBACK[规则模板降级]
    API --> ORM[Prisma ORM]
    ORM --> DB[(PostgreSQL)]
```

| 层级 | 技术 |
| --- | --- |
| 前端 | Next.js 14、React、TypeScript、Tailwind CSS |
| 服务端 | Next.js Route Handlers、Zod |
| 数据层 | Prisma、PostgreSQL |
| AI | Ollama、Qwen2.5 3B、结构化 JSON |
| RAG | 文本分块、Embedding、余弦相似度、Top-4 检索 |
| 测试 | Node Test Runner、自动化生成与 RAG 评测 |

## RAG Lite

知识库按项目隔离，支持 `.md` 和 `.txt` 文件或直接粘贴文本。文档按约 700 字符切片并保留重叠上下文，优先使用 `nomic-embed-text` 生成 Embedding；模型不可用时使用本地哈希向量降级。

需求拆解和 PRD 生成前，会在当前项目内检索 Top-4 相关文本块并注入 Agent。PRD 会输出知识库依据和来源文件。当前向量保存在 PostgreSQL JSON 字段中，适合小型知识库；更大规模可迁移至 `pgvector`。

知识库管理支持：

- 查看处理状态、文本块数量和更新时间
- 重新建立向量索引
- 删除文档及级联清理文本块
- 项目级数据隔离

## 生成稳定性与可观测性

结构化 Agent 采用以下处理链路：

1. 模型首次生成 JSON。
2. 执行 JSON 解析和结构校验。
3. 失败时携带失败类型和原始输出自动修复一次。
4. 修复仍失败时使用规则模板降级。

`GenerationLog` 持久化记录：

- `running / completed / failed` 任务状态
- 模型名称和生成模式
- 响应耗时与尝试次数
- 首次解析及首次校验结果
- 自动修复结果与错误类型
- RAG 检索片段数量

工作台右侧会轮询任务状态，页面刷新后仍可查看运行中或失败任务。

## 本地运行

### 环境要求

- Node.js 20+
- PostgreSQL 15+
- Ollama（可选；不可用时使用规则降级）

### 安装与配置

```powershell
npm.cmd install
```

复制 `.env.example` 为 `.env`：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/productflow_ai?schema=public"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:3b"
OLLAMA_EMBEDDING_MODEL="nomic-embed-text"
```

初始化数据库：

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

准备模型：

```powershell
ollama pull qwen2.5:3b
ollama pull nomic-embed-text
ollama serve
```

启动项目：

```powershell
npm.cmd run dev
```

访问 [http://localhost:3000](http://localhost:3000)，健康检查地址为 [http://localhost:3000/api/health](http://localhost:3000/api/health)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm.cmd run dev` | 启动开发服务器 |
| `npm.cmd run test` | 运行核心逻辑单元测试 |
| `npm.cmd run typecheck` | TypeScript 类型检查 |
| `npm.cmd run build` | 生产构建 |
| `npm.cmd run eval` | 运行结构化生成和 RAG 自动评测 |
| `npm.cmd run demo:seed` | 创建完整示例项目 |
| `npm.cmd run prisma:deploy` | 执行生产数据库迁移 |
| `npm.cmd run prisma:studio` | 打开 Prisma Studio |

## 自动化评测

评测集包含：

- 10 组不同领域的产品想法
- 10 份模拟业务知识文档
- 20 条带正确来源标注的 RAG 查询
- 9 项 JSON、文本切片和向量计算单元测试

2026 年 6 月 15 日，本地 `qwen2.5:3b` 测试结果：

| 指标 | 结果 |
| --- | ---: |
| 模型请求成功率 | 100% |
| JSON 首次严格解析成功率 | 80% |
| Schema 首次通过率 | 50% |
| 自动修复后 Schema 通过率 | 70% |
| 修复尝试成功率 | 40% |
| 加入降级后的最终成功率 | 100% |
| 平均生成时间 | 44.74 秒 |
| P50 / P95 | 34.12 / 81.93 秒 |

当前 RAG 报告仍是 `local-hash-embedding` 基线：Top-1 来源命中率 20%，Top-4 来源召回率 55%。该结果用于验证评测链路，不代表正式语义检索效果。完整报告见 [`evaluation/results/latest.md`](evaluation/results/latest.md)。

## 项目结构

```text
app/api/                       API、生成任务、知识库和导出接口
app/projects/                  项目列表与新建项目
app/workspace/                 三栏工作台
components/workspace/          工作台、步骤组件和可观测性面板
lib/ai/                        Ollama、专项 Agent、自动修复和任务状态
lib/agents/                    工作流编排与规则降级
lib/rag/                       文本切片、Embedding 和检索
lib/projects/                  项目服务、校验和 PRD 导出
prisma/                        数据模型与迁移
evaluation/                    测试集和评测报告
tests/                         核心逻辑单元测试
```

## 部署说明

应用可以部署到支持 Node.js 的平台并连接托管 PostgreSQL：

```powershell
npm.cmd run prisma:deploy
npm.cmd run build
npm.cmd run start
```

云端应用无法访问开发电脑上的 `127.0.0.1:11434`。公网部署需要将 Ollama 部署到可访问服务器、接入云端模型 Provider，或保留规则降级模式。

## 当前边界

- 当前优先支持桌面端工作台。
- Word 导出为 Word 可打开的兼容文档，不是完整 OOXML 排版引擎。
- 部分步骤以规则生成作为主要实现。
- RAG 当前采用应用层余弦相似度，适合小型知识库。
- 暂未加入账号权限、多人实时协作和云端文件存储。

## 后续路线

- 接入可配置的云端模型 Provider 和密钥管理
- 将向量检索迁移到 `pgvector`，增加混合检索和重排序
- 增加异步任务队列、流式输出、缓存和限流
- 增加账号体系、项目权限和协作评论
- 增加真实 `.docx`、PDF 和原型图片导出
- 持续扩充 Agent 评测集和生成质量评分
