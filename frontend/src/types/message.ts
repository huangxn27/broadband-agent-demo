import type { RenderBlock } from './render';

export interface SubStep {
  subStepId: string;
  name: string;
  result: string;
  completedAt: string;
  durationMs: number;
}

export interface Step {
  stepId: string;
  title: string;
  subSteps: SubStep[];
}

export type MessageRole = 'user' | 'assistant';

/**
 * 有序渲染块：SSE 事件流中各类内容按到达顺序追加到 blocks[]，
 * 渲染时直接遍历，保证 thinking / step / text 的视觉顺序与流顺序一致。
 */
export type MessageBlock =
  | { type: 'thinking'; content: string }
  | { type: 'step'; stepId: string }
  | { type: 'text'; content: string };

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  thinkingContent?: string;
  thinkingDurationSec?: number;
  steps?: Step[];
  renderBlocks?: RenderBlock[];
  /** 流式渲染块（按实际到达顺序）；历史消息按 thinking→steps→text 重建 */
  blocks?: MessageBlock[];
  /** 流式过程标记：true 表示该 message 还在生成中 */
  streaming?: boolean;
  /** 错误标记：流式过程中报错 */
  error?: string;
  createdAt: string;
}

export interface MessageListResp {
  list: Message[];
}
