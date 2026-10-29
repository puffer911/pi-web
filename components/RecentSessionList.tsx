"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { SessionInfo } from "@/lib/types";
import { formatShortRelativeTime } from "@/lib/i18n/format";
import { isPlainActivation, sessionDeepLink } from "@/lib/session-links";
import { useI18n } from "@/hooks/useI18n";
import { useScrollbarVisibility } from "@/hooks/useScrollbarVisibility";
import { sessionRowTitle } from "./SessionTree";
import { MoreIcon, SpinnerIcon } from "./SidebarIcons";

const RECENT_SESSION_LIMIT = 100;

type RecentSessionStatus = "running" | "awaiting" | "unread" | "completed" | "idle";

interface Props {
  sessions: readonly SessionInfo[];
  archivedSessionIds: ReadonlySet<string>;
  runningSessionIds: ReadonlySet<string>;
  awaitingInputSessionIds: ReadonlySet<string>;
  unreadSessionIds: ReadonlySet<string>;
  completedSessionIds?: ReadonlySet<string>;
  selectedSessionId: string | null;
  loading: boolean;
  error: string | null;
  layout: "desktop" | "mobile";
  onSelectSession: (session: SessionInfo) => void;
  onOpenMenu?: (session: SessionInfo, opener: HTMLElement) => void;
  menuSessionId?: string | null;
}

function sessionTime(session: SessionInfo): number {
  const time = Date.parse(session.modified);
  return Number.isNaN(time) ? -Infinity : time;
}

/** The complete Recent ordering, before the visible 100-row cap. */
export function recentSessionCandidates(
  sessions: readonly SessionInfo[],
  archivedSessionIds: ReadonlySet<string>,
): SessionInfo[] {
  return [...sessions]
    .filter((session) => (
      !session.transient
      && session.relation?.kind !== "subagent"
      && !archivedSessionIds.has(session.id)
    ))
    .sort((a, b) => sessionTime(b) - sessionTime(a) || b.path.localeCompare(a.path));
}

/** Root ids from a Recent row through the oldest matching Recent session. */
export function recentSessionIdsAtOrOlder(
  sessions: readonly SessionInfo[],
  archivedSessionIds: ReadonlySet<string>,
  sessionId: string,
): string[] {
  const candidates = recentSessionCandidates(sessions, archivedSessionIds);
  const index = candidates.findIndex((session) => session.id === sessionId);
  return index < 0 ? [] : candidates.slice(index).map((session) => session.id);
}

function agentPathSegment(cwd: string): string | null {
  const segments = cwd.split(/[\\/]+/).filter(Boolean);
  return [...segments].reverse().find((segment) => /^agent(?:[-_].+)?$/i.test(segment) || /^sre$/i.test(segment)) ?? null;
}

/**
 * Pi does not persist a separate agent identity in SessionInfo. Agent lanes in
 * the shared workspace are conventionally named `agent-*`; the SRE lane uses
 * a plain `sre` segment. Expose that path component when it is available,
 * without guessing for ordinary projects.
 */
export function recentSessionAgentLabel(session: SessionInfo): string | null {
  return agentPathSegment(session.cwd);
}

export function recentSessionStatus(
  session: SessionInfo,
  runningSessionIds: ReadonlySet<string>,
  awaitingInputSessionIds: ReadonlySet<string>,
  unreadSessionIds: ReadonlySet<string>,
  completedSessionIds: ReadonlySet<string> = new Set(),
): RecentSessionStatus {
  if (awaitingInputSessionIds.has(session.id)) return "awaiting";
  if (runningSessionIds.has(session.id)) return "running";
  if (unreadSessionIds.has(session.id)) return "unread";
  if (completedSessionIds.has(session.id)) return "completed";
  return "idle";
}

export function RecentSessionList({
  sessions,
  archivedSessionIds,
  runningSessionIds,
  awaitingInputSessionIds,
  unreadSessionIds,
  completedSessionIds,
  selectedSessionId,
  loading,
  error,
  layout,
  onSelectSession,
  onOpenMenu,
  menuSessionId,
}: Props) {
  const { locale, t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  useScrollbarVisibility(scrollRef);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const recentSessions = useMemo(
    () => recentSessionCandidates(sessions, archivedSessionIds).slice(0, RECENT_SESSION_LIMIT),
    [archivedSessionIds, sessions],
  );

  return (
    <div className={`recent-session-list${layout === "mobile" ? " is-mobile" : ""}`}>
      <div ref={scrollRef} className="recent-session-scroll scrollbar-subtle">
        {loading && <div className="recent-session-message">{t("sidebar.loading")}</div>}
        {error && <div className="recent-session-message is-error">{error}</div>}
        {!loading && !error && recentSessions.length === 0 && (
          <div className="recent-session-message">{t("sidebar.noRecentSessions")}</div>
        )}
        {!loading && !error && recentSessions.map((session) => {
          const status = recentSessionStatus(session, runningSessionIds, awaitingInputSessionIds, unreadSessionIds, completedSessionIds);
          const statusLabel = status === "awaiting"
            ? t("sidebar.agentAwaitingInput")
            : status === "running"
              ? t("sidebar.agentRunning")
              : status === "unread"
                ? t("sidebar.newActivity")
                : status === "completed"
                  ? t("sidebar.agentCompleted")
                  : t("sidebar.sessionIdle");
          const title = sessionRowTitle(session);
          const agent = recentSessionAgentLabel(session) ?? t("sidebar.unknownAgent");
          const time = formatShortRelativeTime(session.modified, locale, new Date(now));
          const details = t("sidebar.recentSessionDetails", { agent, time });
          const selected = session.id === selectedSessionId;
          const menuOpen = session.id === menuSessionId;

          return (
            <div key={session.id} className={`recent-session-row${selected ? " is-selected" : ""}${menuOpen ? " is-menu-open" : ""}`}>
              <a
                className="recent-session-main"
                href={sessionDeepLink(session.id)}
                title={`${title}\n${details}`}
                aria-current={selected ? "true" : undefined}
                onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
                  if (!isPlainActivation(event)) return;
                  event.preventDefault();
                  onSelectSession(session);
                }}
              >
                {status === "running" ? (
                  <SpinnerIcon size={12} label={statusLabel} className="recent-session-status is-running" />
                ) : (
                  <span className={`recent-session-status is-${status}`} role="img" aria-label={statusLabel} title={statusLabel} />
                )}
                <span className="recent-session-title">{title}</span>
                <span className="recent-session-details">
                  <span className="recent-session-agent">{agent}</span>
                  <span className="recent-session-time">{time}</span>
                </span>
              </a>
              {onOpenMenu && (
                <button
                  type="button"
                  className={`recent-session-more-action${menuOpen ? " is-active" : ""}`}
                  aria-label={t("sidebar.moreActions")}
                  title={t("sidebar.moreActions")}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenMenu(session, event.currentTarget);
                  }}
                >
                  <MoreIcon size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
