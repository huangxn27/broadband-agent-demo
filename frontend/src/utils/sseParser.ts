/**
 * SSE 流解析器：把 fetch ReadableStream 转成 (event, data) 回调。
 * 协议参考 EventSource：
 *   event: <name>\n
 *   data: <json>\n
 *   \n
 */

export interface ParsedSseEvent {
  event: string;
  data: unknown;
}

export async function parseSseStream(
  response: Response,
  onEvent: (e: ParsedSseEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('SSE response has no body');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 按双换行切分出完整 event
      let sepIdx: number;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const parsed = parseSingleEvent(raw);
        if (parsed) onEvent(parsed);
      }
    }
    // 处理 buffer 残余
    if (buffer.trim()) {
      const parsed = parseSingleEvent(buffer);
      if (parsed) onEvent(parsed);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}

function parseSingleEvent(raw: string): ParsedSseEvent | null {
  const lines = raw.split('\n');
  let event = 'message';
  const dataParts: string[] = [];
  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trim());
    }
  }
  if (dataParts.length === 0) return null;
  const dataStr = dataParts.join('\n');
  let data: unknown;
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = dataStr;
  }
  return { event, data };
}
