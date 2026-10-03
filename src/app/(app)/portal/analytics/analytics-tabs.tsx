"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ANALYTICS_TABS } from "./scope";
export function AnalyticsTabs({ role = "owner" }: { role?: "owner" | "manager" }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const query = new URLSearchParams();
  for (const key of ["businessId", "branchId", "from", "to"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  return (
    <nav className="mt-3 flex flex-wrap gap-4 border-b border-hairline">
      {ANALYTICS_TABS.filter((tab) => role !== "manager" || !["Profit", "Leaks"].includes(tab.label)).map((tab) => (
        <Link
          key={tab.href}
          href={`${tab.href}?${query}`}
          aria-current={pathname === tab.href ? "page" : undefined}
          className="px-1 pb-2 text-sm text-steel hover:text-charcoal aria-[current=page]:border-b-2 aria-[current=page]:border-brand-green-dark"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
