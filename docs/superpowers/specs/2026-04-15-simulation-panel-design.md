# 仿真面板设计文档

**日期：** 2026-04-15  
**项目：** broadband-agent-demo-dev  
**功能：** RTMP 推流仿真嵌入 Agent 操作台（正则拦截 + SSE 流 + 动态时序图）

---

## 1. 功能概述

在 `broadband-agent-demo-dev` 的 Workspace 页面中，通过 LeftPanel 输入仿真指令（正则匹配，不走 Agent 接口），驱动 RightPanel 切换为仿真视图，展示 5 张实时滚动的 ECharts 时序图。支持基线仿真 → 故障注入 → 自动自愈三段连续工作流，图表时间轴始终连续延伸，不重置。

---

## 2. 整体架构

```
用户输入 (QueryInput)
    │
    ▼
regex 拦截 (simulationMatcher.ts)
    │  匹配 /^仿真[:：]/
    │
    ├─ "仿真：启动"     ──→ POST /api/simulation/start
    ├─ "仿真故障：XXX"  ──→ POST /api/simulation/inject-fault  (fault_name → fault_id)
    └─ 不匹配          ──→ 原有 Agent 接口（不变）
                            │
                            ▼ SSE 流
                        simulationStore (Zustand)
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
           LeftPanel               RightPanel
        (气泡状态消息)           (SimulationView)
                                 5 × ECharts 时序图
```

### 2.1 后端新增接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/simulation/start` | 运行基线段，SSE 流式推送批次数据 |
| `POST` | `/api/simulation/inject-fault` | `body: {conv_id, fault_name}` — 运行故障段，SSE 流 |
| `POST` | `/api/simulation/remediate` | `body: {conv_id}` — 运行恢复段，SSE 流（前端自动触发） |

所有端点返回 `text/event-stream`，事件类型见第 4 节。

### 2.2 前端新增文件

```
frontend/src/
├── store/
│   └── simulationStore.ts
├── utils/
│   └── simulationMatcher.ts
├── api/
│   └── simulation.ts
└── pages/Workspace/
    ├── RightPanel/
    │   └── SimulationView/
    │       ├── index.tsx
    │       ├── TimeSeriesChart/index.tsx
    │       └── SimulationView.module.css
    └── LeftPanel/
        └── ChatView/
            └── SimBubble/
                ├── index.tsx
                └── SimBubble.module.css
```

---

## 3. 正则拦截规则（simulationMatcher.ts）

```typescript
const FAULT_NAME_MAP: Record<string, number> = {
  "频繁WiFi漫游": 1,
  "WiFi干扰严重": 2,
  "WiFi覆盖弱": 3,
  "上行带宽不足": 4,
  "PON口拥塞": 5,
  "多STA竞争": 6,
  "PON光纤中断": 7,
}

export type SimAction =
  | { type: 'start' }
  | { type: 'inject_fault'; faultName: string; faultId: number }
  | { type: 'unknown_sim_cmd'; raw: string }

export function matchSimCommand(input: string): SimAction | null {
  const trimmed = input.trim()
  if (/^仿真[：:]启动$/.test(trimmed)) return { type: 'start' }
  const faultMatch = trimmed.match(/^仿真故障[：:](.+)$/)
  if (faultMatch) {
    const faultName = faultMatch[1].trim()
    const faultId = FAULT_NAME_MAP[faultName]
    if (faultId) return { type: 'inject_fault', faultName, faultId }
    return { type: 'unknown_sim_cmd', raw: trimmed }
  }
  if (/^仿真/.test(trimmed)) return { type: 'unknown_sim_cmd', raw: trimmed }
  return null   // 不是仿真指令，走原有 Agent 接口

// unknown_sim_cmd 处理：
// - 故障名不在 FAULT_NAME_MAP 中：LeftPanel 显示系统气泡 "未识别的故障名称：XXX。支持的故障：频繁WiFi漫游/WiFi干扰严重/..."
// - 其他 /^仿真/ 指令：显示 "支持的仿真指令：仿真：启动 / 仿真故障：<故障名>"
}
```

`QueryInput` 在 `handleSend` 时先调用 `matchSimCommand`：
- 返回非 `null`：走仿真逻辑，**不调用** `workspaceStore.sendMessage`
- 返回 `null`：原有 Agent 逻辑不变

---

## 4. SSE 事件协议（仿真专用）

