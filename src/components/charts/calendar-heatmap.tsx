import { toHeatmapWeeks } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

/**
 * The month grid — "which days feed us" at a glance.
 *
 * Shading is an opacity over one brand colour rather than a colour ramp, so it
 * stays legible to colour-blind readers and needs no palette. Each cell carries
 * its date and amount in a `title`, so the figures are readable without a chart
 * library's tooltip.
 */
export function CalendarHeatmap({
  days,
  title,
}: {
  days: { date: string; value: number }[];
  title: string;
}) {
  if (days.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-steel">No sales in this period.</p>
    );
  }

  const weeks = toHeatmapWeeks(days);

  return (
    <figure className="space-y-2">
      <div className="flex gap-1 overflow-x-auto" aria-label={title}>
        {weeks.map((week) => (
          <div key={week[0].date} className="flex flex-col gap-1">
            {/* Pad the first week so weekdays line up down the columns. */}
            {week[0].weekday > 0
              ? Array.from({ length: week[0].weekday }, (_, i) => (
                  <div key={`pad-${i}`} className="h-4 w-4" />
                ))
              : null}
            {week.map((cell) => (
              <div
                key={cell.date}
                data-date={cell.date}
                title={`${cell.date} · ${formatPesosOr(cell.value)}`}
                className="h-4 w-4 rounded-sm bg-brand-green-dark"
                // A floor keeps a zero day visible as a cell rather than a hole.
                style={{ opacity: 0.12 + cell.intensity * 0.88 }}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-steel">{title}</figcaption>
    </figure>
  );
}
