import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-charcoal">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-steel">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
