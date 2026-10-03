import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api/fetch";
import { readAccessToken } from "@/lib/auth/session";
export async function GET(request: Request) {
  const token = await readAccessToken();
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  const upstream = await fetch(`${apiBaseUrl()}/portal/account/export`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!upstream.ok)
    return NextResponse.json(
      { error: "Your account export could not be generated. Please try again." },
      { status: upstream.status },
    );
  const exportId = upstream.headers.get("X-Export-Id");
  if (!exportId || !/^[0-9a-f-]{36}$/i.test(exportId))
    return NextResponse.json(
      { error: "The export did not include a receipt. Please contact support." },
      { status: 502 },
    );
  const response = new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ?? 'attachment; filename="sentry-account.zip"',
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set("sentry_export_id", exportId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/portal/settings",
    maxAge: 86400,
  });
  return response;
}
