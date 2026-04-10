import type { RenderBlock } from './render';

export interface ThinkingEvent {
  delta: string;
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
  result: string;
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
