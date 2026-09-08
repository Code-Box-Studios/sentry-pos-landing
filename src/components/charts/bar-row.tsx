import { toBars } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

/**
 * Horizontal bars with their labels and amounts always visible — used for
 * hour-of-day, day-of-week and the payment/order-type breakdowns.
 *
 * Plain divs rather than SVG: these are rows of text with a bar behind them,
 * and HTML reflows on a narrow screen where an SVG would not.
 */
export function BarRow({
  rows,
  title,
}: {
  rows: { label: string; value: number }[];
  title: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-steel">Nothing in this period.</p>
    );
  }

  const widths = toBars(rows.map((r) => r.value));

  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{title}</figcaption>
      {rows.map((row, index) => (
        <div
          key={row.label}
          className="grid grid-cols-[5rem_1fr_6rem] items-center gap-3"
        >
          <span className="truncate text-sm text-charcoal">{row.label}</span>
          <span className="h-2 rounded-full bg-hairline">
            <span
              data-bar=""
              className="block h-2 rounded-full bg-brand-green-dark"
              style={{ width: `${widths[index] * 100}%` }}
            />
          </span>
          <span className="text-right text-sm tabular-nums text-charcoal">
            {formatPesosOr(row.value)}
          </span>
        </div>
      ))}
    </figure>
  );
}
