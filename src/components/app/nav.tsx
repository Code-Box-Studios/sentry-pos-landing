"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * The current item is matched by prefix so a detail page keeps its section highlighted, but
 * an exact match is required for a section root — otherwise `/admin` would light up on
 * every admin page.
 */
export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="space-y-0.5">
      {items.map((item) => {
        const isRoot = item.href === "/admin" || item.href === "/portal";
        const current =
          pathname === item.href || (!isRoot && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              current
                ? "bg-brand-green-soft font-medium text-brand-green-dark"
                : "text-slate hover:bg-surface-soft",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
