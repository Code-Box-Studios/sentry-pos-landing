import { AppShell } from "@/components/app/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Sentry" nav={[{ href: "/portal", label: "Businesses" }]}>
      {children}
    </AppShell>
  );
}
