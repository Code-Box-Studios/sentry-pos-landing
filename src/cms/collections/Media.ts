import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CollectionConfig } from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Public marketing images use S3 in production and local disk in development.
 * Payload serves reads; bucket credentials stay server-side. Tenant images use the API instead.
 */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Content" },
  access: { read: () => true },
  upload: {
    staticDir: path.resolve(dirname, "../../../public/media"),
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    imageSizes: [
      { name: "wide", width: 1600, height: undefined, position: "centre" },
      { name: "card", width: 800, height: undefined, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "Describe the image for screen readers and search engines." },
    },
  ],
};
