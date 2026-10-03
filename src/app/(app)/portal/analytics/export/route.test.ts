import { expect, it, vi } from "vitest";
import { GET } from "./route";
vi.mock("@/lib/api/fetch", () => ({ apiBaseUrl: () => "http://api.test/v1" }));
vi.mock("@/lib/auth/session", () => ({ readAccessToken: async () => "token" }));
it("forwards ranking and movement filters without allowing arbitrary upstream paths", async () => {
  const fetcher = vi.fn<(url: URL) => Promise<Response>>(async () => new Response("csv"));
  vi.stubGlobal("fetch", fetcher);
  await GET(
    new Request(
      "http://portal.test/portal/analytics/export?report=products-top&by=revenue&productId=p1&type=receive&path=evil",
    ),
  );
  const url = fetcher.mock.calls[0][0] as URL;
  expect(url.searchParams.get("by")).toBe("revenue");
  expect(url.searchParams.get("productId")).toBe("p1");
  expect(url.searchParams.get("type")).toBe("receive");
  expect(url.searchParams.has("path")).toBe(false);
  vi.unstubAllGlobals();
});
