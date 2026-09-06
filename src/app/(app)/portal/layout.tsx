/**
 * Deliberately chrome-free. `/portal` and `/portal/businesses/[businessId]` need different
 * sidebars, and a shell at this level would render in addition to — not instead of — theirs.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
