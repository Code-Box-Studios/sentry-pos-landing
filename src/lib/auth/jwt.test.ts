import { describe, expect, it } from "vitest";
import { decodeJwtPayload, needsRefresh } from "./jwt";

/** Builds an unsigned token whose payload is `payload`. The signature is never checked. */
function makeToken(payload: Record<string, unknown>): string {
  const seg = (o: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${seg({ alg: "HS256", typ: "JWT" })}.${seg(payload)}.not-a-real-signature`;
}

describe("decodeJwtPayload", () => {
  it("reads sub, role, sid, exp and kind", () => {
    const token = makeToken({ sub: "u-1", role: "owner", sid: "s-1", exp: 1893456000 });
    expect(decodeJwtPayload(token)).toEqual({
      sub: "u-1",
      role: "owner",
      sid: "s-1",
      exp: 1893456000,
      kind: undefined,
    });
  });

  it("surfaces a preauth token's kind so callers can reject it", () => {
    const token = makeToken({ sub: "u-1", role: "platform_admin", kind: "preauth" });
    expect(decodeJwtPayload(token)?.kind).toBe("preauth");
  });

  it("returns null for a token that is not three segments", () => {
    expect(decodeJwtPayload("nonsense")).toBeNull();
    expect(decodeJwtPayload("a.b")).toBeNull();
  });

  it("returns null when the payload is not decodable JSON", () => {
    expect(decodeJwtPayload("aaa.!!!not-base64!!!.ccc")).toBeNull();
  });

  it("returns null when sub or role is missing — an unusable payload is no payload", () => {
    expect(decodeJwtPayload(makeToken({ role: "owner" }))).toBeNull();
    expect(decodeJwtPayload(makeToken({ sub: "u-1" }))).toBeNull();
  });
});

describe("needsRefresh", () => {
  const now = 1_700_000_000_000; // fixed clock; never Date.now() in a test

  it("is true when there is no token at all", () => {
    expect(needsRefresh(null, now)).toBe(true);
  });

  it("is true when the token carries no exp", () => {
    expect(needsRefresh(makeToken({ sub: "u", role: "owner" }), now)).toBe(true);
  });

  it("is false for a token with plenty of life left", () => {
    const exp = Math.floor(now / 1000) + 600;
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(false);
  });

  it("is true inside the skew window, so the token never expires mid-render", () => {
    const exp = Math.floor(now / 1000) + 60; // 60s left, default skew is 120s
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(true);
  });

  it("is true for an already-expired token", () => {
    const exp = Math.floor(now / 1000) - 1;
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(true);
  });
});
