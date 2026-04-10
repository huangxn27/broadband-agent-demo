# MOCK_DATA — Mock 数据与接入说明

本项目所有 Mock 数据以独立 **JSON 文件** 形式承载，存放于 `docs/mock/` 目录。开发阶段前端可在零后端依赖下完整运行所有功能（参见 `05_DEVELOPMENT_GUIDE.md`）。

> 关联文档：`03_API.md`（接口契约）、`05_DEVELOPMENT_GUIDE.md`（分阶段开发）

---

## 1. Mock 文件清单

| 文件 | 对应接口 | Mock 内容概览 |
|------|----------|--------------|
| `mock/conversations.json` | `GET /conversations` | 4 条会话列表（含 1 条空会话） |
| `mock/conversation-create.json` | `POST /conversations` | 新建一条「新对话」的成功响应 |
| `mock/conversation-delete.json` | `DELETE /conversations/:id` | 删除成功通用响应 |
| `mock/messages-conv_001.json` | `GET /conversations/conv_001/messages` | 「核心路由器丢包排查」完整对话（含 image render） |
| `mock/messages-conv_002.json` | `GET /conversations/conv_002/messages` | 「全网性能洞察周报」完整对话（含 insight render） |
| `mock/messages-conv_003.json` | `GET /conversations/conv_003/messages` | 「广州城域网延迟分析」普通对话（无 render） |
| `mock/messages-conv_004.json` | `GET /conversations/conv_004/messages` | 空会话（无任何消息） |
| `mock/sse-stream-image.json` | `POST /conversations/:id/messages`（SSE） | 「图像展示」场景的 SSE 事件序列 |
| `mock/sse-stream-insight.json` | `POST /conversations/:id/messages`（SSE） | 「数据洞察」场景的 SSE 事件序列 |
| `mock/sse-stream-error.json` | `POST /conversations/:id/messages`（SSE） | 中途出错的 SSE 流 |

> 图片资源：`/api/images/:imageId` 在 Mock 阶段直接用占位图（`https://placehold.co/...` 或本地 `assets/mock/` 下的 PNG）替代，无需 JSON。

---

## 2. 各 Mock 文件 mock 了什么

### 2.1 `conversations.json` — 会话列表

模拟 4 条会话，覆盖典型状态：

| 会话 ID | 标题 | 用途 |
|---------|------|------|
| `conv_001` | 核心路由器丢包排查 | 验证 **图像展示** 场景（含 image render） |
| `conv_002` | 全网性能洞察周报 | 验证 **数据洞察** 场景（含 4 个 ECharts + Markdown 报告） |
| `conv_003` | 广州城域网延迟波动分析 | 验证 **无右侧渲染** 的普通对话 |
| `conv_004` | 新对话 | 验证 **空消息会话** 的 ChatView 空态 |

字段完全符合 `03_API.md` 中 `Conversation` 实体定义。

### 2.2 `messages-conv_001.json` — 图像类历史消息

模拟一次完整的「丢包排查」对话，包含：

- **1 条用户消息**：自然语言描述问题
- **1 条 assistant 消息**，内含：
  - `thinkingContent` + `thinkingDurationSec`：12 秒思考过程
  - 2 个 `Step`（扫描设备状态、生成拓扑图），共 5 个 `subSteps`
  - 1 个 `renderBlock`（`renderType: "image"`）：拓扑图 URL + Markdown 结论
  - `content`：Markdown 格式最终结论（含加粗、列表）

**目的**：让 P4 阶段历史加载、P3 阶段所有消息组件（步骤卡、结论卡、Markdown）一次性可被验证。

### 2.3 `messages-conv_002.json` — 数据洞察类历史消息

模拟一次「性能洞察周报」对话，包含：

- **2 个 Step / 5 个 subSteps**：采集指标 + 生成报告
- **1 个 `insight` 渲染块**，内含：
  - **4 张 ECharts**：折线图（CPU 趋势）、柱状图（链路丢包）、柱状图（内存）、饼图（流量构成）
  - 每张图均带 `title` 和 `conclusion`
  - **完整 Markdown 报告**：含一级/二级标题、表格、加粗、列表

**目的**：覆盖 RightPanel 数据洞察场景的全部子组件（图表网格、卡片结论、Markdown 表格）。

### 2.4 `messages-conv_003.json` — 普通对话（无 render）

只有 1 个 Step、1 个 renderBlocks 为空数组的 assistant 消息。

**目的**：验证「右侧面板回到 EmptyState」的逻辑。

### 2.5 `messages-conv_004.json` — 空会话

`list: []`。

**目的**：验证 ChatView 空消息态（「开始你的第一句提问」）。

### 2.6 `sse-stream-image.json` — 图像 SSE 流

模拟一次完整的流式响应，事件顺序：

```
thinking × 3   ← 流式思考文本
step_start     ← 第 1 个步骤开始
sub_step × 3   ← 3 个子步骤逐条出现
step_end
step_start     ← 第 2 个步骤
sub_step × 2
step_end
render(image)  ← 触发右侧图像展示
text × 4       ← 流式追加最终结论
done
```

每个事件带 `delayMs`（相对开始时间），Mock 层据此模拟真实的流式节奏。整个流约 **3.7 秒**完成，便于在开发期反复观察。

