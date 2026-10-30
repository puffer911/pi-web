import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const shimPath = fileURLToPath(new URL("./__fixtures__/react-hook-shim.mjs", import.meta.url));
const jiti = createJiti(import.meta.url, { tsconfigPaths: true, alias: { react: shimPath } });
const { renderHook } = await import(shimPath);
const { useRunningFavicon } = await jiti.import("./useRunningFavicon.ts");

function installDom() {
  const links = [];
  const calls = [];
  const context = {
    canvas: { toDataURL: () => "data:image/png;base64,static-dot" },
    clearRect: (...args) => calls.push(["clearRect", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
    beginPath: () => calls.push(["beginPath"]),
    arc: (...args) => calls.push(["arc", ...args]),
    fill: () => calls.push(["fill"]),
    stroke: () => calls.push(["stroke"]),
    fillStyle: "",
    lineWidth: 0,
    strokeStyle: "",
  };
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
  globalThis.Image = class {
    set src(value) {
      this._src = value;
      this.onload?.();
    }
  };
  return { links, calls, context };
}

test("uses one static high-contrast amber dot for a running favicon", () => {
  const previousDocument = globalThis.document;
  const previousImage = globalThis.Image;
  const { links, calls, context } = installDom();
  try {
    const view = renderHook(() => useRunningFavicon(true));
    assert.equal(links.length, 1);
    assert.equal(links[0].getAttribute("href"), "data:image/png;base64,static-dot");
    assert.deepEqual(calls.find(([name]) => name === "arc"), ["arc", 24, 7, 5.5, 0, Math.PI * 2]);
    assert.equal(context.fillStyle, "#f2b84b");
    assert.equal(context.strokeStyle, "#173f45");
    assert.equal(calls.filter(([name]) => name === "arc").length, 1);
    view.unmount();
    assert.equal(links.length, 0);
  } finally {
    globalThis.document = previousDocument;
    globalThis.Image = previousImage;
  }
});
