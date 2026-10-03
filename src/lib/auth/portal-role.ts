import "server-only";
import { readAccessToken } from "./session";
import { decodeJwtPayload } from "./jwt";
export async function readPortalRole(): Promise<"owner" | "manager" | null> {
  const token = await readAccessToken();
  const role = token ? decodeJwtPayload(token)?.role : null;
  return role === "owner" || role === "manager" ? role : null;
}
