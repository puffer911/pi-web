import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./ChatWindow.tsx", import.meta.url), "utf8");

test("chat interaction reports the active session as viewed", () => {
  assert.match(source, /onSessionViewed\?: \(\) => void/);
  assert.match(source, /onPointerDown=\{onSessionViewed\}/);
});
