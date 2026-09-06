import type { ReactNode } from "react";
import { Nav, type NavItem } from "./nav";

/**
 * Desktop-first: the portal is a keyboard-and-mouse surface, the POS terminal is the tablet
 * one. Below `lg` the sidebar becomes a horizontal strip above the content rather than a
 * drawer — one fewer piece of state, and every section stays one tap away.
 */
export function AppShell({
  title,
  nav,
  aside,
  children,
}: {
  title: string;
  nav: NavItem[];
  /** Rendered between the title and the nav — the business switcher lives here. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-hairline bg-card p-4 lg:border-b-0 lg:border-r">
        <p className="px-3 pb-3 text-sm font-semibold tracking-tight text-ink">{title}</p>
        {aside}
        <Nav items={nav} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-end border-b border-hairline bg-card px-6 py-3">
          <a href="/logout" className="text-sm text-steel hover:text-charcoal hover:underline">
            Sign out
          </a>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
