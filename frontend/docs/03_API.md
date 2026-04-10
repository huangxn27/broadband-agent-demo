# API — 前后端接口设计

## 1. 接口规范

- **Base URL**：`http://localhost:8080/api`（开发环境）
- **认证方式**：Bearer Token（后续扩展，当前可暂不鉴权）
- **请求头**：
  ```
  Authorization: Bearer <token>
  Content-Type: application/json
  ```

### 统一响应格式（非流式接口）

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 0 表示成功，非 0 为业务错误 |
| message | string | 提示信息 |
| data | object / array / null | 业务数据 |

---

## 2. 右侧渲染协议设计（核心）

### 2.1 设计思路

Agent 在 SSE 流中通过特殊事件类型触发右侧面板渲染。前端 SSE 解析器遇到 `render` 事件时，提取渲染指令并更新右侧面板，与左侧文本流互不干扰。

### 2.2 SSE 事件类型总览

| 事件类型 | 含义 | 触发右侧渲染 |
|----------|------|------------|
| `thinking` | Agent 思考过程文本（流式） | 否 |
| `text` | 最终结论文本（流式） | 否 |
| `step_start` | 一个步骤卡片开始 | 否 |
| `sub_step` | 步骤卡片内的子步骤数据 | 否 |
| `step_end` | 一个步骤卡片结束 | 否 |
| `render` | 触发右侧面板渲染 | **是** |
| `done` | 本轮流式响应结束 | 否 |
| `error` | 流式响应出错 | 否 |

### 2.3 SSE 数据格式

每个 SSE 消息格式（符合 EventSource 规范）：

```
event: <事件类型>
data: <JSON 字符串>

```

#### thinking 事件

```json
{ "delta": "正在分析网络拓扑..." }
```

#### text 事件

```json
{ "delta": "根据分析结果，该链路存在..." }
```

#### step_start 事件

```json
{
  "stepId": "step_001",
  "title": "扫描网络设备状态"
}
```

#### sub_step 事件

```json
{
  "stepId": "step_001",
  "subStepId": "sub_001",
  "name": "Ping 核心路由器",
  "result": "延迟 2ms，状态正常",
  "completedAt": "2024-01-15T10:23:45Z",
  "durationMs": 312
}
```

#### step_end 事件

```json
{ "stepId": "step_001" }
```

#### render 事件（关键）

```json
{
  "renderType": "image",
  "renderData": { ... }
}
```

或

```json
{
  "renderType": "insight",
  "renderData": { ... }
}
```

详见第 2.4、2.5 节。

#### done 事件

```json
{
  "messageId": "msg_abc123",
  "thinkingDurationSec": 12
}
```

#### error 事件

```json
{ "message": "Agent 执行失败，请重试" }
```

### 2.4 render 事件 — 图像展示（renderType: "image"）

