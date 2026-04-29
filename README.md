# UB — RAG Persona Chat

一个基于 RAG 的虚拟人对话应用。上传 PDF 构建全局知识库，为每个 Persona 提供有记忆、有上下文的流式对话。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite + TypeScript + TailwindCSS + Zustand |
| 后端 | FastAPI + SQLAlchemy 2.0 async + pgvector |
| LLM | DeepSeek API（openai SDK） |
| Embedding / Reranker | DashScope `text-embedding-v3` / `gte-rerank` |
| PDF 解析 | MinerU (`magic-pdf`) — 独立 Docker 服务 |
| 任务队列 | Redis + arq |
| 对象存储 | 阿里云 OSS |
| 数据库 | PostgreSQL 16 + pgvector |
| 通信 | REST API + WebSocket（流式对话） |

## 项目结构

```
UB/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/      # REST 路由 + WebSocket
│   │   ├── core/     # 配置、数据库连接
│   │   ├── models/   # SQLAlchemy ORM
│   │   ├── schemas/  # Pydantic 请求/响应
│   │   └── services/ # embed、oss、rag、persona 服务
│   └── alembic/      # 数据库迁移
├── pdf-worker/       # MinerU PDF 处理服务（可横向扩容）
│   └── services/     # pdf、chunker、embed、oss
├── frontend/         # React + Vite 前端
│   └── src/
│       ├── api/      # axios 封装
│       ├── store/    # Zustand 状态
│       ├── hooks/    # useChat (WebSocket)
│       ├── components/
│       └── pages/
├── docker-compose.yml      # 生产部署
└── docker-compose.dev.yml  # 本地开发（仅基础设施）
```

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填写以下必填项：

```env
DASHSCOPE_API_KEY=    # 阿里云 DashScope（embedding + reranker）
DEEPSEEK_API_KEY=     # DeepSeek（对话 LLM）
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET_NAME=
OSS_ENDPOINT=         # 如 https://oss-cn-hangzhou.aliyuncs.com
```

### 2. 生产部署

```bash
docker compose up --build -d
```

访问 `http://localhost`

**扩容 PDF Worker（并发处理）：**

```bash
docker compose up --scale pdf-worker=3 -d
```

### 3. 本地开发

```bash
# 启动基础设施
docker compose -f docker-compose.dev.yml up -d

# 后端
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# PDF Worker
cd pdf-worker
pip install -r requirements.txt
python -m arq worker.WorkerSettings

# 前端
cd frontend
npm install
npm run dev       # http://localhost:5173
```

## API 文档

后端启动后访问 `http://localhost:8000/docs`

### 主要端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST | `/api/personas` | Persona 列表 / 创建 |
| PUT/DELETE | `/api/personas/{id}` | 编辑 / 删除 |
| POST | `/api/personas/generate` | AI 生成 system prompt |
| POST | `/api/documents/upload` | 上传 PDF（异步处理） |
| GET | `/api/documents` | 文档列表（含处理状态） |
| GET/POST | `/api/conversations` | 会话管理 |
| GET | `/api/conversations/{id}/messages` | 历史消息 |
| WS | `/ws/chat?conversation_id={id}` | 流式对话 |

### WebSocket 帧格式

```jsonc
// 客户端发送
{ "type": "message", "content": "你好" }

// 服务端推送
{ "type": "token",  "content": "你" }   // 逐 token 流式
{ "type": "done",   "content": "" }     // 流结束
{ "type": "error",  "content": "..." }  // 异常
```

## RAG 流程

```
PDF 上传
  → MinerU 解析 → Markdown
  → 上传至阿里云 OSS
  → tiktoken 切块（500 token，50 overlap）
  → DashScope text-embedding-v3 批量 embed
  → 写入 pgvector

用户提问
  → embed 查询向量
  → pgvector cosine 相似度 top-10
  → DashScope gte-rerank → top-3
  → 组装 prompt（system_prompt + 上下文 + 历史）
  → DeepSeek 流式生成 → WebSocket token 帧
```

## 数据库迁移

```bash
cd backend

# 应用迁移
alembic upgrade head

# 新建迁移
alembic revision --autogenerate -m "描述"

# 回滚
alembic downgrade -1
```
