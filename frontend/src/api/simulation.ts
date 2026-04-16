const getBaseURL = () => (import.meta.env.VITE_API_BASE as string | undefined) || '/api';

export async function startSimulation(convId: string, signal?: AbortSignal): Promise<Response> {
  const resp = await fetch(`${getBaseURL()}/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ conv_id: convId }),
    signal,
  });
  if (!resp.ok) throw new Error(`仿真启动失败: ${resp.status}`);
  return resp;
}

export async function injectFault(
  convId: string,
  faultName: string,
  signal?: AbortSignal,
): Promise<Response> {
  const resp = await fetch(`${getBaseURL()}/simulation/inject-fault`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ conv_id: convId, fault_name: faultName }),
    signal,
  });
  if (!resp.ok) throw new Error(`故障注入失败: ${resp.status}`);
  return resp;
}

export async function remediate(convId: string, signal?: AbortSignal): Promise<Response> {
  const resp = await fetch(`${getBaseURL()}/simulation/remediate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ conv_id: convId }),
    signal,
  });
  if (!resp.ok) throw new Error(`自愈启动失败: ${resp.status}`);
  return resp;
}
