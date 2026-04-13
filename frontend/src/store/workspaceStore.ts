import { create } from 'zustand';
import { getMessages, sendMessageStream } from '@/api/messages';

import { useConversationStore } from '@/store/conversationStore';
import { parseSseStream } from '@/utils/sseParser';
import type { Message, Step, SubStep, MessageBlock } from '@/types/message';
import type { RenderBlock } from '@/types/render';
import type {
  DoneEvent,
  ErrorEvent as SseErrorEvent,
  StepStartEvent,
  StepEndEvent,
  SubStepEvent,
  TextEvent,
  ThinkingEvent,
} from '@/types/sse';

export type LeftView = 'list' | 'chat';

interface WorkspaceState {
  // 视图
  leftView: LeftView;
  activeConversationId: string | null;

  // 消息（per conversation）
  messagesByConvId: Record<string, Message[]>;
  messagesLoadingConvIds: Set<string>;

  // 流式状态（per conversation）
  streamingConvIds: Set<string>;

  // 右侧渲染
  currentRender: RenderBlock | null;

  // 内部 abort controllers（per conversation）
  _abortCtrls: Record<string, AbortController>;

  // actions
  setLeftView: (view: LeftView) => void;
  setActiveConversation: (id: string | null) => void;
  openConversation: (id: string) => void;
  backToList: () => void;
  loadMessages: (id: string) => Promise<void>;
  sendMessage: (content: string, deepThinking: boolean) => Promise<void>;
  abortStream: (convId?: string) => void;
  setRender: (block: RenderBlock | null) => void;
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 从历史 message 重建 blocks */
function rebuildBlocks(m: Message): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  if (m.thinkingContent?.trim()) {
    blocks.push({ type: 'thinking', content: m.thinkingContent, startedAt: 0, endedAt: 0 });
  }
  for (const step of m.steps ?? []) {
    step.completed = true;
    step.items = step.subSteps.map((sub) => ({ type: 'sub_step' as const, data: sub }));
    blocks.push({ type: 'step', stepId: step.stepId });
  }
  if (m.content?.trim()) {
    blocks.push({ type: 'text', content: m.content });
  }
  return blocks;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  leftView: 'list',
  activeConversationId: null,
  messagesByConvId: {},
  messagesLoadingConvIds: new Set(),
  streamingConvIds: new Set(),
  currentRender: null,
  _abortCtrls: {},

  setLeftView: (view) => set({ leftView: view }),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  openConversation: (id) => {
    // 切换会话时不中止其他会话的流，只切换视图
    set({ leftView: 'chat', activeConversationId: id });
  },

  backToList: () => {
    set({ leftView: 'list' });
  },

  loadMessages: async (id) => {
    // 已有缓存则不重复请求
    if (get().messagesByConvId[id]) return;

    set((s) => ({ messagesLoadingConvIds: new Set([...s.messagesLoadingConvIds, id]) }));
    try {
      const resp = await getMessages(id);
      const list = (resp.list ?? []).map((m) => {
        if (m.role !== 'assistant') return m;
        return { ...m, blocks: rebuildBlocks(m) };
      });
      let lastRender: RenderBlock | null = null;
      for (let i = list.length - 1; i >= 0; i--) {
        const m = list[i];
        if (m.role === 'assistant' && m.renderBlocks && m.renderBlocks.length > 0) {
          lastRender = m.renderBlocks[m.renderBlocks.length - 1];
          break;
        }
      }
      set((s) => ({
        messagesByConvId: { ...s.messagesByConvId, [id]: list },
        // 仅当切换到该会话时才更新右侧渲染
        currentRender: s.activeConversationId === id ? lastRender : s.currentRender,
      }));
    } catch (e) {
      console.error('loadMessages failed', e);
      set((s) => ({ messagesByConvId: { ...s.messagesByConvId, [id]: [] } }));
    } finally {
      set((s) => {
        const next = new Set(s.messagesLoadingConvIds);
        next.delete(id);
        return { messagesLoadingConvIds: next };
      });
    }
  },

