# DEVELOPMENT_GUIDE — 分阶段开发指南

本指南将整个前端项目拆解为 **7 个递进阶段**，每个阶段独立可验收、互为依赖。建议严格按顺序推进，前一阶段不闭环不进入下一阶段，避免后期返工。

> 配套文档：`01_PRD.md`（产品需求）、`02_UI_SPEC.md`（界面规格）、`03_API.md`（接口设计）、`04_TECH.md`（技术约束）、`06_MOCK_DATA.md`（Mock 数据）

---

## 阶段总览

| 阶段 | 名称 | 核心目标 | 主要产出 |
|------|------|----------|----------|
| P0 | 项目初始化 | 工程脚手架可运行 | Vite + React + TS + AntD Dark 主题 |
| P1 | 三栏布局骨架 | 整体结构 + 状态切换 | NavBar / LeftPanel / RightPanel 空壳 |
| P2 | 会话列表视图 | 列表 CRUD UI | ConversationList 组件 + Mock 接入 |
| P3 | 对话界面静态版 | 消息组件全部到位 | ChatView + StepCard + ConclusionCard + InputBubble |
| P4 | 历史消息加载 | 列表 ↔ 对话联动 | conversationStore + workspaceStore 联动 |
| P5 | SSE 流式集成 | 真正的流式对话体验 | useSSE Hook + Mock SSE 回放 |
| P6 | 右侧渲染面板 | 图像 / 数据洞察展示 | ImageDisplay + InsightDisplay |
| P7 | 边界打磨 | 错误、空态、性能 | 错误提示、骨架屏、流式渲染优化 |

每个阶段均可通过 Mock 数据独立联调，**整个流程可在零后端依赖下完成**，参见 `06_MOCK_DATA.md`。

---

## P0 — 项目初始化

### 目标
搭建工程脚手架，确保 `pnpm dev` 能起一个空白暗色页面。

### 任务清单
1. `pnpm create vite broadband-frontend --template react-ts`
2. 安装核心依赖：
   ```bash
   pnpm add antd @ant-design/icons zustand react-router-dom axios
   pnpm add echarts echarts-for-react react-markdown remark-gfm
   pnpm add -D @types/node eslint prettier
   ```
3. 配置 ESLint + Prettier（参考 `04_TECH.md`）
4. 在 `src/main.tsx` 中包裹 `ConfigProvider`，启用 `theme.darkAlgorithm` + 主题色 `#1677FF`
5. 配置 `vite.config.ts` alias `@/` → `src/`
6. 按 `04_TECH.md` 第 2 节创建 **空目录骨架**（`pages/Workspace`、`api/`、`store/`、`hooks/`、`types/`、`utils/`），关键目录放空 `index.ts` 占位

### 验收标准
- `pnpm dev` 成功启动，浏览器打开是一片 `#0D1117` 的暗色背景
- `pnpm lint` 无错误
- 目录树与 `04_TECH.md` 一致

---

## P1 — 三栏布局骨架

### 目标
搭出 NavBar / LeftPanel / RightPanel 三栏，**面板内容均为占位文字**，但视图切换状态机已可工作。

### 任务清单
1. 创建 `pages/Workspace/index.tsx`，三栏 flex 布局（参考 `04_TECH.md` 第 6 节 CSS）
2. 创建 `store/workspaceStore.ts`，包含：
   ```ts
   type LeftView = 'list' | 'chat';
   interface WorkspaceState {
     leftView: LeftView;
     activeConversationId: string | null;
     setLeftView: (v: LeftView) => void;
     setActiveConversation: (id: string | null) => void;
   }
   ```
3. 实现 NavBar：Logo + 「会话列表」按钮（点击 `setLeftView('list')`），AntD Tooltip placement="right"
4. LeftPanel 根据 `leftView` 切换渲染 `<ConversationList />` 或 `<ChatView />`，两者先用占位文本
5. RightPanel 渲染 `<EmptyState />`（中央提示「等待 Agent 输出结果...」）
6. 配置 React Router Hash 模式，仅一个路由 `/`

### 验收标准
- 三栏宽度严格符合 `48 / 484 / flex:1`
- 点击 NavBar 会话列表图标，左侧切回列表占位
- 暗色主题正确，无白色闪屏

---

## P2 — 会话列表视图（含 Mock 接入）

### 目标
左侧「会话列表」视图完整可用，**首次接入 Mock 数据**，同时打通 `api/` 请求层。

