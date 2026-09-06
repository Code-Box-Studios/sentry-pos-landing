import "server-only";
import { apiFetch } from "./fetch";

/**
 * The three shapes `POST /v1/auth/login` can answer with. An owner is signed in outright;
 * a platform admin only ever gets a 5-minute preauth token, because the API refuses to
 * issue an access token to an admin on a password alone.
 */
export type LoginResult =
  | { accessToken: string; refreshToken: string; role: string }
  | { totpRequired: true; preAuthToken: string }
  | { totpSetupRequired: true; preAuthToken: string };

export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    authenticated: false,
  });
}

export function logout(refreshToken: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    authenticated: false,
  });
}

/** Authenticates with the preauth token, not the session — there is no session yet. */
export function totpSetup(preAuthToken: string): Promise<{ secret: string; otpauthUri: string }> {
  return apiFetch("/auth/totp/setup", { method: "POST", token: preAuthToken });
}

export function totpEnable(
  preAuthToken: string,
  code: string,
): Promise<{ recoveryCodes: string[] }> {
  return apiFetch("/auth/totp/enable", { method: "POST", body: { code }, token: preAuthToken });
}

/** The preauth token rides in the body here, not the header — the API verifies it by hand. */
export function totpVerify(
  preAuthToken: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; role: string }> {
  return apiFetch("/auth/totp/verify", {
    method: "POST",
    body: { preAuthToken, code },
    authenticated: false,
  });
}

export function acceptInvite(token: string, password: string): Promise<{ ok: true }> {
  return apiFetch("/auth/invite/accept", {
    method: "POST",
    body: { token, password },
    authenticated: false,
  });
}

/** Always resolves, whether or not the address exists. Do not let the UI reveal which. */
export function requestPasswordReset(email: string): Promise<void> {
  return apiFetch("/auth/password-reset/request", {
    method: "POST",
    body: { email },
    authenticated: false,
  });
}

export function confirmPasswordReset(token: string, password: string): Promise<void> {
  return apiFetch("/auth/password-reset/confirm", {
    method: "POST",
    body: { token, password },
    authenticated: false,
  });
}
