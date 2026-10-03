type Env = Record<string, string | undefined>;

/** Keep storage fields present in every environment so migrations are portable. */
export function cmsStorageOptions(env: Env = process.env) {
  const names = ["CMS_STORAGE_BUCKET", "CMS_STORAGE_ENDPOINT", "CMS_STORAGE_ACCESS_KEY_ID", "CMS_STORAGE_SECRET_ACCESS_KEY"] as const;
  const configured = names.every((name) => Boolean(env[name]?.trim()));
  if (!configured && (names.some((name) => Boolean(env[name])) || env.NODE_ENV === "production")) {
    throw new Error(`Configure all CMS_STORAGE settings: ${names.join(", ")}`);
  }
  if (configured) {
    const endpoint = new URL(env.CMS_STORAGE_ENDPOINT!);
    if (!["https:", "http:"].includes(endpoint.protocol)) throw new Error("CMS_STORAGE_ENDPOINT must be an HTTP(S) URL.");
  }
  return {
    enabled: configured,
    alwaysInsertFields: true,
    collections: { media: true as const },
    bucket: env.CMS_STORAGE_BUCKET ?? "",
    config: {
      endpoint: env.CMS_STORAGE_ENDPOINT,
      region: env.CMS_STORAGE_REGION || "ap-southeast-1",
      forcePathStyle: true,
      credentials: { accessKeyId: env.CMS_STORAGE_ACCESS_KEY_ID ?? "", secretAccessKey: env.CMS_STORAGE_SECRET_ACCESS_KEY ?? "" },
    },
  };
}
