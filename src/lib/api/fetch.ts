import "server-only";
import { readAccessToken } from "@/lib/auth/session";
import { NetworkError, UnauthorizedError, toApiError } from "./errors";

/**
 * The one door to `sentry-pos-be`.
 *
 * It deliberately does NOT refresh on a 401. The API rotates refresh tokens and treats a
 * replayed one as an attack — it revokes every active session for that user — so two
 * requests refreshing at once would log the operator out everywhere. Refresh therefore
 * happens in exactly one place, `src/middleware.ts`, which runs once per request. By the
 * time a call gets here the token is as fresh as it is going to be, and a 401 means the
 * session is genuinely finished.
 */

export function apiBaseUrl(): string {
  const raw = process.env.API_URL?.trim();
  if (!raw) {
    throw new Error(
      "API_URL is not set. The portal cannot reach sentry-pos-be without it — see .env.example.",
    );
  }
  return raw.replace(/\/+$/, "");
}

export interface ApiRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** An explicit bearer, overriding the session cookie. The TOTP endpoints use the preauth token. */
  token?: string;
  /** False for endpoints that take no credentials: login, refresh, invite accept, password reset. */
  authenticated?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { method = "GET", body, token, authenticated = true, query } = init;

  const url = new URL(apiBaseUrl() + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers({ accept: "application/json" });
  if (body !== undefined) headers.set("content-type", "application/json");

  const bearer = token ?? (authenticated ? await readAccessToken() : null);
  if (authenticated && !bearer) {
    // No point spending a round-trip to be told what we already know.
    throw new UnauthorizedError("unauthorized", "Your session has ended.", 401);
  }
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Portal data is per-user and frequently mutated; a cached read here would be a
      // cross-user leak at worst and a stale screen at best.
      cache: "no-store",
    });
  } catch (cause) {
    throw new NetworkError(undefined, { cause });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A proxy or load balancer answering with HTML. Leave `parsed` null so the error path
      // falls back to a generic envelope rather than throwing a SyntaxError from here.
      parsed = null;
    }
  }

  if (!response.ok) throw toApiError(response.status, parsed);

  return parsed as T;
}
