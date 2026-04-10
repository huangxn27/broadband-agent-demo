import { get } from './request';
import type { MessageListResp } from '@/types/message';

export function getMessages(conversationId: string) {
  return get<MessageListResp>(`/conversations/${conversationId}/messages`);
}

/** SSE 发送消息 — 直接返回 fetch Response，由 useSSE 解析 */
export async function sendMessageStream(
  conversationId: string,
  body: { content: string; deepThinking: boolean },
  signal?: AbortSignal,
): Promise<Response> {
  const baseURL = import.meta.env.VITE_API_BASE || '/api';
  const resp = await fetch(`${baseURL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });
  if (!resp.ok) {
    throw new Error(`SSE 请求失败: ${resp.status}`);
  }
  return resp;
}
