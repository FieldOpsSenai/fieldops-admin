let pendingRefresh: Promise<boolean> | null = null;
let controller: AbortController | null = null;

export function cancelSessionRefresh() {
  controller?.abort();
  controller = null;
  pendingRefresh = null;
}

/** Concurrent 401 responses share one refresh request; transient failures retain the session. */
export function refreshSession(): Promise<boolean> {
  if (pendingRefresh) return pendingRefresh;
  controller = new AbortController();
  const signal = controller.signal;
  const task = (async () => {
    const response = await fetch('/api/session/refresh', { method: 'POST', cache: 'no-store', signal });
    if (response.status === 401 || response.status === 403) return false;
    if (!response.ok) throw new Error('O serviço de renovação está indisponível. Tente novamente.');
    return true;
  })();
  pendingRefresh = task;
  void task.finally(() => {
    if (pendingRefresh === task) { pendingRefresh = null; controller = null; }
  }).catch(() => undefined);
  return task;
}
