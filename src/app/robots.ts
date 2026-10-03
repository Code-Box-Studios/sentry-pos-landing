import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/portal", "/admin", "/cms", "/api", "/login", "/invite", "/forgot", "/password-reset"] }, sitemap: new URL("/sitemap.xml", siteUrl()).href };
}
