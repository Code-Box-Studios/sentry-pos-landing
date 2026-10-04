import { resendAdapter } from "@payloadcms/email-resend";
import type { EmailAdapter } from "payload";
import { disabledEmail } from "./disabled";

/** Select the CMS email transport from server-only settings. */
export function cmsEmailAdapter(env: NodeJS.ProcessEnv = process.env): EmailAdapter | undefined {
  const enabled = env.MAIL_ENABLED?.trim();
  if (enabled && enabled !== "true" && enabled !== "false") {
    throw new Error("MAIL_ENABLED must be true or false.");
  }
  if (enabled === "false") return disabledEmail;

  const apiKey = env.RESEND_API_KEY?.trim();
  const sender = env.MAIL_FROM?.trim();
  if (!apiKey || !sender) {
    if (env.NODE_ENV === "production" || enabled === "true" || apiKey || sender) {
      throw new Error("RESEND_API_KEY and MAIL_FROM are required unless MAIL_ENABLED=false.");
    }
    return undefined;
  }

  // MAIL_FROM can use the same plain address or display-name form as the API.
  const namedSender = sender.match(/^([^<>]+)\s*<([^<>]+)>$/);
  const address = namedSender ? namedSender[2].trim() : sender;
  const name = namedSender ? namedSender[1].trim() : "Sentry";
  if (/[\r\n]/.test(sender) || !/^[^\s<>@,]+@[^\s<>@,]+\.[^\s<>@,]+$/.test(address)) {
    throw new Error("MAIL_FROM must contain one valid sender email address.");
  }

  return resendAdapter({ apiKey, defaultFromAddress: address, defaultFromName: name });
}
