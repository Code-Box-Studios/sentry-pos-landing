import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api/fetch";
import { readAccessToken } from "@/lib/auth/session";

/**
 * CSV downloads have to be proxied.
 *
 * The API's `?format=csv` needs a bearer token, but the portal keeps tokens in
 * httpOnly cookies and `API_URL` is server-only — deliberately never
 * `NEXT_PUBLIC_`. So the browser cannot call the API directly, and a plain
 * `<a href>` pointed at it would download an unauthorised 401 page.
 *
 * This is a Route Handler rather than a Server Action for the same reason
 * `/logout` is: it returns a file with headers, with no form involved.
 *
 * `report` is matched against a FIXED ALLOWLIST and never used to build a path
 * from user input, so this cannot be turned into a general API tunnel.
 */
const REPORTS: Record<string, string> = {
  overview: "/portal/analytics/overview",
  "sales-heatmap": "/portal/analytics/sales/heatmap",
  "sales-trend": "/portal/analytics/sales/trend",
  "sales-patterns": "/portal/analytics/sales/patterns",
  "sales-breakdowns": "/portal/analytics/sales/breakdowns",
  tax: "/portal/analytics/tax",
  "products-top": "/portal/analytics/products/top",
  "products-slow": "/portal/analytics/products/slow",
  profit: "/portal/analytics/profit",
  leaks: "/portal/analytics/leaks",
  "inventory-movements": "/portal/analytics/inventory/movements",
  "inventory-shrinkage": "/portal/analytics/inventory/shrinkage",
  "inventory-on-hand": "/portal/analytics/inventory/on-hand",
};

/** Only these reach the API; anything else in the query is dropped. */
const FORWARDED = ["from", "to", "businessId", "branchId", "granularity"];

export async function GET(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  const path = REPORTS[incoming.get("report") ?? ""];
  if (!path) {
    return NextResponse.json({ error: "Unknown report." }, { status: 400 });
  }

  const token = await readAccessToken();
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = new URL(apiBaseUrl() + path);
  for (const key of FORWARDED) {
    const value = incoming.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.searchParams.set("format", "csv");

  const upstream = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "That export could not be generated." },
      { status: upstream.status },
    );
  }

  // Pass the API's own filename and type through — it already names the file
  // after the report and its date range.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  });
}
