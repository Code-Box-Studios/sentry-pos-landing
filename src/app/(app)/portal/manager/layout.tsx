import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { portalNav } from "@/components/app/portal-nav";
import { getManagerContext } from "@/lib/api/manager";
export default async function ManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getManagerContext();
  return (
    <AppShell
      title={context.business.name}
      nav={portalNav("manager")}
      aside={
        <p className="px-3 pb-4 text-sm text-steel">
          {context.name} · Manager
          <br />
          Assigned branches only
        </p>
      }
    >
      {children}
    </AppShell>
  );
}
