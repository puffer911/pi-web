import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("./AppShell.tsx", import.meta.url), "utf8");

function between(startAnchor, endAnchor) {
  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start + startAnchor.length);
  assert.notEqual(start, -1, `${startAnchor} not found`);
  assert.notEqual(end, -1, `${endAnchor} not found after ${startAnchor}`);
  return source.slice(start, end);
}

function runHandleSessionRead(ids) {
  const state = {
    completed: new Set(["done", "other"]),
    unread: new Set(["done", "unread"]),
  };
  const context = vm.createContext({
    setCompletedFaviconSessionIds: (update) => { state.completed = update(state.completed); },
    setUnreadFaviconSessionIds: (update) => { state.unread = update(state.unread); },
    useCallback: (callback) => callback,
  });
  const callback = between("const handleSessionRead = useCallback", "  const handleUnreadSessionIdsChange");
  vm.runInContext(stripTypeScriptTypes(`${callback}\nhandleSessionRead(${JSON.stringify(ids)});`), context);
  return state;
}

test("reading a session clears both favicon attention sets", () => {
  const state = runHandleSessionRead(["done"]);
  assert.deepEqual([...state.completed], ["other"]);
  assert.deepEqual([...state.unread], ["unread"]);
});

test("reselecting a session consumes the same favicon read path", () => {
  const body = between("const handleSelectSession = useCallback", "  const handleNewSession");
  assert.match(body, /handleSessionRead\(\[session\.id\]\)/);
});

test("subagent sessions cannot keep completed favicon attention alive", () => {
  assert.match(
    source,
    /sessionCatalog\s*\.filter\(\(session\) => session\.relation\?\.kind !== "subagent"\)/,
  );
});
