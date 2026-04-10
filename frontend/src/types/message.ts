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

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  thinkingContent?: string;
  thinkingDurationSec?: number;
  steps?: Step[];
  renderBlocks?: RenderBlock[];
  /** 流式过程标记：true 表示该 message 还在生成中 */
  streaming?: boolean;
  /** 错误标记：流式过程中报错 */
  error?: string;
  createdAt: string;
}

export interface MessageListResp {
  list: Message[];
}
