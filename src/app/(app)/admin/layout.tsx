import { AppShell } from "@/components/app/app-shell";

// Only sections that exist get a nav item — a link to a route that is not built is a link
// to a 404. A business's activity log is reached from that business, not from the sidebar.
const NAV = [{ href: "/admin", label: "Owners" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Sentry — platform" nav={NAV}>
      {children}
    </AppShell>
  );
}
