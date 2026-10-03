import { beforeEach, expect, it, vi } from "vitest";
import { saveMediaAction } from "./actions";
const api = vi.hoisted(() => ({ uploadMedia: vi.fn(), removeMedia: vi.fn() }));
vi.mock("@/lib/api/media", () => api);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("rejects an executable upload before contacting storage", async () => {
  const data = new FormData();
  data.set("kind", "product");
  data.set("file", new File(["code"], "bad.svg", { type: "image/svg+xml" }));
  expect(await saveMediaAction({}, data)).toHaveProperty("fieldErrors.file");
  expect(api.uploadMedia).not.toHaveBeenCalled();
});
it("forwards only the image file to the fixed entity endpoint", async () => {
  const data = new FormData();
  data.set("kind", "business");
  data.set("id", "b1");
  data.set("file", new File(["image"], "logo.png", { type: "image/png" }));
  data.set("other", "ignored");
  expect(await saveMediaAction({}, data)).toEqual({ done: true });
  const [kind, id, upload] = api.uploadMedia.mock.calls[0];
  expect(kind).toBe("business");
  expect(id).toBe("b1");
  expect([...upload.keys()]).toEqual(["file"]);
});
