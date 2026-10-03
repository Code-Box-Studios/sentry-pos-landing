import { describe, expect, it } from "vitest";
import { cmsStorageOptions } from "./config";

describe("CMS storage configuration", () => {
  it("keeps local development available with a stable schema", () => {
    expect(cmsStorageOptions({})).toMatchObject({ enabled: false, alwaysInsertFields: true });
  });
  it("rejects partial configuration instead of silently writing ephemeral files", () => {
    expect(() => cmsStorageOptions({ CMS_STORAGE_BUCKET: "media" })).toThrow(/CMS_STORAGE/);
  });
  it("requires durable storage for hosted production", () => {
    expect(() => cmsStorageOptions({ NODE_ENV: "production" })).toThrow(/CMS_STORAGE/);
  });
  it("uses private S3 storage served through public Payload media access", () => {
    expect(cmsStorageOptions({ CMS_STORAGE_BUCKET: "media", CMS_STORAGE_ENDPOINT: "https://objects.example.com", CMS_STORAGE_ACCESS_KEY_ID: "key", CMS_STORAGE_SECRET_ACCESS_KEY: "secret" })).toMatchObject({
      enabled: true, bucket: "media", collections: { media: true },
      config: { forcePathStyle: true, endpoint: "https://objects.example.com" },
    });
  });
});
