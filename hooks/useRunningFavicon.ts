"use client";

import { useEffect } from "react";
import { appPath } from "@/lib/app-path";

const FAVICON_SIZE = 32;
const RUNNING_DOT_X = 24;
const RUNNING_DOT_Y = 7;
const RUNNING_DOT_RADIUS = 5.5;
const RUNNING_DOT_COLOR = "#f2b84b";
const RUNNING_DOT_OUTLINE = "#173f45";

function getFaviconLinks(): { links: HTMLLinkElement[]; created: boolean } {
  const existing = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
  if (existing.length > 0) return { links: existing, created: false };

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.append(link);
  return { links: [link], created: true };
}

function drawRunningFavicon(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
): string {
  context.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  context.drawImage(image, 0, 0, FAVICON_SIZE, FAVICON_SIZE);
  context.beginPath();
  context.arc(RUNNING_DOT_X, RUNNING_DOT_Y, RUNNING_DOT_RADIUS, 0, Math.PI * 2);
  context.fillStyle = RUNNING_DOT_COLOR;
  context.fill();
  context.lineWidth = 1.5;
  context.strokeStyle = RUNNING_DOT_OUTLINE;
  context.stroke();
  return context.canvas.toDataURL("image/png");
}

/** Adds a static, high-contrast amber status dot to the browser tab while any session runs. */
export function useRunningFavicon(running: boolean): void {
  useEffect(() => {
    if (!running) return;

    const { links, created } = getFaviconLinks();
    const originalHrefs = links.map((link) => link.getAttribute("href"));
    let cancelled = false;
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
      const favicon = drawRunningFavicon(context, image);
      links.forEach((link) => link.setAttribute("href", favicon));
    };
    image.src = appPath("/icons/icon-192.png");

    return () => {
      cancelled = true;
      restore();
    };
  }, [running]);
}
