function normalizeAppBasePath(value) {
  const raw = value?.trim() ?? "";
  if (!raw || raw === "/") return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

const APP_BASE_PATH = normalizeAppBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

function appPath(path) {
  if (!path.startsWith("/")) {
    throw new Error(`Pi Web paths must start with '/': ${path}`);
  }
  if (!APP_BASE_PATH || path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
    return path;
  }
  return `${APP_BASE_PATH}${path}`;
}

function prefixRequestInfo(input) {
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

function appFetch(input, init) {
  return fetch(prefixRequestInfo(input), init);
}

const AppEventSourceConstructor = Object.assign(
  function AppEventSource(url, init) {
    return new globalThis.EventSource(url.startsWith("/") ? appPath(url) : url, init);
  },
  { CLOSED: 2 },
);

function appEventSource(url, init) {
  return new AppEventSourceConstructor(url, init);
}

module.exports = {
  normalizeAppBasePath,
  APP_BASE_PATH,
  appPath,
  appFetch,
  AppEventSource: AppEventSourceConstructor,
  appEventSource,
};
