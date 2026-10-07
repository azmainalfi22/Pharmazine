import { API_CONFIG } from "@/config/api";
import { handleGuestRequest } from "./guestApi";
import { isGuestSession } from "./guestMode";

// Sign-in / sign-up must always reach the real backend.
const ALWAYS_REMOTE = /^\/auth\/(login|register)$/;

const apiOrigins = (): Set<string> => {
  const origins = new Set<string>([window.location.origin]);
  try {
    origins.add(new URL(API_CONFIG.BASE_URL).origin);
  } catch {
    /* relative/empty base — same origin only */
  }
  return origins;
};

const readBody = async (input: RequestInfo | URL, init?: RequestInit): Promise<unknown> => {
  let raw: BodyInit | null | undefined = init?.body;
  if (raw === undefined && input instanceof Request) {
    raw = await input.clone().text();
  }
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

/**
 * Route `/api/*` requests to the in-browser guest API whenever nobody is
 * signed in. Signed-in sessions are untouched and hit the real backend.
 */
export const installGuestFetch = () => {
  if (typeof window === "undefined" || (window.fetch as { __guestPatched?: boolean }).__guestPatched) return;

  const realFetch = window.fetch.bind(window);
  const origins = apiOrigins();

  const guestFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (!isGuestSession()) return realFetch(input, init);

    let url: URL;
    try {
      const href = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      url = new URL(href, window.location.origin);
    } catch {
      return realFetch(input, init);
    }

    if (!origins.has(url.origin) || !url.pathname.startsWith("/api/")) {
      return realFetch(input, init);
    }

    const path = url.pathname.slice("/api".length);
    if (ALWAYS_REMOTE.test(path)) return realFetch(input, init);

    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    const body = await readBody(input, init);
    return handleGuestRequest(method, path, url.searchParams, body);
  };

  (guestFetch as { __guestPatched?: boolean }).__guestPatched = true;
  window.fetch = guestFetch as typeof window.fetch;
};
