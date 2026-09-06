import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  danger: "border-danger/30 bg-danger-bg text-danger",
  warn: "border-warn-text/25 bg-warn-bg text-warn-text",
  info: "border-hairline bg-surface text-slate",
} as const;

export function Alert({
  tone = "danger",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
