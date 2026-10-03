import type { EmailAdapter } from "payload";

/** Explicitly disable CMS email without logging reset links in production. */
export const disabledEmail: EmailAdapter<void> = () => ({
  name: "disabled",
  defaultFromAddress: "no-reply@example.invalid",
  defaultFromName: "Sentry CMS",
  sendEmail: async () => undefined,
});
