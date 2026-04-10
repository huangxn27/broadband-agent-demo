export interface SseEvent {
  delayMs: number;
  event: string;
  data: unknown;
}

/**
 * 把 mock SSE 事件序列回放为一个标准 EventSource 流。
 * delayMs 是每个事件相对开始时间的累计延迟（毫秒）。
 */
export function replaySse(events: SseEvent[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let prev = 0;
      for (const e of events) {
        const wait = Math.max(0, e.delayMs - prev);
        if (wait > 0) {
          await new Promise((r) => setTimeout(r, wait));
        }
        prev = e.delayMs;
        const chunk = `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
