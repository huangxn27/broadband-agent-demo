import type { RenderBlock } from './render';

export interface ThinkingEvent {
  delta: string;
  /** 存在时表示这段 thinking 属于某个 step，否则属于 Orchestrator */
  stepId?: string;
}
export interface TextEvent {
  delta: string;
}
export interface StepStartEvent {
  stepId: string;
  title: string;
}
export interface SubStepEvent {
  stepId: string;
  subStepId: string;
  name: string;
  scriptPath?: string;
  callArgs?: string[];
  stdout?: string;
  stderr?: string;
  completedAt: string;
  durationMs: number;
}
export interface StepEndEvent {
  stepId: string;
}
export type RenderEvent = RenderBlock;
export interface DoneEvent {
  messageId: string;
  thinkingDurationSec: number;
}
export interface ErrorEvent {
  message: string;
}

export type SseEventName =
  | 'thinking'
  | 'text'
  | 'step_start'
  | 'sub_step'
  | 'step_end'
  | 'render'
  | 'done'
  | 'error';