### 任务清单
1. 在 `src/types/conversation.ts` 中按 `03_API.md` 第 3 节定义 `Conversation` 类型
2. 封装 axios 实例 `src/api/request.ts`：baseURL、超时、统一拦截 `code !== 0`
3. 实现 `src/api/conversations.ts`：`listConversations / createConversation / deleteConversation`
4. **接入 Mock**（详见 `06_MOCK_DATA.md` 第 3 节）：
   - 推荐使用 **MSW（Mock Service Worker）**，将 `docs/mock/*.json` 拷贝/导入到 `src/mocks/`
   - 或临时方案：在 `api/request.ts` 中根据 `import.meta.env.VITE_USE_MOCK` 直接 `import` JSON 返回
5. 创建 `store/conversationStore.ts`：`list / loading / fetch / remove`，组件 mount 时调用 `fetch`
6. 实现 `LeftPanel/ConversationList/`：
   - 头部：标题 + 「新建对话」按钮（图标 + 文字）
   - 列表项：标题（加粗）+ 时间（右上角灰色）+ 摘要（截断）+ hover 显示删除图标
   - 点击项 → `setActiveConversation(id)` + `setLeftView('chat')`
   - 点击新建 → 调 `createConversation` → 同上切换
   - 删除二次确认弹窗
7. 空状态：列表为空时显示插画 + 「新建第一个对话」按钮

### 验收标准
- 启动后看到 4 条 mock 会话
- 点击任意会话切到对话视图（仍是占位）
- 点击新建会创建并切换到新会话
- 删除会话有二次确认，确认后列表刷新

---

## P3 — 对话界面静态版

### 目标
实现 ChatView 内的所有视觉组件，**用静态数据驱动**（直接 import `messages-conv_001.json`），不接 SSE。

### 任务清单
1. 定义 `types/message.ts`：`Message / Step / SubStep`
2. 实现 `LeftPanel/ChatView/index.tsx`：顶部栏（⬅️ + 标题）+ 消息滚动区 + 底部输入气泡
3. 实现子组件：
   - **`MessageList/`**：纵向排列消息，自动滚到底
   - **`UserBubble/`**：用户气泡
   - **`StepCard/`**：折叠态 `452×56 / r28`，展开后子步骤时间轴（左竖线 + 圆点 + 名称 + 结果 + 时间）
   - **`ConclusionCard/`**：思考过程（可折叠，灰底斜体） + 最终结论（react-markdown + remark-gfm）
   - **`InputBubble/`**：`452×96 / r24`，多行输入 + 深度思考按钮 `88×28`（纯 UI 切换态）+ 发送按钮
4. 顶部 ⬅️ → `setLeftView('list')`
5. 临时在 ChatView 中 `import demoMessages from '@/mocks/messages-conv_001.json'` 渲染

### 验收标准
- 步骤卡片可展开/折叠，子步骤时间线视觉准确
- 结论容器思考过程可折叠，结论 Markdown 渲染（加粗、列表）正确
- 输入气泡严格符合规格尺寸，深度思考按钮 UI 切换正常
- 消息区可滚动，输入框悬浮不遮挡

---

## P4 — 历史消息加载（列表 ↔ 对话联动）

### 目标
打通「点击列表项 → 加载该会话历史消息」的数据通路。

### 任务清单
1. `api/messages.ts`：`getMessages(conversationId)`
2. Mock 路由：`/conversations/:id/messages` → 根据 id 返回对应 JSON（参见 `06_MOCK_DATA.md`）
3. `workspaceStore` 增加 `messages: Message[] / messagesLoading: boolean / loadMessages(id)`
4. ChatView 监听 `activeConversationId` 变化时 `loadMessages`
5. 加载中显示骨架屏；空消息显示「开始你的第一句提问」

### 验收标准
- 点击 conv_001 → 看到拓扑图排查的完整历史
- 点击 conv_002 → 看到性能洞察的完整历史
- 点击 conv_004（空会话）→ 显示空态
- 切换会话时输入框、滚动位置都正确重置

---

## P5 — SSE 流式集成

### 目标
实现真正的流式对话：发送消息 → 步骤逐条出现 → 结论流式追加。**用 Mock SSE 事件序列驱动**。

### 任务清单
1. 实现 `utils/sseParser.ts`：解析 `event:` / `data:` 双行格式
2. 实现 `hooks/useSSE.ts`，签名见 `04_TECH.md` 第 5 节
3. **Mock SSE 实现**（参见 `06_MOCK_DATA.md` 第 4 节）：
   - 拦截 `POST /conversations/:id/messages`，返回一个 `ReadableStream`
   - Stream 内部按 `sse-stream-image.json` / `sse-stream-insight.json` 中 `events` 数组的 `delayMs` 顺序 enqueue
   - 关键：根据请求内容决定走 image 还是 insight 流（如内容含「报告/洞察」走 insight）
