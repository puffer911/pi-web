import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const shimPath = fileURLToPath(new URL("./__fixtures__/react-hook-shim.mjs", import.meta.url));
const jiti = createJiti(import.meta.url, { tsconfigPaths: true, alias: { react: shimPath } });
const { renderHook } = await import(shimPath);
const { formatFaviconCount, useRunningFavicon } = await jiti.import("./useRunningFavicon.ts");

function installDom() {
  const links = [];
  const calls = [];
  const fillStyles = [];
  let fillStyle = "";
  const context = {
    canvas: { toDataURL: () => "data:image/png;base64,status-dot" },
    clearRect: (...args) => calls.push(["clearRect", ...args]),
    beginPath: () => calls.push(["beginPath"]),
    moveTo: (...args) => calls.push(["moveTo", ...args]),
    arc: (...args) => calls.push(["arc", ...args]),
    closePath: () => calls.push(["closePath"]),
    fill: () => calls.push(["fill"]),
    stroke: () => calls.push(["stroke"]),
    strokeText: (...args) => calls.push(["strokeText", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
    lineWidth: 0,
    strokeStyle: "",
  };
  Object.defineProperty(context, "fillStyle", {
    get: () => fillStyle,
    set: (value) => {
      fillStyle = value;
      fillStyles.push(value);
    },
  });
  const makeLink = () => {
    const attributes = new Map();
    const link = {
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      removeAttribute(name) { attributes.delete(name); },
      remove() { links.splice(links.indexOf(link), 1); },
    };
    return link;
  };
  globalThis.document = {
    querySelectorAll: () => links,
    createElement(type) {
      if (type === "link") {
        const link = makeLink();
        link.rel = "icon";
        return link;
      }
      if (type === "canvas") return { width: 0, height: 0, getContext: () => context };
      throw new Error(`unexpected element: ${type}`);
    },
    head: { append(link) { links.push(link); } },
  };
  return { links, calls, fillStyles, context, makeLink };
}

test("uses colored dots and a count for running, partial, and complete favicon states", () => {
  const previousDocument = globalThis.document;
  const { links, calls, fillStyles, context } = installDom();
  try {
    const view = renderHook((status) => useRunningFavicon(status), { state: "running", count: 1 });
    assert.equal(links.length, 1);
    assert.equal(links[0].getAttribute("href"), "data:image/png;base64,status-dot");
    assert.deepEqual(calls.find(([name]) => name === "arc"), ["arc", 16, 16, 10.5, 0, Math.PI * 2]);
    assert.equal(fillStyles.includes("#16a34a"), true);
    assert.deepEqual(calls.filter(([name]) => name === "fillText").map(([, text]) => text), ["1"]);
    assert.equal(context.strokeStyle, "#173f45");
    assert.doesNotMatch(calls.map(([name]) => name).join(" "), /drawImage/);

    view.rerender({ state: "partial", count: 2 });
    assert.equal(fillStyles.includes("#d97706"), true);
    view.rerender({ state: "complete", count: 10 });
    assert.deepEqual(calls.filter(([name]) => name === "fillText").map(([, text]) => text), ["1", "2", "9+"]);
    view.rerender({ state: "standby", count: 0 });
    assert.equal(links.length, 0);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("formats favicon counts for an empty, single-digit, and large total", () => {
  assert.equal(formatFaviconCount(0), "");
  assert.equal(formatFaviconCount(1), "1");
  assert.equal(formatFaviconCount(9), "9");
  assert.equal(formatFaviconCount(10), "9+");
});

test("restores the original favicon when the status clears", () => {
  const previousDocument = globalThis.document;
  const { links, makeLink } = installDom();
  const original = makeLink();
  original.setAttribute("href", "/icons/icon-192.png");
  links.push(original);
  try {
    const view = renderHook((status) => useRunningFavicon(status), { state: "complete", count: 1 });
    assert.equal(links.length, 1);
    assert.equal(original.getAttribute("href"), "data:image/png;base64,status-dot");
    view.rerender({ state: "standby", count: 0 });
    assert.equal(original.getAttribute("href"), "/icons/icon-192.png");
    assert.equal(links.length, 1);
  } finally {
    globalThis.document = previousDocument;
  }
});
