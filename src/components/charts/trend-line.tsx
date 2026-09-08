import { toPolyline } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

const BOX = { width: 600, height: 160 };

/**
 * A labelled line chart.
 *
 * The peak is printed beside the chart deliberately: a chart must never be the
 * only way to read a number, and this is the cheapest way to keep that true
 * without tooltips, which would make the whole thing a client component.
 */
export function TrendLine({
  points,
  title,
}: {
  points: { label: string; value: number }[];
  title: string;
}) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-steel">No sales in this period.</p>;
  }

  const line = toPolyline(
    points.map((p) => p.value),
    BOX,
  );
  const peak = Math.max(...points.map((p) => p.value));

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-40 w-full text-brand-green-dark"
        role="img"
        preserveAspectRatio="none"
      >
        <title>{title}</title>
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="flex justify-between text-xs text-steel">
        <span>{points[0].label}</span>
        <span>Peak {formatPesosOr(peak)}</span>
        <span>{points[points.length - 1].label}</span>
      </figcaption>
    </figure>
  );
}
