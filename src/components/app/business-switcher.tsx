"use client";

import { usePathname, useRouter } from "next/navigation";

/** The sections under a business. Checked in order, so a longer prefix must come first. */
const SECTIONS = [
  "catalog",
  "categories",
  "modifiers",
  "discounts",
  "branches",
  "terminals",
  "activity",
  "settings",
];

/**
 * Switching business keeps you in the same section but drops any record id — a product id
 * from one business is meaningless in another, and following it would 404 at best and show
 * someone else's row name at worst.
 */
export function BusinessSwitcher({
  businesses,
  current,
}: {
  businesses: { id: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (businesses.length < 2) return null;

  const rest = pathname.split(`/portal/businesses/${current}`)[1] ?? "";
  const section = SECTIONS.find((s) => rest.startsWith(`/${s}`)) ?? "";

  return (
    <label className="block px-3 pb-3">
      <span className="mb-1 block text-xs font-medium text-steel">Business</span>
      <select
        value={current}
        onChange={(event) => {
          router.push(
            `/portal/businesses/${event.target.value}${section ? `/${section}` : ""}`,
          );
        }}
        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </label>
  );
}
