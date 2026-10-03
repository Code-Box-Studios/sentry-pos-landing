import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { getLegalPages } from "@/lib/legal";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const legal = await getLegalPages();
  const paths = ["/", ...(legal.terms?.published ? ["/terms"] : []), ...(legal.privacy?.published ? ["/privacy"] : [])];
  return paths.map((path) => ({ url: new URL(path, siteUrl()).href }));
}
