# TECH — 技术约束文档

## 1. 技术栈

| 类目 | 选型 | 备注 |
|------|------|------|
| 框架 | React 18 | 函数组件 + Hooks |
| 语言 | TypeScript | 严格模式 |
| 包管理 | pnpm | |
| 构建工具 | Vite | |
| UI 组件库 | Ant Design 5 | 主题色 #1677FF |
| 图表库 | ECharts（echarts-for-react） | 数据洞察场景 |
| Markdown 渲染 | react-markdown + remark-gfm | 结论区和报告区 |
| 代码规范 | ESLint + Prettier | |

---

## 2. 目录结构

```
src/
├── pages/
│   └── Workspace/          # 唯一主页面
│       ├── index.tsx
│       ├── NavBar/         # 48px 导航栏
│       ├── LeftPanel/      # 484px 左侧面板
│       │   ├── ConversationList/   # 会话列表视图
│       │   └── ChatView/           # 对话界面视图
│       │       ├── MessageList/    # 消息滚动区
│       │       ├── StepCard/       # 步骤卡片组件
│       │       ├── ConclusionCard/ # 结论容器组件
│       │       └── InputBubble/    # 底部输入气泡
│       └── RightPanel/     # 1354px 右侧展示面板
│           ├── EmptyState/
│           ├── ImageDisplay/       # 场景一：图像展示
│           └── InsightDisplay/     # 场景二：数据洞察
├── api/
│   ├── conversations.ts    # 会话 CRUD 接口
│   ├── messages.ts         # 消息发送（SSE）
│   └── images.ts           # 图片接口
├── store/
│   ├── conversationStore.ts  # 会话列表状态
│   └── workspaceStore.ts     # 当前视图状态、右侧渲染内容
├── hooks/
│   ├── useSSE.ts           # SSE 流解析 Hook
│   └── useConversations.ts
├── types/
│   ├── conversation.ts
│   ├── message.ts
│   └── render.ts           # RenderBlock 类型定义
├── utils/
│   └── sseParser.ts        # SSE 事件解析工具
└── assets/
```

---

## 3. 状态管理

- **方案**：Zustand
- **Store 划分**：

| Store | 职责 |
|-------|------|
| `conversationStore` | 会话列表数据、当前激活会话 ID |
| `workspaceStore` | 左侧面板当前视图（list / chat）、右侧渲染内容（renderBlock）、当前消息流状态 |

---

## 4. 路由方式

- **路由库**：React Router v6
- **路由模式**：Hash 模式（`/#/`）
- **路由结构**：仅一个路由 `/`，视图切换通过 Zustand store 状态控制，不产生路由跳转
- **路由守卫**：当前不需要登录鉴权

---

## 5. 请求层封装

- **请求库**：axios（普通 REST 接口）+ 原生 `fetch` + `ReadableStream`（SSE 流式接口）
- **统一封装**：
  - axios 实例统一配置 baseURL、timeout、请求头
  - 响应拦截器统一处理 `code !== 0` 的业务错误（`message.error` 提示）
  - SSE 封装为自定义 Hook `useSSE`，解析各类事件并通过回调分发

### SSE Hook 设计（useSSE）

```typescript
interface SSECallbacks {
  onThinking: (delta: string) => void;
  onText: (delta: string) => void;
  onStepStart: (data: StepStartEvent) => void;
  onSubStep: (data: SubStepEvent) => void;
  onStepEnd: (data: StepEndEvent) => void;
  onRender: (data: RenderEvent) => void;
  onDone: (data: DoneEvent) => void;
  onError: (message: string) => void;
}

function useSSE(conversationId: string, callbacks: SSECallbacks): {
  send: (content: string, deepThinking: boolean) => void;
  isStreaming: boolean;
  abort: () => void;
}
```

---

## 6. 布局实现

```css
/* 整体三栏布局 */
.workspace {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.nav-bar {
  width: 48px;
  flex-shrink: 0;
}

.left-panel {
  width: 484px;
  flex-shrink: 0;
  position: relative; /* 用于 InputBubble 绝对定位 */
}

.right-panel {
  flex: 1;
  min-width: 0; /* 防止 flex 撑破布局 */
  overflow-y: auto;
}

/* 底部输入气泡 */
.input-bubble {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 452px;
  height: 96px;
  border-radius: 24px;
}

/* 步骤卡片折叠态 */
.step-card-collapsed {
  width: 452px;
  height: 56px;
  border-radius: 28px;
}

/* 深度思考按钮 */
.deep-thinking-btn {
  width: 88px;
  height: 28px;
}
```

---

## 7. 其他约束

- **国际化（i18n）**：否，全中文
- **响应式/移动端**：否，固定宽度布局，最小支持 1920px 宽屏
- **暗黑模式**：**强制 Dark 主题**，全局使用 Ant Design 5 的 `theme.darkAlgorithm`，不提供切换，代码入口处配置：
  ```tsx
  <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#1677FF' } }}>
  ```
- **ECharts 按需引入**：使用 `echarts-for-react`，仅按需引入所需图表类型（折线、柱状、饼图）以控制包体积
- **图片懒加载**：右侧图像展示使用原生 `loading="lazy"` 或 Ant Design Image 组件
- **流式文本渲染**：思考过程和结论区使用字符级追加，不整体 re-render，使用 `useRef` + DOM 操作或 `flushSync` 控制性能
