/** 最近一次停留的位置，只用于 `/` 的默认去向；不是业务状态。 */
const LAST = 'baseagent.last.v1';

export interface LastLocation {
  workspaceId?: string;
  sessionId?: string;
}

export function rememberLocation(first: string, second?: string): void {
  try {
    const sessionId = second !== undefined ? second : first;
    const workspaceId = second !== undefined ? first : undefined;
    window.localStorage.setItem(LAST, JSON.stringify({ sessionId, workspaceId }));
  } catch {
    // 隐私模式或存储被禁用：不记住
  }
}

export function lastLocation(): LastLocation | null {
  try {
    const raw = window.localStorage.getItem(LAST);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastLocation>;
    return {
      workspaceId: parsed.workspaceId,
      sessionId: parsed.sessionId,
    };
  } catch {
    return null;
  }
}
