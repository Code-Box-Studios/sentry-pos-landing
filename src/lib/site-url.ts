export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value && process.env.NODE_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
  return new URL(value ?? "http://localhost:3100");
}
