export function normalizeAppBasePath(value: string | undefined): string {
  const raw = value?.trim() ?? "";
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export const APP_BASE_PATH = normalizeAppBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** Prefix an internal Pi Web path with the configured deployment base path. */
export function appPath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`Pi Web paths must start with '/': ${path}`);
  }
  if (!APP_BASE_PATH || path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
    return path;
  }
  return `${APP_BASE_PATH}${path}`;
}

function prefixRequestInfo(input: RequestInfo | URL): RequestInfo | URL {
  if (!APP_BASE_PATH) return input;
  if (typeof input === "string") return input.startsWith("/") ? appPath(input) : input;
  if (typeof URL !== "undefined" && input instanceof URL) {
    if (typeof window === "undefined" || input.origin !== window.location.origin) return input;
    const prefixed = new URL(input.href);
    prefixed.pathname = appPath(prefixed.pathname);
    return prefixed;
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    const requestUrl = new URL(input.url);
    if (typeof window === "undefined" || requestUrl.origin !== window.location.origin) return input;
    requestUrl.pathname = appPath(requestUrl.pathname);
    return new Request(requestUrl.href, input);
  }
  return input;
}

/** Fetch an internal Pi Web URL while preserving absolute/external requests. */
export function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(prefixRequestInfo(input), init);
}

const AppEventSourceConstructor = Object.assign(
  function AppEventSource(url: string, init?: EventSourceInit): EventSource {
    return new globalThis.EventSource(url.startsWith("/") ? appPath(url) : url, init);
  },
  { CLOSED: 2 },
) as unknown as {
  new (url: string, init?: EventSourceInit): EventSource;
  readonly CLOSED: number;
};

/** Construct an internal Pi Web EventSource under the configured base path. */
export const AppEventSource = AppEventSourceConstructor;

/** Open an internal Pi Web EventSource under the configured base path. */
export function appEventSource(url: string, init?: EventSourceInit): EventSource {
  return new AppEventSourceConstructor(url, init);
}