  sendMessage: async (content, deepThinking) => {
    const { activeConversationId, streamingConvIds } = get();
    if (!activeConversationId) return;
    const convId = activeConversationId;

    // 当前会话正在流式中则不重复发送
    if (streamingConvIds.has(convId)) return;

    // 首条消息时更新会话标题
    const existingMsgs = get().messagesByConvId[convId] ?? [];
    const isFirstMessage = existingMsgs.filter((m) => m.role === 'user').length === 0;
    if (isFirstMessage) {
      const title = content.trim().slice(0, 30);
      useConversationStore.getState().updateTitle(convId, title).catch(() => {});
    }

    // 追加用户消息
    const userMsg: Message = {
      id: newId('msg_user'),
      conversationId: convId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    // 追加占位 assistant 消息
    const assistantId = newId('msg_asst');
    const assistantMsg: Message = {
      id: assistantId,
      conversationId: convId,
      role: 'assistant',
      content: '',
      thinkingContent: '',
      steps: [],
      renderBlocks: [],
      blocks: [],
      streaming: true,
      createdAt: new Date().toISOString(),
    };

    const appendMsgs = (prev: Message[]) => [...prev, userMsg, assistantMsg];
    set((s) => ({
      messagesByConvId: {
        ...s.messagesByConvId,
        [convId]: appendMsgs(s.messagesByConvId[convId] ?? []),
      },
      streamingConvIds: new Set([...s.streamingConvIds, convId]),
      // 切换到当前会话时清空右侧渲染
      currentRender: s.activeConversationId === convId ? null : s.currentRender,
    }));

    const ctrl = new AbortController();
    set((s) => ({ _abortCtrls: { ...s._abortCtrls, [convId]: ctrl } }));

    // helper：immutable 更新指定会话的 assistant 消息
    const updateAssistant = (updater: (m: Message) => Message) => {
      set((s) => {
        const msgs = s.messagesByConvId[convId] ?? [];
        return {
          messagesByConvId: {
            ...s.messagesByConvId,
            [convId]: msgs.map((m) => (m.id === assistantId ? updater(m) : m)),
          },
        };
      });
    };

    try {
      const resp = await sendMessageStream(convId, { content, deepThinking }, ctrl.signal);
      const sseLog: { event: string; data: unknown }[] = [];
      await parseSseStream(
        resp,
        (e) => {
          sseLog.push({ event: e.event, data: e.data });
          switch (e.event) {
            case 'thinking': {
              const d = e.data as ThinkingEvent;
              if (d.stepId) {
                updateAssistant((m) => ({
                  ...m,
                  steps: (m.steps ?? []).map((s) => {
                    if (s.stepId !== d.stepId) return s;
                    const items = s.items ?? [];
                    const last = items[items.length - 1];
                    if (last?.type === 'thinking' && !last.endedAt) {
                      return {
                        ...s,
                        items: [
                          ...items.slice(0, -1),
                          { ...last, content: last.content + d.delta },
                        ],
                      };
                    }
                    return {
                      ...s,
                      items: [
                        ...items,
                        { type: 'thinking' as const, content: d.delta, startedAt: Date.now() },
                      ],
                    };
                  }),
                }));
              } else {
                updateAssistant((m) => {
                  const blocks = m.blocks ?? [];
                  const last = blocks[blocks.length - 1];
                  const newBlocks: MessageBlock[] =
                    last?.type === 'thinking' && !last.endedAt
                      ? [...blocks.slice(0, -1), { ...last, content: last.content + d.delta }]
                      : [...blocks, { type: 'thinking', content: d.delta, startedAt: Date.now() }];
                  return { ...m, blocks: newBlocks, thinkingContent: (m.thinkingContent ?? '') + d.delta };
                });
              }
              break;
            }
            case 'text': {
              const d = e.data as TextEvent;
              updateAssistant((m) => {
                const blocks = m.blocks ?? [];
                const last = blocks[blocks.length - 1];
                const closedBlocks = last?.type === 'thinking' && !last.endedAt
                  ? [...blocks.slice(0, -1), { ...last, endedAt: Date.now() }]
                  : blocks;
                const prevLast = closedBlocks[closedBlocks.length - 1];
                const newBlocks: MessageBlock[] =
                  prevLast?.type === 'text'
                    ? [...closedBlocks.slice(0, -1), { type: 'text', content: prevLast.content + d.delta }]
                    : [...closedBlocks, { type: 'text', content: d.delta }];
                return { ...m, blocks: newBlocks, content: m.content + d.delta };
              });
              break;
            }
            case 'step_start': {
              const d = e.data as StepStartEvent;
              const newStep: Step = { stepId: d.stepId, title: d.title, subSteps: [], items: [] };
              updateAssistant((m) => {
                const blocks = m.blocks ?? [];
                const last = blocks[blocks.length - 1];
                const closedBlocks = last?.type === 'thinking' && !last.endedAt
                  ? [...blocks.slice(0, -1), { ...last, endedAt: Date.now() }]
                  : blocks;
                return {
                  ...m,
                  blocks: [...closedBlocks, { type: 'step', stepId: d.stepId }],
                  steps: [...(m.steps ?? []), newStep],
                };
              });
              break;
            }
            case 'sub_step': {
              const d = e.data as SubStepEvent;
              const sub: SubStep = {
                subStepId: d.subStepId,
                name: d.name,
                scriptPath: d.scriptPath,
                callArgs: d.callArgs,
                stdout: d.stdout,
                stderr: d.stderr,
                completedAt: d.completedAt,
                durationMs: d.durationMs,
              };
              updateAssistant((m) => ({
                ...m,
                steps: (m.steps ?? []).map((s) => {
                  if (s.stepId !== d.stepId) return s;
                  const closedItems = (s.items ?? []).map((item, idx) =>
                    idx === s.items.length - 1 && item.type === 'thinking' && !item.endedAt
                      ? { ...item, endedAt: Date.now() }
                      : item,
                  );
                  return {
                    ...s,
                    subSteps: [...s.subSteps, sub],
                    items: [...closedItems, { type: 'sub_step' as const, data: sub }],
                  };
                }),
              }));
              break;
            }
            case 'step_end': {
              const d = e.data as StepEndEvent;
              updateAssistant((m) => ({
                ...m,
                steps: (m.steps ?? []).map((s) => {
                  if (s.stepId !== d.stepId) return s;
                  const closedItems = (s.items ?? []).map((item, idx) =>
                    idx === s.items.length - 1 && item.type === 'thinking' && !item.endedAt
                      ? { ...item, endedAt: Date.now() }
                      : item,
                  );
                  return { ...s, completed: true, items: closedItems };
                }),
              }));
              break;
            }
            case 'render': {
              const block = e.data as RenderBlock;
              updateAssistant((m) => ({
                ...m,
                renderBlocks: [...(m.renderBlocks ?? []), block],
              }));
              // 仅当前活跃会话才更新右侧渲染
              if (get().activeConversationId === convId) {
                set({ currentRender: block });
              }
              break;
            }
            case 'done': {
              const d = e.data as DoneEvent;
              updateAssistant((m) => {
                const blocks = m.blocks ?? [];
                const last = blocks[blocks.length - 1];
                const closedBlocks = last?.type === 'thinking' && !last.endedAt
                  ? [...blocks.slice(0, -1), { ...last, endedAt: Date.now() }]
                  : blocks;
                return {
                  ...m,
                  blocks: closedBlocks,
                  streaming: false,
                  thinkingDurationSec: d.thinkingDurationSec,
                };
              });
              break;
            }
            case 'error': {
              const d = e.data as SseErrorEvent;
              updateAssistant((m) => ({ ...m, streaming: false, error: d.message }));
              break;
            }
            default:
              break;
          }
        },
        ctrl.signal,
      );

      // 开发模式写 SSE 日志
      if (import.meta.env.DEV && sseLog.length > 0) {
        fetch('/dev/sse-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ convId, events: sseLog }),
        }).catch(() => {});
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        // 主动中止，不视为错误
      } else {
        const msg = (err as Error)?.message || '网络错误';
        updateAssistant((m) => ({ ...m, streaming: false, error: msg }));
      }
    } finally {
      set((s) => {
        const nextStreaming = new Set(s.streamingConvIds);
        nextStreaming.delete(convId);
        const nextCtrls = { ...s._abortCtrls };
        delete nextCtrls[convId];
        return { streamingConvIds: nextStreaming, _abortCtrls: nextCtrls };
      });
    }
  },

  abortStream: (convId?: string) => {
    const id = convId ?? get().activeConversationId;
    if (!id) return;
    const ctrl = get()._abortCtrls[id];
    if (ctrl) {
      ctrl.abort();
      set((s) => {
        const nextStreaming = new Set(s.streamingConvIds);
        nextStreaming.delete(id);
        const nextCtrls = { ...s._abortCtrls };
        delete nextCtrls[id];
        return { streamingConvIds: nextStreaming, _abortCtrls: nextCtrls };
      });
    }
  },

  setRender: (block) => set({ currentRender: block }),
}));
