import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { jsx: { runtime: "automatic" }, tsconfigPaths: true });
const React = await jiti.import("react");
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { I18nProvider } = await jiti.import("@/hooks/useI18n");
const { RecentSessionList, recentSessionAgentLabel, recentSessionStatus } = await jiti.import("./RecentSessionList.tsx");

const h = React.createElement;
const noop = () => {};
const NOW = Date.now();

function session(id, project = "/work/agent-coder", offset = 0, extra = {}) {
  const modified = new Date(NOW - offset).toISOString();
  return {
    path: `${project}/${id}.jsonl`,
    id,
    cwd: project,
    projectRoot: project,
    projectKey: project,
    created: modified,
    modified,
    messageCount: 1,
    firstMessage: id,
    ...extra,
  };
}

function render(props = {}) {
  return renderToStaticMarkup(h(I18nProvider, null, h(RecentSessionList, {
    sessions: [],
    archivedSessionIds: new Set(),
    runningSessionIds: new Set(),
    awaitingInputSessionIds: new Set(),
    unreadSessionIds: new Set(),
    selectedSessionId: null,
    loading: false,
    error: null,
    layout: "desktop",
    onSelectSession: noop,
    ...props,
  })));
}

test("sorts recent saved top-level sessions and omits archived, transient and subagent rows", () => {
  const newest = session("newest", "/work/agent-coder", 1_000);
  const older = session("older", "/work/agent-designer", 10_000);
  const archived = session("archived", "/work/agent-marketing", 2_000);
  const transient = session("transient", "/work/agent-coder", 500, { transient: true });
  const subagent = session("child", "/work/agent-coder", 250, {
    relation: { kind: "subagent", parentSessionId: "newest", profile: "review", description: "", status: "completed" },
  });
  const html = render({
    sessions: [older, subagent, transient, archived, newest],
    archivedSessionIds: new Set([archived.id]),
  });
  assert.ok(html.indexOf('href="?session=newest"') < html.indexOf('href="?session=older"'));
  assert.doesNotMatch(html, /session=archived|session=transient|session=child/);
  assert.match(html, /recent-session-agent">agent-coder<\/span>/);
  assert.match(html, /recent-session-agent">agent-designer<\/span>/);
});

test("renders running, attention and idle status indicators", () => {
  const running = session("running");
  const awaiting = session("awaiting", "/work/agent-designer", 1_000);
  const idle = session("idle", "/work/agent-marketing", 2_000);
  const html = render({
    sessions: [idle, awaiting, running],
    runningSessionIds: new Set([running.id, awaiting.id]),
    awaitingInputSessionIds: new Set([awaiting.id]),
    unreadSessionIds: new Set([idle.id]),
  });
  assert.match(html, /recent-session-status is-running[^>]*aria-label="Agent running/);
  assert.match(html, /recent-session-status is-awaiting[^>]*aria-label="Agent waiting for your input/);
  assert.match(html, /recent-session-status is-unread[^>]*aria-label="New activity/);
  assert.equal(recentSessionStatus(awaiting, new Set([awaiting.id]), new Set([awaiting.id]), new Set()), "awaiting");
  assert.equal(recentSessionAgentLabel(running), "agent-coder");
  assert.equal(recentSessionAgentLabel(session("plain", "/work/projects/pi-web")), null);
  assert.doesNotMatch(html, /recent-session-project/);
});

test("renders a Recent row menu without showing the project path", () => {
  const running = session("running", "/work/agent-coder");
  const html = render({ sessions: [running], onOpenMenu: noop });
  assert.match(html, /recent-session-more-action[^>]*aria-label="More actions"/);
  assert.match(html, /<span class="recent-session-agent">agent-coder<\/span><span class="recent-session-time">/);
  assert.doesNotMatch(html, /recent-session-agent">agent-coder<\/span><span aria-hidden="true">·<\/span>/);
  assert.doesNotMatch(html, /recent-session-project/);
});

test("shows loading, error and empty states", () => {
  assert.match(render({ loading: true }), /recent-session-message">Loading\.\.\.<\/div>/);
  assert.match(render({ error: "HTTP 500" }), /recent-session-message is-error">HTTP 500<\/div>/);
  assert.match(render(), /recent-session-message">No recent sessions<\/div>/);
});
