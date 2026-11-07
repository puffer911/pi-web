import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const { getFaviconSessionStatus } = await jiti.import("./favicon-session-count.ts");

function session(id, modified = "2026-01-01T00:00:00.000Z", relation) {
  return { id, modified, relation };
}

test("returns standby with no favicon count when all sessions are idle", () => {
  assert.deepEqual(
    getFaviconSessionStatus([session("idle")], new Set(), new Set(), new Set()),
    { state: "standby", count: 0 },
  );
});

test("counts running and completed root sessions together for mixed attention", () => {
  const sessions = [session("running"), session("completed")];
  assert.deepEqual(
    getFaviconSessionStatus(
      sessions,
      new Set(["running"]),
      new Set(["completed"]),
      new Set(),
    ),
    { state: "partial", count: 2 },
  );
});

test("counts unread completion once even when it appears in both attention sets", () => {
  const sessions = [session("completed")];
  assert.deepEqual(
    getFaviconSessionStatus(sessions, new Set(), new Set(["completed"]), new Set(["completed"])),
    { state: "complete", count: 1 },
  );
});

test("counts each root once when a subagent is running", () => {
  const sessions = [
    session("root"),
    session("child", "2026-01-01T00:00:01.000Z", {
      kind: "subagent",
      parentSessionId: "root",
    }),
  ];
  assert.deepEqual(
    getFaviconSessionStatus(sessions, new Set(["child"]), new Set(), new Set()),
    { state: "running", count: 1 },
  );
  assert.deepEqual(
    getFaviconSessionStatus(sessions, new Set(), new Set(["child"]), new Set(["child"])),
    { state: "standby", count: 0 },
  );
});

test("keeps the actual total for large counts while the favicon formats it as 9+", () => {
  const sessions = Array.from({ length: 10 }, (_, index) => session(`running-${index}`));
  const running = new Set(sessions.map(({ id }) => id));
  assert.deepEqual(
    getFaviconSessionStatus(sessions, running, new Set(), new Set()),
    { state: "running", count: 10 },
  );
});