### 2.7 `sse-stream-insight.json` — 数据洞察 SSE 流

结构与上面类似，区别：

- 触发的是 `render(insight)` 事件，包含 4 张 ECharts 和完整 Markdown 报告
- `thinkingDurationSec: 18`
- 用于在 ChatView 输入「报告/洞察」类内容时被路由到

### 2.8 `sse-stream-error.json` — 错误 SSE 流

短流：`thinking → step_start → sub_step → error`。

**目的**：验证 `useSSE.onError` → 错误卡片展示 → 输入框恢复的整条链路。

### 2.9 `conversation-create.json` / `conversation-delete.json`

简单的成功响应包装，对应新建/删除会话接口。

---

## 3. Mock 接入方案

推荐 **MSW（Mock Service Worker）**，理由：

- 在 Service Worker 层拦截，**业务代码完全无感**，切换真后端只需关闭 worker
- 天然支持 `ReadableStream`，方便实现 SSE
- 可与 `import.meta.env.VITE_USE_MOCK` 联动按需启用

### 3.1 目录约定

```
src/
└── mocks/
    ├── browser.ts             # MSW worker 启动入口
    ├── handlers.ts            # 路由表
    ├── data/                  # 从 docs/mock/*.json 复制或软链
    │   ├── conversations.json
    │   ├── messages-conv_001.json
    │   ├── ...
    │   └── sse-stream-image.json
    └── sseReplay.ts           # SSE 流回放工具
```

> 也可在 `vite.config.ts` 中配置 alias `@mock` → `docs/mock`，避免重复拷贝。

### 3.2 普通接口示例

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import conversations from '@mock/conversations.json';
import messagesConv001 from '@mock/messages-conv_001.json';
import messagesConv002 from '@mock/messages-conv_002.json';
import messagesConv003 from '@mock/messages-conv_003.json';
import messagesConv004 from '@mock/messages-conv_004.json';
import createResp from '@mock/conversation-create.json';
import deleteResp from '@mock/conversation-delete.json';

const messagesMap: Record<string, unknown> = {
  conv_001: messagesConv001,
  conv_002: messagesConv002,
  conv_003: messagesConv003,
  conv_004: messagesConv004,
};

export const handlers = [
  http.get('/api/conversations', () => HttpResponse.json(conversations)),

  http.post('/api/conversations', () => HttpResponse.json(createResp)),

  http.delete('/api/conversations/:id', () => HttpResponse.json(deleteResp)),

  http.get('/api/conversations/:id/messages', ({ params }) => {
    const data = messagesMap[params.id as string] ?? { code: 0, data: { list: [] } };
    return HttpResponse.json(data);
  }),

  // SSE handler 见下一节
];
```

### 3.3 SSE 流回放

```ts
// src/mocks/sseReplay.ts
import { HttpResponse } from 'msw';

interface SseEvent { delayMs: number; event: string; data: unknown; }

export function replaySse(events: SseEvent[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let prev = 0;
      for (const e of events) {
        await new Promise(r => setTimeout(r, e.delayMs - prev));
        prev = e.delayMs;
        const chunk = `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new HttpResponse(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

```ts
// src/mocks/handlers.ts （续）
import imageStream from '@mock/sse-stream-image.json';
import insightStream from '@mock/sse-stream-insight.json';
import errorStream from '@mock/sse-stream-error.json';
import { replaySse } from './sseReplay';

http.post('/api/conversations/:id/messages', async ({ request }) => {
  const body = await request.json() as { content: string };
  // 简单路由：根据用户输入决定走哪条流
  if (/报告|洞察|insight/.test(body.content)) return replaySse(insightStream.events);
  if (/error|失败|超时/.test(body.content)) return replaySse(errorStream.events);
  return replaySse(imageStream.events);
}),
```

### 3.4 启用开关

```ts
// src/main.tsx
if (import.meta.env.VITE_USE_MOCK === 'true') {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}
```

`.env.development`：
```
VITE_USE_MOCK=true
VITE_API_BASE=/api
```

切换真后端时只需 `VITE_USE_MOCK=false`。

---

## 4. Mock 覆盖度对照

| `03_API.md` 接口 | Mock 文件 | 是否覆盖 |
|------------------|-----------|----------|
| `GET /conversations` | `conversations.json` | ✅ |
| `POST /conversations` | `conversation-create.json` | ✅ |
| `DELETE /conversations/:id` | `conversation-delete.json` | ✅ |
| `GET /conversations/:id/messages` | `messages-conv_00x.json` × 4 | ✅ |
| `POST /conversations/:id/messages`（SSE） | `sse-stream-{image,insight,error}.json` | ✅ |
| `GET /images/:imageId` | 占位图（无需 JSON） | ✅ |

**结论**：Mock 数据 100% 覆盖 API 列表，且覆盖了 PRD 第 5 节所有边界场景（空列表、空消息、流式中断、无 render 对话）。

---

## 5. 维护规范

- **Mock 字段必须与 `03_API.md` 完全一致**：接口契约变更时同步更新 mock 文件
- **新增场景优先扩展 mock，再写代码**：保持 Mock 优先策略
- **不要在 Mock 中夹带敏感信息**：所有 IP/设备名均为虚构示例
- **JSON 文件保持可读性**：合理换行、缩进 2 空格，便于 review
