"use client";

import { useEffect } from "react";
import { appPath } from "@/lib/app-path";

const FAVICON_SIZE = 32;
const FRAME_INTERVAL_MS = 180;
const SPINNER_RADIUS = 13;
const SPINNER_SWEEP = Math.PI * 0.9;
const SPINNER_COLOR = "#f2b84b";

function getFaviconLinks(): { links: HTMLLinkElement[]; created: boolean } {
  const existing = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
  if (existing.length > 0) return { links: existing, created: false };

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.append(link);
  return { links: [link], created: true };
}

function drawRunningFrame(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  angle: number,
): string {
  context.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  context.drawImage(image, 0, 0, FAVICON_SIZE, FAVICON_SIZE);
  context.save();
  context.translate(FAVICON_SIZE / 2, FAVICON_SIZE / 2);
  context.rotate(angle);
  context.beginPath();
  context.arc(0, 0, SPINNER_RADIUS, -SPINNER_SWEEP / 2, SPINNER_SWEEP / 2);
  context.strokeStyle = SPINNER_COLOR;
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.stroke();
  context.restore();
  return context.canvas.toDataURL("image/png");
}

/** Adds a small rotating attention ring to the browser tab while any session runs. */
export function useRunningFavicon(running: boolean): void {
  useEffect(() => {
    if (!running) return;

    const { links, created } = getFaviconLinks();
    const originalHrefs = links.map((link) => link.getAttribute("href"));
    let cancelled = false;
    let interval: number | undefined;
    let angle = 0;
    const canvas = document.createElement("canvas");
    canvas.width = FAVICON_SIZE;
    canvas.height = FAVICON_SIZE;
    const context = canvas.getContext("2d");

    const restore = () => {
      links.forEach((link, index) => {
        const originalHref = originalHrefs[index];
        if (originalHref === null) link.removeAttribute("href");
        else link.setAttribute("href", originalHref);
      });
      if (created) links.forEach((link) => link.remove());
    };

    if (!context) return restore;

    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const update = () => {
        if (!cancelled) {
          const frame = drawRunningFrame(context, image, angle);
          links.forEach((link) => link.setAttribute("href", frame));
          angle += Math.PI / 8;
        }
      };
      update();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        interval = window.setInterval(update, FRAME_INTERVAL_MS);
      }
    };
    image.src = appPath("/icons/icon-192.png");

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
      restore();
    };
  }, [running]);
}