```json
{
  "renderType": "image",
  "renderData": {
    "imageId": "img_abc123",
    "imageUrl": "/api/images/img_abc123",
    "title": "全网链路拓扑图",
    "conclusion": "检测到核心节点 A 至 B 链路丢包率 15%，建议切换备用路由。"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| imageId | string | 图片唯一 ID |
| imageUrl | string | 图片访问 URL（后端提供） |
| title | string | 图片标题 |
| conclusion | string | 结论文本，支持 Markdown |

**图片传输方案（详见第 5 节）**：后端 Agent 执行过程中生成图片 → 存储到服务端本地/对象存储 → 生成可访问 URL → 通过 render 事件推送 URL → 前端直接 `<img src={imageUrl} />` 加载。

### 2.5 render 事件 — 数据洞察（renderType: "insight"）

```json
{
  "renderType": "insight",
  "renderData": {
    "charts": [
      {
        "chartId": "chart_001",
        "title": "核心路由器 CPU 使用率（近24h）",
        "conclusion": "峰值出现在 02:00-04:00，最高达 94%",
        "echartsOption": {
          "xAxis": { "type": "category", "data": ["00:00", "02:00", "04:00"] },
          "yAxis": { "type": "value" },
          "series": [{ "data": [30, 94, 60], "type": "line" }]
        }
      },
      {
        "chartId": "chart_002",
        "title": "各链路丢包率对比",
        "conclusion": "链路 A-B 丢包率异常，需重点关注",
        "echartsOption": { ... }
      }
    ],
    "markdownReport": "# 数据洞察报告\n\n## 摘要\n...\n## 详细分析\n..."
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| charts | ChartItem[] | 图表列表，前端用 ECharts 渲染 |
| charts[].chartId | string | 图表唯一 ID |
| charts[].title | string | 图表标题 |
| charts[].conclusion | string | 该图表的文字结论 |
| charts[].echartsOption | object | 标准 ECharts option 对象，前端直接传入 |
| markdownReport | string | 完整 Markdown 格式报告 |

---

## 3. 数据模型

### 实体：Conversation（会话）

```typescript
interface Conversation {
  id: string;             // 唯一 ID，UUID
  title: string;          // 会话标题（可由首条消息自动生成）
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
  messageCount: number;   // 消息数量
  lastMessagePreview: string; // 最后一条消息摘要
}
```

### 实体：Message（消息）

```typescript
interface Message {
  id: string;                    // 唯一 ID
  conversationId: string;        // 所属会话 ID
  role: 'user' | 'assistant';    // 消息角色
  content: string;               // 最终结论文本（Markdown）
  thinkingContent?: string;      // 思考过程文本
  thinkingDurationSec?: number;  // 思考耗时（秒）
  steps?: Step[];                // 步骤卡片数据
  renderBlocks?: RenderBlock[];  // 右侧渲染块
  createdAt: string;
}
```

### 实体：Step（步骤卡片）

```typescript
interface Step {
  stepId: string;
  title: string;
  subSteps: SubStep[];
}

interface SubStep {
  subStepId: string;
  name: string;
  result: string;
  completedAt: string;   // ISO 8601
  durationMs: number;
}
```

### 实体：RenderBlock（渲染块）

```typescript
type RenderBlock =
  | { renderType: 'image'; renderData: ImageRenderData }
  | { renderType: 'insight'; renderData: InsightRenderData }

interface ImageRenderData {
  imageId: string;
  imageUrl: string;
  title: string;
  conclusion: string;
}

interface InsightRenderData {
  charts: ChartItem[];
  markdownReport: string;
}

interface ChartItem {
  chartId: string;
  title: string;
  conclusion: string;
  echartsOption: object;
}
```

---

## 4. 接口列表

### 模块：会话管理

#### 获取会话列表

- **Method**：`GET`
- **Path**：`/conversations`
- **Query 参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20 |

- **响应 data**：
```json
{
  "list": [Conversation],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

#### 新建会话

- **Method**：`POST`
- **Path**：`/conversations`
- **Body**：
```json
{ "title": "新对话" }
```
- **响应 data**：新建的 `Conversation` 对象

---

#### 删除会话

- **Method**：`DELETE`
- **Path**：`/conversations/:id`
- **响应 data**：`null`

---

### 模块：消息

#### 获取会话历史消息

- **Method**：`GET`
- **Path**：`/conversations/:id/messages`
- **响应 data**：
```json
{ "list": [Message] }
```

---

#### 发送消息（SSE 流式响应）

- **Method**：`POST`
- **Path**：`/conversations/:id/messages`
- **Body**：
```json
{
  "content": "帮我分析一下当前网络状态",
  "deepThinking": false
}
```
- **响应**：`Content-Type: text/event-stream`，SSE 格式，事件类型见第 2 节

---

### 模块：图片

#### 获取图片资源

- **Method**：`GET`
- **Path**：`/images/:imageId`
- **响应**：图片二进制流，`Content-Type: image/png` 或 `image/jpeg`
- **说明**：Agent 执行过程中生成的图片由后端存储，前端通过此接口加载，无需 Base64 传输

---

## 5. 图片前后端传输方案

### 方案选择：URL 引用（推荐）

| 方案 | 优点 | 缺点 |
|------|------|------|
| **URL 引用**（推荐） | 轻量，不阻塞 SSE 流，图片懒加载 | 需要后端额外存储图片 |
| Base64 内嵌 | 不需要额外请求 | 图片大时严重阻塞 SSE，数据量大 |
| WebSocket 单独传输 | 实时性好 | 架构复杂，需维护双连接 |

### 推荐实现流程

```
1. Agent 执行过程中生成图片（如拓扑图、截图）
2. 后端将图片存储到本地磁盘或对象存储（OSS/MinIO）
3. 生成图片访问 URL（如 /api/images/img_abc123）
4. 通过 SSE render 事件推送 imageUrl 给前端
5. 前端收到 render 事件后直接渲染 <img src={imageUrl} />
6. 图片按需从后端加载，不影响流式文本速度
```

---

## 6. 错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| 401 | 未登录或 Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | Agent 执行失败 |
| 1002 | 会话不存在 |
| 1003 | 图片资源不存在 |