| 事件名 | 数据结构 | 说明 |
|---|---|---|
| `sim_batch` | `{batchIndex: number, data: {step[], effective_up_throughput[], buffer_watermark[], stall_active[], tcp_retrans_rate[], up_jitter[], frame_gen_flag[], frame_drop_flag[]}}` | 每批约 200 步，约 50ms 间隔 |
| `sim_segment_end` | `{segType: 'baseline'\|'fault'\|'recovery', summary: {stallRate, avgThroughput, tcpBlockRatio, bandwidthMeetRate}}` | 一段仿真结束 |
| `sim_done` | `{}` | SSE 流关闭 |
| `sim_error` | `{message: string}` | 错误 |

---

## 5. 后端会话状态（api/routes/simulation.py）

```python
@dataclass
class SimSession:
    params: SimParams           # 基线参数（固定）
    sim_prev: dict | None       # 上段末尾状态（供下段 initial_prev）
    step_offset: int            # 累计步数偏移
    fault_config: FaultConfig | None
    segments: list[str]         # ['baseline', 'fault', 'recovery']
    summaries: list[dict]       # 每段 summary，供恢复后对比

_sim_sessions: dict[str, SimSession] = {}  # key = conv_id
```

**故障名 → ID 映射（Python 端镜像前端）：**
```python
FAULT_NAME_TO_ID = {
    "频繁WiFi漫游": 1, "WiFi干扰严重": 2, "WiFi覆盖弱": 3,
    "上行带宽不足": 4, "PON口拥塞": 5,
    "多STA竞争": 6,   "PON光纤中断": 7,
}
```

**批次推送核心流程（三端点共用）：**
```python
async def _stream_simulation(conv_id, seg_type, fault_config=None):
    session = _sim_sessions[conv_id]
    # 1. 同步运行仿真引擎（毫秒级）
    summary, ts, final_prev = engine.simulate(
        session.params,
        collect_timeseries=True,
        fault_config=fault_config,
        initial_prev=session.sim_prev,
        step_offset=session.step_offset,
    )
    # 2. 更新 session 状态
    session.sim_prev = final_prev
    session.step_offset += session.params.total_steps
    session.segments.append(seg_type)
    session.summaries.append(summary_to_dict(summary))

    # 3. 切批推送
    total = len(ts["step"])
    batch_size = max(1, total // 60)   # ~60批，每批50ms → 约3秒动画
    for i in range(0, total, batch_size):
        chunk = {k: list(v[i:i+batch_size]) for k, v in ts.items()}
        yield format_sse("sim_batch", {"batchIndex": i // batch_size, "data": chunk})
        await asyncio.sleep(0.05)

    yield format_sse("sim_segment_end", {"segType": seg_type, "summary": ...})
    yield format_sse("sim_done", {})
```

**`sys.path` 扩展：** `simulation.py` 顶部将 `C:\Users\angli\FAE_demo` 加入 `sys.path`，直接 import 现有仿真引擎，无需复制代码。

---

## 6. 前端状态（simulationStore.ts）

```typescript
interface SimulationState {
  active: boolean                     // RightPanel 是否显示 SimulationView
  streaming: boolean                  // SSE 进行中
  phase: 'idle'|'baseline'|'fault'|'recovery'
  chartData: {
    time: string[]
    throughput: number[]
    buffer: number[]
    stall: number[]
    tcpRetrans: number[]
    jitter: number[]
    frameGen: number[]
    frameDrop: number[]
  }
  segments: Array<{
    startIdx: number
    endIdx: number
    type: 'baseline'|'fault'|'recovery'
  }>
  summaries: SimSummary[]
  convId: string | null
}
```

**核心 actions：**
- `startSimulation(convId)` — 设 `active=true`，清空 chartData，调用 `/api/simulation/start`
- `injectFault(faultName, faultId)` — 调用 `/api/simulation/inject-fault`
- `remediate()` — 调用 `/api/simulation/remediate`（`sim_segment_end{segType:'fault'}` 收到后自动调用）
- `appendBatch(data)` — 追加批次数据，更新 segments 边界
- `finishStreaming()` — `streaming=false`，触发图表 dataZoom slider 显示

**自动触发逻辑（前端）：**
```typescript
// simulationStore 中 SSE 处理
case 'sim_segment_end':
  if (data.segType === 'fault') {
    // 自动触发自愈：添加诊断气泡，然后调用 remediate
    addSimBubble({ type: 'diagnosing', faultName: state.currentFaultName })
    get().remediate()
  }
  if (data.segType === 'baseline') {
    // 基线段完成：仅结束 streaming，无额外 UI 动作
    set({ streaming: false })
  }
  break
```

---

## 7. LeftPanel 气泡流程

