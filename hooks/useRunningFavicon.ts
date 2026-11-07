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
const STATUS_DOT_X = FAVICON_SIZE / 2;
const STATUS_DOT_Y = FAVICON_SIZE / 2;
const STATUS_DOT_RADIUS = 14.5;
// Keep the favicon colors aligned with --status-running and --status-attention.
const RUNNING_DOT_COLOR = "#16a34a";
const COMPLETE_DOT_COLOR = "#d97706";
const STATUS_DOT_OUTLINE = "#173f45";

function getFaviconLinks(): { links: HTMLLinkElement[]; created: boolean } {
  const existing = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
  if (existing.length > 0) return { links: existing, created: false };

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.append(link);
  return { links: [link], created: true };
}

function drawDot(
  context: CanvasRenderingContext2D,
  color: string,
  startAngle = 0,
  endAngle = Math.PI * 2,
): void {
  context.beginPath();
  context.moveTo(STATUS_DOT_X, STATUS_DOT_Y);
  context.arc(STATUS_DOT_X, STATUS_DOT_Y, STATUS_DOT_RADIUS, startAngle, endAngle);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function drawStatusFavicon(
  context: CanvasRenderingContext2D,
  state: Exclude<RunningFaviconState, "standby">,
  countLabel: string,
): string {
  context.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE);
  if (state === "partial") {
    drawDot(context, RUNNING_DOT_COLOR, Math.PI / 2, Math.PI * 1.5);
    drawDot(context, COMPLETE_DOT_COLOR, -Math.PI / 2, Math.PI / 2);
  } else {
    drawDot(context, state === "complete" ? COMPLETE_DOT_COLOR : RUNNING_DOT_COLOR);
  }
  context.beginPath();
  context.arc(STATUS_DOT_X, STATUS_DOT_Y, STATUS_DOT_RADIUS, 0, Math.PI * 2);
  context.lineWidth = 1.5;
  context.strokeStyle = STATUS_DOT_OUTLINE;
  context.stroke();

  if (countLabel) {
    context.font = countLabel.length > 1 ? "700 14px sans-serif" : "700 16px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 2.5;
    context.strokeStyle = STATUS_DOT_OUTLINE;
    context.strokeText(countLabel, STATUS_DOT_X, STATUS_DOT_Y + 0.5);
    context.fillStyle = "#ffffff";
    context.fillText(countLabel, STATUS_DOT_X, STATUS_DOT_Y + 0.5);
  }
  return context.canvas.toDataURL("image/png");
}

/** Shows a favicon status dot and count while work is running or awaiting attention. */
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