4. ChatView 集成 useSSE：
   - `onStepStart` → 在 messages 末尾追加新 Step 卡片
   - `onSubStep` → 推进对应 Step 的 subSteps
   - `onThinking` → 累积到当前 message 的 thinkingContent
   - `onText` → 累积到 content
   - `onDone` → 结束流，重新启用输入框
   - `onError` → 在消息区追加错误卡片
5. 流式渲染性能：思考/结论文本使用 `useRef` + 直接 DOM 操作或 `flushSync`，避免每个 token re-render 整棵树

### 验收标准
- 在 conv_001 输入任意消息，看到：思考 → 步骤卡片逐条出现 → 结论流式追加
- 流式过程中输入框禁用，结束后恢复
- 步骤卡片出现时有平滑动画
- 用 `sse-stream-error.json` 触发错误流，错误卡片显示，输入框恢复

---

## P6 — 右侧渲染面板

### 目标
SSE 流中遇到 `render` 事件时，右侧面板同步切换内容。

### 任务清单
1. `types/render.ts` 定义 `RenderBlock / ImageRenderData / InsightRenderData / ChartItem`
2. `workspaceStore` 增加 `currentRender: RenderBlock | null / setRender(block)`
3. `useSSE.onRender` → `setRender(event)`
4. 切换会话时清空 `currentRender`；加载历史消息时如果最后一条 message 有 `renderBlocks`，自动设置最后一个为 currentRender
5. 实现 `RightPanel/ImageDisplay/`：
   - 标题 + `<Image preview />`（AntD，支持点击全屏）+ Markdown 结论
   - `loading="lazy"`，加载失败展示错误占位
6. 实现 `RightPanel/InsightDisplay/`：
   - 2 列网格图表区，每个卡片：`<ReactECharts option={item.echartsOption} />` + 文字结论
   - 下方全宽 Markdown 报告区（react-markdown + remark-gfm，表格用 GFM）
7. RightPanel 主组件根据 `currentRender.renderType` switch 选择子组件，null 时显示 EmptyState

### 验收标准
- 触发 image 流：右侧出现拓扑图（用 placeholder 图即可）+ 结论
- 触发 insight 流：右侧出现 4 张 ECharts 图（折线/柱状/柱状/饼图）+ 完整 Markdown 报告
- 切换历史会话时，右侧自动恢复对应渲染块
- 切换到无 render 的会话时右侧回到空态

---

## P7 — 边界与打磨

### 目标
覆盖 `01_PRD.md` 第 5 节列出的所有边界，完善体验细节。

### 任务清单
1. **错误处理**
   - axios 拦截 `code !== 0` → `message.error`
   - SSE error 事件 → 消息区追加错误卡片，输入框恢复
   - 图片加载失败 → 占位图 + 重试按钮
2. **空状态**
   - 会话列表空 / 消息列表空 / 右侧面板空 三种插画
3. **加载状态**
   - 会话列表骨架屏
   - 历史消息骨架屏
   - SSE 流期间，最后一条 assistant 气泡显示「思考中」呼吸光标
4. **性能优化**
   - ECharts 按需引入（折线/柱状/饼图）
   - Markdown 渲染 memo 包裹
   - 流式 token 追加用 `useRef` 而不是每 token setState
5. **键盘交互**
   - 输入框 Enter 发送，Shift+Enter 换行
   - Esc 关闭弹窗
6. **回归测试 checklist**
   - 完整跑一遍主流程 1 / 2 / 3
   - 触发所有 Mock 流（image / insight / error）
   - 空会话、空列表、网络错误三种边界

### 验收标准
- 所有 PRD 第 5 节场景表现符合预期
- Lighthouse 性能 > 85，无明显卡顿
- 全量功能可在 Mock 模式下闭环演示

---

## 推进建议

- **不要跳阶段**：P3 没做完不要碰 P5，否则 SSE 调试时会无从下手
- **每阶段一个 commit / PR**：便于回滚和 review
- **Mock 优先**：始终保持 Mock 模式可独立运行，后端联调只是切换一个环境变量
- **设计稿对照**：每个组件先按 `02_UI_SPEC.md` 的尺寸做静态版，再接数据