| 触发时机 | 显示内容 |
|---|---|
| 输入 `仿真：启动` | 用户气泡 + 系统气泡 "仿真已启动，正在运行基线段..." |
| 输入 `仿真故障：XXX` | 用户气泡 + "正在注入故障：XXX..." |
| 收到 `sim_segment_end{segType:'fault'}` | "🔍 调用故障树，定界定位的结果为：XXX。正在执行对应的远程闭环措施..." |
| 收到 `sim_segment_end{segType:'recovery'}` | before/after 对比气泡 |

**恢复段完成气泡内容（对比表）：**
```
✅ 闭环措施已执行：<measure_list>

             故障段      恢复段      改善
  卡顿率     X%      →   Y%      ↓ -Z%
  平均吞吐   X Mbps  →   Y Mbps  ↑ +Z%
  TCP阻塞    X%      →   Y%      ↓ -Z%
  带宽达标率  X%     →   Y%      ↑ +Z%
```

---

## 8. RightPanel SimulationView

### 8.1 时间轴连续延伸机制

```
基线段          故障段（红背景）     恢复段（绿背景）
[0 ── T1] ──→ [T1 ── T2] ──────→ [T2 ── T3]
                                    时间轴只增不重置
```

- `chartData` 全局累积，`appendBatch` 追加到末尾
- `segments` 记录各段起止索引，用于 `markArea` 渲染背景色
- 流式进行时：视窗滑动窗口（150 点），自动右移
- 流式结束时：显示 dataZoom 滑块，允许全程回看

### 8.2 五张图配置

| # | 标题 | 高度 | 系列 | 特殊标线 |
|---|---|---|---|---|
| 1 | 端到端上行带宽时序图 | 260px | 上行有效吞吐量（蓝线） | 码率阈值红虚线 |
| 2 | 缓冲区水位时序图 | 220px | 缓冲区水位 KB（橙色填充） | — |
| 3 | 卡顿状态时序图 | 180px | 卡顿 0/1（红色柱状） | — |
| 4 | TCP重传率/时延抖动时序图 | 260px | TCP重传率%（紫线）+ 抖动ms（青线） | TCP阈值红虚线 |
| 5 | 帧生成/丢弃时序图 | 180px | 帧生成（绿柱）+ 帧丢弃（红柱，取负） | — |

**段背景色：**
- `fault`：`rgba(231, 76, 60, 0.15)`
- `recovery`：`rgba(46, 204, 113, 0.15)`

### 8.3 布局

5 张图垂直排列，可滚动，图间距 12px。仿真启动后 RightPanel 完全替换为 SimulationView；Agent 会话产生的图表被清除（`simulationStore.active=true` 时 RightPanel 优先渲染 SimulationView）。

---

## 9. 完整用户流程

```
① 用户: "仿真：启动"
   → LeftPanel: 用户气泡 + "仿真已启动，正在运行基线段..."
   → RightPanel: 切换为 SimulationView（5 张空图）
   → POST /api/simulation/start  (conv_id)
   → SSE sim_batch × N  →  图表逐批追加数据，视窗右滑
   → SSE sim_segment_end{baseline}  →  streaming=false，显示滑块

② 用户: "仿真故障：WiFi干扰严重"
   → LeftPanel: 用户气泡 + "正在注入故障：WiFi干扰严重..."
   → POST /api/simulation/inject-fault {conv_id, fault_name:"WiFi干扰严重", fault_id:2}
   → SSE sim_batch × N  →  图表继续追加（红色背景区域）
   → SSE sim_segment_end{fault}

③ 自动触发（前端收到 fault segment_end 后）
   → LeftPanel: "🔍 调用故障树，定界定位的结果为：WiFi干扰严重。正在执行对应的远程闭环措施..."
   → POST /api/simulation/remediate {conv_id}
   → SSE sim_batch × N  →  图表继续追加（绿色背景区域）
   → SSE sim_segment_end{recovery}
   → LeftPanel: before/after 对比气泡（措施名 + 4 项指标对比）
   → streaming=false，全程 dataZoom 滑块显示
```

---

## 10. 依赖与约束

- 后端 `simulation.py` 通过 `sys.path` 直接引用 `C:\Users\angli\FAE_demo`，不复制仿真引擎代码
- 故障注入模式固定为**随机注入**，`random_fault_count=30`，`random_fault_max_duration=30`（需求 3 指定）
- 前端不新增 npm 包：`TimeSeriesChart` 使用原生 `echarts` + `useRef` 直接操作实例（而非 `echarts-for-react`），原因是需要每批次增量 `setOption` 追加数据，原生方式性能更好。`echarts` 包已在 `package.json` 中，无需新增依赖
- 仿真 SSE 流与 Agent SSE 流是独立的 fetch 请求，互不干扰
- `simulationStore` 与 `workspaceStore` 完全解耦，通过 `RightPanel` 中的条件渲染切换视图
