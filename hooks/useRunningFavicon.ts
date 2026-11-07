"use client";

import { useEffect } from "react";

export type RunningFaviconState = "standby" | "running" | "partial" | "complete";

export interface RunningFaviconStatus {
  state: RunningFaviconState;
  count: number;
}

export function formatFaviconCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "";
  return count >= 10 ? "9+" : String(Math.floor(count));
}

const FAVICON_SIZE = 32;
const FAVICON_TEXT_X = FAVICON_SIZE / 2;
const FAVICON_TEXT_Y = FAVICON_SIZE / 2;
// Keep the favicon colors aligned with --status-running and --status-attention.
const RUNNING_FAVICON_COLOR = "#16a34a";
const ATTENTION_FAVICON_COLOR = "#d97706";
const FAVICON_TEXT_OUTLINE = "#173f45";
const FAVICON_TEXT_HALO = "#ffffff";

function getFaviconLinks(): { links: HTMLLinkElement[]; created: boolean } {
  const existing = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
  if (existing.length > 0) return { links: existing, created: false };

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.append(link);
  return { links: [link], created: true };
}

function drawStatusFavicon(
  context: CanvasRenderingContext2D,
  state: Exclude<RunningFaviconState, "standby">,
  countLabel: string,
): string {
  context.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  if (!countLabel) return context.canvas.toDataURL("image/png");

  context.font = countLabel.length > 1 ? "700 18px sans-serif" : "700 25px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 4;
  context.strokeStyle = FAVICON_TEXT_HALO;
  context.strokeText(countLabel, FAVICON_TEXT_X, FAVICON_TEXT_Y);
  context.lineWidth = 1.5;
  context.strokeStyle = FAVICON_TEXT_OUTLINE;
  context.strokeText(countLabel, FAVICON_TEXT_X, FAVICON_TEXT_Y);

  const drawColoredHalf = (
    color: string,
    x: number,
    width: number,
  ) => {
    context.save();
    context.beginPath();
    context.rect(x, 0, width, FAVICON_SIZE);
    context.clip();
    context.fillStyle = color;
    context.fillText(countLabel, FAVICON_TEXT_X, FAVICON_TEXT_Y);
    context.restore();
  };

  if (state === "partial") {
    drawColoredHalf(RUNNING_FAVICON_COLOR, 0, FAVICON_SIZE / 2);
    drawColoredHalf(ATTENTION_FAVICON_COLOR, FAVICON_SIZE / 2, FAVICON_SIZE / 2);
  } else {
    context.fillStyle = state === "complete" ? ATTENTION_FAVICON_COLOR : RUNNING_FAVICON_COLOR;
    context.fillText(countLabel, FAVICON_TEXT_X, FAVICON_TEXT_Y);
  }

  return context.canvas.toDataURL("image/png");
}

/** Replaces the favicon with a large status-colored count while work is active. */
export function useRunningFavicon(status: RunningFaviconStatus): void {
  const { state, count } = status;

  useEffect(() => {
    if (state === "standby" || count <= 0) return;

    const { links, created } = getFaviconLinks();
    const originalHrefs = links.map((link) => link.getAttribute("href"));
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

    const favicon = drawStatusFavicon(context, state, formatFaviconCount(count));
    links.forEach((link) => link.setAttribute("href", favicon));

    return restore;
  }, [count, state]);
}
