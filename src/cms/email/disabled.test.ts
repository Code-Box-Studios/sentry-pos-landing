import { describe, expect, it, vi } from "vitest";
import type { Payload } from "payload";
import { disabledEmail } from "./disabled";

describe("disabled CMS email", () => {
  it("does not write password-reset content to the console", async () => {
    const log = vi.spyOn(console, "log");
    const adapter = disabledEmail({ payload: {} as Payload });
    await expect(adapter.sendEmail({ to: "owner@example.test", subject: "Reset", html: "private-reset-link" })).resolves.toBeUndefined();
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
