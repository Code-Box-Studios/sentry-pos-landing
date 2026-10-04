import { afterEach, describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { cmsEmailAdapter } from "./config";

afterEach(() => vi.unstubAllGlobals());

describe("CMS email configuration", () => {
  it("keeps delivery disabled even when provider credentials are present", async () => {
    vi.stubGlobal("fetch", () => { throw new Error("Email must stay disabled"); });
    const factory = cmsEmailAdapter({ MAIL_ENABLED: "false", RESEND_API_KEY: "test-key", MAIL_FROM: "no-reply@example.test" });
    expect(factory).toBeDefined();
    const adapter = factory!({ payload: {} as Payload });
    await expect(adapter.sendEmail({ to: "editor@example.test", subject: "Reset", html: "private-reset-link" })).resolves.toBeUndefined();
  });

  it.each([
    { RESEND_API_KEY: "test-key" },
    { MAIL_FROM: "no-reply@example.test" },
    {},
  ])("rejects incomplete production email credentials: %j", (credentials) => {
    expect(() => cmsEmailAdapter({ NODE_ENV: "production", ...credentials })).toThrow(/RESEND_API_KEY.*MAIL_FROM/);
  });

  it("rejects explicit enablement without credentials in development", () => {
    expect(() => cmsEmailAdapter({ NODE_ENV: "development", MAIL_ENABLED: "true" })).toThrow();
  });

  it("preserves unconfigured local development", () => {
    expect(cmsEmailAdapter({ NODE_ENV: "development" })).toBeUndefined();
  });

  it("rejects a mistyped delivery flag", () => {
    expect(() => cmsEmailAdapter({ MAIL_ENABLED: "off" })).toThrow(/MAIL_ENABLED/);
  });

  it.each([
    ["no-reply@example.test", "Sentry <no-reply@example.test>"],
    ["Sentry Support <help@example.test>", "Sentry Support <help@example.test>"],
    ['"Sentry, Support" <help@example.test>', '"Sentry, Support" <help@example.test>'],
  ])("delivers CMS mail using the configured sender %s", async (sender, expectedFrom) => {
    let request: { url: string; options: RequestInit } | undefined;
    vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
      request = { url, options };
      return new Response(JSON.stringify({ id: "test-delivery" }), { status: 200 });
    });
    const factory = cmsEmailAdapter({ NODE_ENV: "production", MAIL_ENABLED: "true", RESEND_API_KEY: "test-key", MAIL_FROM: sender });
    expect(factory).toBeDefined();
    const adapter = factory!({ payload: {} as Payload });
    await expect(adapter.sendEmail({ to: "editor@example.test", subject: "Reset access", html: "<p>Reset link</p>" })).resolves.toEqual({ id: "test-delivery" });
    expect(request?.url).toBe("https://api.resend.com/emails");
    expect(request?.options.method).toBe("POST");
    expect(request?.options.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(JSON.parse(request!.options.body as string)).toMatchObject({ from: expectedFrom, to: "editor@example.test", subject: "Reset access", html: "<p>Reset link</p>" });
  });

  it.each(["not-an-email", "Sender <invalid>", "no-reply@example.test\r\nBcc: other@example.test"])("rejects an invalid sender: %j", (sender) => {
    expect(() => cmsEmailAdapter({ MAIL_ENABLED: "true", RESEND_API_KEY: "test-key", MAIL_FROM: sender })).toThrow(/MAIL_FROM/);
  });
});
