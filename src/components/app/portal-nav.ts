import type { NavItem } from "./nav";

/**
 * The portal's top-level nav, shared by the dashboard, this list and every
 * analytics tab. One definition, so a new section cannot appear in some places
 * and not others.
 */
export const PORTAL_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/analytics/overview", label: "Analytics" },
  { href: "/portal/businesses", label: "Businesses" },
  { href: "/portal/notifications", label: "Notifications" },
  { href: "/portal/settings", label: "Settings" },
];

export function portalNav(role: "owner" | "manager"): NavItem[] {
  if (role === "owner") return PORTAL_NAV;
  const base = "/portal/manager";
  return [
    { href: base, label: "Dashboard" },
    { href: "/portal/analytics/overview", label: "Analytics" },
    { href: `${base}/stock`, label: "Stock" },
    { href: `${base}/products`, label: "Products" },
    { href: `${base}/terminals`, label: "Terminals" },
    { href: `${base}/activity`, label: "Activity" },
    { href: `${base}/alerts`, label: "Alerts" },
  ];
}
export function businessNav(
  businessId: string,
  role: "owner" | "manager",
): NavItem[] {
  if (role === "manager") return portalNav(role);
  const base = `/portal/businesses/${businessId}`;
  return [
    { href: base, label: "Overview" },
    { href: `${base}/catalog`, label: "Products" },
    { href: `${base}/categories`, label: "Categories" },
    { href: `${base}/modifiers`, label: "Modifiers" },
    { href: `${base}/discounts`, label: "Discounts" },
    { href: `${base}/branches`, label: "Branches" },
    { href: `${base}/terminals`, label: "Terminals" },
    { href: `${base}/activity`, label: "Activity" },
    { href: `${base}/staff`, label: "Staff" },
    { href: `${base}/settings`, label: "Settings" },
    { href: "/portal/notifications", label: "Notifications" },
    { href: "/portal", label: "← All businesses" },
  ];
}
