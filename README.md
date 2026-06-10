# AI 产品研发助手

**ProductFlow AI** 是一个面向初级产品经理的多 Agent 协作工作台。用户输入一句产品想法后，系统通过结构化工作流逐步生成需求澄清、需求拆解、用户故事、低保真原型、PRD 和研发协作材料。

这个项目既是一个可运行的 MVP，也是 AI 产品经理 / AI 应用开发方向的求职作品集。

## 核心能力

1. **产品想法录入**：保存产品名称、产品类型、目标用户和原始想法。
2. **需求澄清**：围绕用户、场景、痛点、价值、边界和成功标准生成问题。
3. **需求拆解**：分析功能模块、业务规则、优先级、依赖、风险和验收点。
4. **用户故事**：按不同角色和关键流程生成多条用户故事及验收标准。
5. **低保真原型**：输出页面清单、信息架构、页面模块、跳转关系和可视化线框。
6. **PRD 生成**：基于前序结果生成结构化、可编辑的产品需求文档。
7. **研发协作**：整理前端、后端、测试及产品 / 运营协作事项。
8. **评审准备**：汇总待确认问题、风险与评审材料。
9. **Word 导出**：将项目成果导出为 Word 可打开的文档。

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

工作流不是一次生成一篇长文，而是把产品经理的思考过程拆成八个可回看、可编辑、可重新生成的步骤。每一步读取项目基础信息和前序产物，再将结构化结果保存到 PostgreSQL。

## 技术架构

```mermaid
flowchart TB
    UI[Next.js App Router 工作台] --> API[Route Handlers]
    API --> WF[工作流与 Agent 服务]
    WF --> LLM[Ollama / Qwen2.5]
    WF --> FALLBACK[本地规则模板降级]
    API --> ORM[Prisma ORM]
    ORM --> DB[(PostgreSQL)]
    API --> DOC[Word 导出]
```

| 层级 | 技术 |
| --- | --- |
| 前端 | Next.js 14、React、TypeScript、Tailwind CSS |
| 服务端 | Next.js Route Handlers、Zod |
| 数据层 | Prisma、PostgreSQL |
| AI | Ollama、Qwen2.5 3B、结构化 JSON 输出 |
| 文档 | Word 兼容格式导出 |

## Agent 设计

当前版本采用“工作流编排 + 专项 Agent”的方式：

- 需求拆解 Agent：分析模块、优先级、依赖、风险和验收标准。
- 用户故事 Agent：根据用户角色和流程生成多条用户故事。
- PRD Agent：聚合产品想法、澄清答案、需求和用户故事，生成完整 PRD。
- 其他步骤：已具备独立生成接口与规则模板，可继续替换为模型 Agent。

模型不可用、超时或返回格式不正确时，系统会自动使用规则模板降级，保证演示流程不中断。生成日志会记录使用的是 Ollama 还是降级模式。

## 本地运行

### 环境要求

- Node.js 20 或更高版本
- PostgreSQL 15 或更高版本
- Ollama（可选；不安装时使用规则模板）

### 1. 安装依赖

```powershell
npm.cmd install
```

PowerShell 如果限制执行 `npm.ps1`，直接使用 `npm.cmd` 即可。

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，然后修改数据库连接信息：

```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/productflow_ai?schema=public"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:3b"
```

`OPENAI_API_KEY` 是后续接入云端模型的预留字段，当前版本不会使用。

### 3. 初始化数据库

先在 PostgreSQL 创建数据库 `productflow_ai`，再执行：

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

生产环境使用：

```powershell
npm.cmd run prisma:deploy
```

### 4. 启动本地模型（可选）

```powershell
ollama pull qwen2.5:3b
ollama serve
```

Ollama 的 `11434` 地址是 API 服务，不是普通网页；浏览器打开后没有管理界面是正常现象。

### 5. 启动应用

```powershell
npm.cmd run dev
```

访问 [http://localhost:3000](http://localhost:3000)。健康检查地址为 [http://localhost:3000/api/health](http://localhost:3000/api/health)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm.cmd run dev` | 启动开发服务器 |
| `npm.cmd run typecheck` | TypeScript 类型检查 |
| `npm.cmd run build` | 生产构建 |
| `npm.cmd run start` | 启动生产构建 |
| `npm.cmd run prisma:migrate` | 创建并执行开发迁移 |
| `npm.cmd run prisma:deploy` | 执行生产数据库迁移 |
| `npm.cmd run prisma:studio` | 打开 Prisma 数据管理界面 |

## 目录结构

```text
app/
  api/                         API、Agent 生成与导出接口
  projects/                    项目列表、新建项目和工作台页面
components/workspace/          三栏工作台与八个步骤组件
lib/
  ai/                          Ollama 客户端与专项 Agent
  agents/                      规则模板和降级生成逻辑
  projects/                    项目校验、服务与导出
  workflow/                    工作流步骤定义
prisma/
  schema.prisma                数据模型
  migrations/                  数据库迁移
```

## 数据模型

- `Project`：项目基础信息和当前步骤。
- `ClarificationQuestion`：澄清问题、回答和状态。
- `RequirementItem`：需求模块、优先级、价值、风险和验收点。
- `UserStory`：角色、目标、价值、验收标准和优先级。
- `WireframePage`：页面结构、模块和跳转关系。
- `PrdDocument`：PRD 章节和正文。
- `CollaborationTask`：研发协作任务。
- `GenerationLog`：模型、状态、耗时和降级模式记录。

## 部署说明

应用本身可以部署到支持 Node.js 的平台，并连接托管 PostgreSQL。部署前需要设置环境变量并执行：

```powershell
npm.cmd run prisma:deploy
npm.cmd run build
npm.cmd run start
```

需要注意：云端应用无法访问开发电脑上的 `127.0.0.1:11434`。公网部署有三种选择：

1. 将 Ollama 部署到服务器，并把 `OLLAMA_BASE_URL` 指向该服务器。
2. 后续增加 OpenAI / 通义千问云 API Provider。
3. 保持当前降级模式，用于展示完整工作流但不调用大模型。

## 面试时可以怎样介绍

> ProductFlow AI 将初级产品经理从模糊想法到研发交付的过程拆成八步工作流。Next.js 同时承担页面和 API，Prisma 管理 PostgreSQL 中的结构化产品数据。需求拆解、用户故事和 PRD 由本地 Qwen 模型生成，系统要求模型返回 JSON，再经过校验后落库；如果模型失败则使用规则模板降级，从而保证产品流程可用。

这个项目重点展示的不是“套提示词生成长文”，而是工作流设计、上下文传递、结构化输出、数据持久化、异常降级和可编辑交付物。

## 当前边界

- 当前优先支持桌面端工作台。
- Word 导出为 Word 可打开的兼容文档，不是完整 OOXML 排版引擎。
- Ollama Agent 已覆盖核心文档步骤，其他步骤仍以规则生成作为主要实现。
- 暂未加入账号、权限、多人实时协作和云端文件存储。

## 后续路线

- 接入可配置的云端模型 Provider 和 Token 管理。
- 为所有步骤补齐独立 Agent 与统一提示词版本管理。
- 增加账号体系、项目权限和协作评论。
- 增加真实 `.docx`、PDF 和原型图片导出。
- 增加 Agent 评测集、生成质量评分和自动化测试。
