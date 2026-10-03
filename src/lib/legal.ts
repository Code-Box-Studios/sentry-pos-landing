import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";

export const getLegalPages = unstable_cache(async () => {
  const payload = await getPayload({ config });
  // Server-only local API reads drafts; public rendering explicitly gates publication.
  return payload.findGlobal({ slug: "legal-pages", depth: 0, overrideAccess: true });
}, ["legal-pages"], { tags: ["legal-pages"] });
