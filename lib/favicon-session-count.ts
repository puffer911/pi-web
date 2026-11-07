import { listSessionFamilies } from "./session-family";
import type { SessionInfo } from "./types";

export type FaviconSessionState = "standby" | "running" | "partial" | "complete";

export interface FaviconSessionStatus {
  state: FaviconSessionState;
  count: number;
}

/** Returns one count per root session while preserving subagent suppression. */
export function getFaviconSessionStatus(
  sessions: readonly SessionInfo[],
  runningSessionIds: ReadonlySet<string>,
  completedSessionIds: ReadonlySet<string>,
  unreadSessionIds: ReadonlySet<string>,
): FaviconSessionStatus {
  const families = listSessionFamilies(sessions);
  const knownRootIds = new Set(families.map((family) => family.root.id));
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const rootIdBySessionId = new Map<string, string>();

  families.forEach((family) => {
    rootIdBySessionId.set(family.root.id, family.root.id);
    family.subagents.forEach((session) => rootIdBySessionId.set(session.id, family.root.id));
  });

  const runningRootIds = new Set<string>();
  runningSessionIds.forEach((id) => {
    const rootId = rootIdBySessionId.get(id);
    const session = sessionById.get(id);
    if (rootId) runningRootIds.add(rootId);
    else if (session?.relation?.kind !== "subagent") runningRootIds.add(id);
  });

  const attentionRootIds = new Set<string>();
  for (const id of new Set([...completedSessionIds, ...unreadSessionIds])) {
    const session = sessionById.get(id);
    if (session?.relation?.kind === "subagent") continue;
    const rootId = rootIdBySessionId.get(id) ?? id;
    if (knownRootIds.has(rootId)) attentionRootIds.add(rootId);
  }

  const hasRunning = runningRootIds.size > 0;
  const hasCompleted = [...attentionRootIds].some((id) => !runningRootIds.has(id));
  const state: FaviconSessionState = !hasRunning
    ? (hasCompleted ? "complete" : "standby")
    : (hasCompleted ? "partial" : "running");
  const count = new Set([...runningRootIds, ...attentionRootIds]).size;

  return { state, count };
}
